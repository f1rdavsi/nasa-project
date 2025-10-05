"""
Pollution-related API endpoints.
"""
import logging
from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlmodel import Session, select
from db.database import get_session
from db.models import Station, Measurement
from schemas.pollution import (
    CurrentPollutionResponse, HistoricalPollutionRequest, HistoricalPollutionResponse,
    PredictionRequest, PredictionResponse, DailyMeasurement, PredictionPoint, Alert
)
from services.openaq_service import OpenAQService
from services.timegpt_service import TimeGPTService
from services.aqi import AQICalculator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/pollution", tags=["pollution"])

@router.get("/current/location", response_model=CurrentPollutionResponse)
async def get_current_pollution(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    radius_m: int = Query(10000, description="Search radius in meters"),
    session: Session = Depends(get_session)
):
    """
    Get current air pollution measurements for a specific location.
    
    Fetches the latest measurements from OpenAQ stations near the given coordinates
    and calculates current AQI values.
    
    Args:
        lat: Latitude coordinate
        lon: Longitude coordinate
        radius_m: Search radius in meters (default: 10km)
        session: Database session
        
    Returns:
        CurrentPollutionResponse with current pollution data and AQI
    """
    try:
        async with OpenAQService(session) as openaq:
            # Get latest measurements from OpenAQ
            measurements_data = await openaq.get_latest_measurements(lat, lon, radius_m)
            
            if not measurements_data:
                # Return mock data if no real data available
                return _get_mock_current_pollution(lat, lon)
            
            # Process measurements
            processed_measurements = []
            aqi_breakdown = {}
            station_count = len(set(m.get("locationId") for m in measurements_data))
            
            # Group measurements by parameter and calculate averages
            parameter_values = {}
            for measurement in measurements_data:
                parameter = measurement.get("parameter", "").lower()
                value = measurement.get("value")
                last_updated = measurement.get("date", {}).get("utc")
                
                if value is not None and parameter in ["pm25", "pm10", "no2", "o3", "so2", "co"]:
                    if parameter not in parameter_values:
                        parameter_values[parameter] = []
                    parameter_values[parameter].append({
                        "value": value,
                        "last_updated": last_updated
                    })
            
            # Calculate AQI for each parameter
            for parameter, values in parameter_values.items():
                if values:
                    avg_value = sum(v["value"] for v in values) / len(values)
                    aqi = AQICalculator.calculate_aqi(avg_value, parameter)
                    
                    if aqi is not None:
                        aqi_breakdown[parameter] = aqi
                        processed_measurements.append({
                            "parameter": parameter.upper(),
                            "value": round(avg_value, 2),
                            "unit": "μg/m³" if parameter in ["pm25", "pm10"] else "ppb",
                            "last_updated": values[0]["last_updated"]
                        })
            
            # Calculate overall AQI
            if aqi_breakdown:
                overall_aqi = max(aqi_breakdown.values())
                aqi_category = AQICalculator.get_aqi_category(overall_aqi)
            else:
                overall_aqi = 0
                aqi_category = "Unknown"
            
            return CurrentPollutionResponse(
                location={"lat": lat, "lon": lon, "radius_m": radius_m},
                measurements=processed_measurements,
                aqi=overall_aqi,
                aqi_category=aqi_category,
                aqi_breakdown=aqi_breakdown,
                last_updated=datetime.utcnow(),
                station_count=station_count
            )
            
    except Exception as e:
        logger.error(f"Error fetching current pollution data: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch current pollution data"
        )

@router.get("/history", response_model=HistoricalPollutionResponse)
async def get_historical_pollution(
    country: Optional[str] = Query(None, description="Country code"),
    lat: Optional[float] = Query(None, description="Latitude"),
    lon: Optional[float] = Query(None, description="Longitude"),
    start: date = Query(..., description="Start date (YYYY-MM-DD)"),
    end: date = Query(..., description="End date (YYYY-MM-DD)"),
    parameters: str = Query("pm25,pm10,no2,o3", description="Comma-separated parameters"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(100, ge=1, le=1000, description="Page size"),
    session: Session = Depends(get_session)
):
    """
    Get historical air pollution data for a location and date range.
    
    Fetches daily aggregated pollution measurements from cache or OpenAQ API.
    Supports pagination for large date ranges.
    
    Args:
        country: Country code (optional)
        lat: Latitude coordinate (optional)
        lon: Longitude coordinate (optional)
        start: Start date for historical data
        end: End date for historical data
        parameters: Comma-separated list of parameters to include
        page: Page number for pagination
        page_size: Number of results per page
        session: Database session
        
    Returns:
        HistoricalPollutionResponse with historical pollution data
    """
    try:
        # Validate date range
        if start > end:
            raise HTTPException(
                status_code=400,
                detail="Start date must be before end date"
            )
        
        if (end - start).days > 365:
            raise HTTPException(
                status_code=400,
                detail="Date range cannot exceed 365 days"
            )
        
        # Parse parameters
        param_list = [p.strip().lower() for p in parameters.split(",")]
        
        async with OpenAQService(session) as openaq:
            # Check cache first
            cache_key = f"history_{country or 'global'}_{lat or 0}_{lon or 0}_{start}_{end}"
            
            if not openaq.is_cache_fresh(cache_key, max_age_hours=24):
                logger.info(f"Cache miss for {cache_key}, fetching from OpenAQ")
                
                # Fetch and cache data from OpenAQ
                measurements_data = await openaq.get_measurements(
                    country=country,
                    lat=lat,
                    lon=lon,
                    start_date=start,
                    end_date=end,
                    parameters=param_list
                )
                
                if measurements_data:
                    # Cache stations
                    locations = await openaq.get_locations(country, lat, lon)
                    openaq.cache_stations(locations)
                    
                    # Cache measurements
                    openaq.cache_measurements(measurements_data, cache_key)
            
            # Get cached measurements
            cached_measurements = openaq.get_cached_measurements(
                country=country,
                lat=lat,
                lon=lon,
                start_date=start,
                end_date=end
            )
            
            if not cached_measurements:
                # Return mock data if no real data available
                return _get_mock_historical_pollution(country, lat, lon, start, end)
            
            # Convert to response format
            daily_measurements = []
            for measurement in cached_measurements:
                daily_measurements.append(DailyMeasurement(
                    date=measurement.date,
                    pm25=measurement.pm25,
                    pm10=measurement.pm10,
                    no2=measurement.no2,
                    o3=measurement.o3,
                    so2=measurement.so2,
                    co=measurement.co,
                    aqi=measurement.aqi,
                    aqi_category=measurement.aqi_category,
                    station_count=1  # Simplified for now
                ))
            
            # Apply pagination
            total_count = len(daily_measurements)
            start_idx = (page - 1) * page_size
            end_idx = start_idx + page_size
            paginated_measurements = daily_measurements[start_idx:end_idx]
            
            return HistoricalPollutionResponse(
                location={"country": country, "lat": lat, "lon": lon},
                range={"start": start, "end": end},
                measurements=paginated_measurements,
                total_count=total_count,
                page=page,
                page_size=page_size
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching historical pollution data: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch historical pollution data"
        )

@router.get("/predict", response_model=PredictionResponse)
async def predict_pollution(
    country: Optional[str] = Query(None, description="Country code"),
    lat: Optional[float] = Query(None, description="Latitude"),
    lon: Optional[float] = Query(None, description="Longitude"),
    start: date = Query(..., description="Start date for prediction (YYYY-MM-DD)"),
    end: date = Query(..., description="End date for prediction (YYYY-MM-DD)"),
    model: str = Query("openrouter", description="Prediction model to use"),
    session: Session = Depends(get_session)
):
    """
    Predict air pollution (AQI) for a future date range.
    
    Uses OpenRouter LLM or fallback statistical methods to forecast AQI values
    based on historical data.
    
    Args:
        country: Country code (optional)
        lat: Latitude coordinate (optional)
        lon: Longitude coordinate (optional)
        start: Start date for predictions
        end: End date for predictions
        model: Prediction model to use (currently 'openrouter')
        session: Database session
        
    Returns:
        PredictionResponse with forecasted AQI values and alerts
    """
    try:
        # Validate date range
        if start <= date.today():
            raise HTTPException(
                status_code=400,
                detail="Start date must be in the future"
            )
        
        if (end - start).days > 30:
            raise HTTPException(
                status_code=400,
                detail="Prediction range cannot exceed 30 days"
            )
        
        # Get historical data for forecasting
        async with OpenAQService(session) as openaq:
            # Get last 30 days of historical data
            historical_end = date.today() - timedelta(days=1)
            historical_start = historical_end - timedelta(days=30)
            
            cached_measurements = openaq.get_cached_measurements(
                country=country,
                lat=lat,
                lon=lon,
                start_date=historical_start,
                end_date=historical_end
            )
            
            if not cached_measurements:
                # Use mock historical data for forecasting
                historical_data = _get_mock_historical_data_for_forecast()
            else:
                # Convert to format expected by TimeGPT
                historical_data = []
                for measurement in cached_measurements:
                    if measurement.aqi is not None:
                        historical_data.append({
                            "date": measurement.date,
                            "aqi": measurement.aqi
                        })
            
            # Generate forecast
            forecast_days = (end - start).days + 1
            
            async with TimeGPTService() as timegpt:
                predictions, used_fallback = await timegpt.forecast_aqi(
                    historical_data, forecast_days
                )
                
                # Get metadata and normalize keys
                metadata = await timegpt.get_forecast_metadata()
                # Prefer a single flag name
                if "fallback_used" in metadata:
                    del metadata["fallback_used"]
                metadata["used_fallback"] = used_fallback
            
            # Convert predictions to response format
            prediction_points = []
            alerts = []
            
            for i, prediction in enumerate(predictions):
                pred_date = start + timedelta(days=i)
                aqi_value = prediction.get("predicted_aqi", 0)
                category = prediction.get("category", "Unknown")
                confidence = prediction.get("confidence")
                if not confidence:
                    # Synthesize reasonable confidence if missing
                    margin = max(5, aqi_value * 0.15)
                    confidence = {
                        "low_80": max(0, min(500, round(aqi_value - margin))),
                        "high_80": max(0, min(500, round(aqi_value + margin))),
                        "low_95": max(0, min(500, round(aqi_value - margin * 1.5))),
                        "high_95": max(0, min(500, round(aqi_value + margin * 1.5)))
                    }
                
                prediction_points.append(PredictionPoint(
                    date=pred_date,
                    predicted_aqi=aqi_value,
                    category=category,
                    confidence=confidence
                ))
                
                # Check for alerts (AQI > 150)
                if aqi_value > 150:
                    alerts.append(Alert(
                        date=pred_date,
                        aqi=aqi_value,
                        category=category,
                        message=f"AQI > 150 predicted for {pred_date}"
                    ))
            
            return PredictionResponse(
                location={"country": country, "lat": lat, "lon": lon},
                range={"start": start, "end": end},
                predictions=prediction_points,
                alerts=alerts,
                meta=metadata
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating pollution predictions: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate pollution predictions"
        )

def _get_mock_current_pollution(lat: float, lon: float) -> CurrentPollutionResponse:
    """Generate mock current pollution data for testing."""
    return CurrentPollutionResponse(
        location={"lat": lat, "lon": lon, "radius_m": 10000},
        measurements=[
            {"parameter": "PM25", "value": 25.5, "unit": "μg/m³", "last_updated": datetime.utcnow().isoformat()},
            {"parameter": "PM10", "value": 45.2, "unit": "μg/m³", "last_updated": datetime.utcnow().isoformat()},
            {"parameter": "NO2", "value": 35.8, "unit": "ppb", "last_updated": datetime.utcnow().isoformat()},
            {"parameter": "O3", "value": 65.2, "unit": "ppb", "last_updated": datetime.utcnow().isoformat()}
        ],
        aqi=75,
        aqi_category="Moderate",
        aqi_breakdown={"pm25": 75, "pm10": 65, "no2": 55, "o3": 70},
        last_updated=datetime.utcnow(),
        station_count=3
    )

def _get_mock_historical_pollution(
    country: Optional[str], 
    lat: Optional[float], 
    lon: Optional[float], 
    start: date, 
    end: date
) -> HistoricalPollutionResponse:
    """Generate mock historical pollution data for testing."""
    measurements = []
    current_date = start
    
    while current_date <= end:
        # Generate realistic AQI values with some variation
        import random
        base_aqi = 60 + random.randint(-20, 40)
        aqi = max(0, min(500, base_aqi))
        category = AQICalculator.get_aqi_category(aqi)
        
        measurements.append(DailyMeasurement(
            date=current_date,
            pm25=round(random.uniform(10, 50), 1),
            pm10=round(random.uniform(20, 80), 1),
            no2=round(random.uniform(20, 60), 1),
            o3=round(random.uniform(40, 100), 1),
            aqi=aqi,
            aqi_category=category,
            station_count=2
        ))
        
        current_date += timedelta(days=1)
    
    return HistoricalPollutionResponse(
        location={"country": country, "lat": lat, "lon": lon},
        range={"start": start, "end": end},
        measurements=measurements,
        total_count=len(measurements),
        page=1,
        page_size=100
    )

def _get_mock_historical_data_for_forecast() -> List[Dict[str, Any]]:
    """Generate mock historical data for forecasting."""
    import random
    data = []
    base_date = date.today() - timedelta(days=30)
    
    for i in range(30):
        current_date = base_date + timedelta(days=i)
        # Generate realistic AQI with some trend
        base_aqi = 50 + (i * 2) + random.randint(-15, 15)
        aqi = max(0, min(500, base_aqi))
        
        data.append({
            "date": current_date,
            "aqi": aqi
        })
    
    return data
