"""
OpenAQ API service for fetching air pollution data.
"""
import asyncio
import logging
from datetime import datetime, date, timedelta
from typing import List, Dict, Optional, Any, Tuple
import httpx
from sqlmodel import Session, select
from db.models import Station, Measurement, CacheMetadata
from services.aqi import AQICalculator

logger = logging.getLogger(__name__)

class OpenAQService:
    """Service for interacting with OpenAQ API and caching data."""
    
    BASE_URL = "https://api.openaq.org/v2"
    
    def __init__(self, session: Session):
        self.session = session
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    async def get_latest_measurements(
        self, 
        lat: float, 
        lon: float, 
        radius_m: int = 10000,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get latest measurements from OpenAQ API.
        
        Args:
            lat: Latitude
            lon: Longitude  
            radius_m: Search radius in meters
            limit: Maximum number of results
            
        Returns:
            List of measurement dictionaries
        """
        try:
            url = f"{self.BASE_URL}/latest"
            params = {
                "coordinates": f"{lat},{lon}",
                "radius": radius_m,
                "limit": limit,
                "has_geo": True
            }
            
            response = await self.client.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            return data.get("results", [])
            
        except httpx.HTTPError as e:
            logger.error(f"OpenAQ API error: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error fetching latest measurements: {e}")
            return []
    
    async def get_measurements(
        self,
        country: Optional[str] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        parameters: List[str] = None,
        limit: int = 1000
    ) -> List[Dict[str, Any]]:
        """
        Get historical measurements from OpenAQ API with pagination.
        
        Args:
            country: Country code
            lat: Latitude
            lon: Longitude
            start_date: Start date for measurements
            end_date: End date for measurements
            parameters: List of pollutant parameters
            limit: Results per page
            
        Returns:
            List of measurement dictionaries
        """
        if parameters is None:
            parameters = ["pm25", "pm10", "no2", "o3", "so2", "co"]
        
        all_measurements = []
        page = 1
        
        try:
            while True:
                url = f"{self.BASE_URL}/measurements"
                params = {
                    "limit": limit,
                    "page": page,
                    "has_geo": True
                }
                
                if country:
                    params["country"] = country
                if lat is not None and lon is not None:
                    params["coordinates"] = f"{lat},{lon}"
                    params["radius"] = 50000  # 50km radius for historical data
                if start_date:
                    params["date_from"] = start_date.isoformat()
                if end_date:
                    params["date_to"] = end_date.isoformat()
                if parameters:
                    params["parameter"] = ",".join(parameters)
                
                response = await self.client.get(url, params=params)
                response.raise_for_status()
                
                data = response.json()
                results = data.get("results", [])
                
                if not results:
                    break
                    
                all_measurements.extend(results)
                
                # Check if we have more pages
                meta = data.get("meta", {})
                if meta.get("page", 1) >= meta.get("last_page", 1):
                    break
                    
                page += 1
                
                # Rate limiting
                await asyncio.sleep(0.1)
                
        except httpx.HTTPError as e:
            logger.error(f"OpenAQ API error: {e}")
        except Exception as e:
            logger.error(f"Unexpected error fetching measurements: {e}")
        
        return all_measurements
    
    async def get_locations(
        self,
        country: Optional[str] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        radius_m: int = 50000
    ) -> List[Dict[str, Any]]:
        """
        Get station locations from OpenAQ API.
        
        Args:
            country: Country code
            lat: Latitude
            lon: Longitude
            radius_m: Search radius in meters
            
        Returns:
            List of location dictionaries
        """
        try:
            url = f"{self.BASE_URL}/locations"
            params = {
                "has_geo": True,
                "limit": 1000
            }
            
            if country:
                params["country"] = country
            if lat is not None and lon is not None:
                params["coordinates"] = f"{lat},{lon}"
                params["radius"] = radius_m
            
            response = await self.client.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            return data.get("results", [])
            
        except httpx.HTTPError as e:
            logger.error(f"OpenAQ API error: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error fetching locations: {e}")
            return []
    
    def cache_stations(self, locations: List[Dict[str, Any]]) -> None:
        """Cache station data to database."""
        for location in locations:
            station_id = location.get("id")
            if not station_id:
                continue
                
            # Check if station already exists
            existing = self.session.exec(
                select(Station).where(Station.station_id == station_id)
            ).first()
            
            if existing:
                # Update existing station
                existing.name = location.get("name", existing.name)
                existing.country = location.get("country", existing.country)
                existing.city = location.get("city", existing.city)
                existing.latitude = location.get("coordinates", {}).get("latitude", existing.latitude)
                existing.longitude = location.get("coordinates", {}).get("longitude", existing.longitude)
                existing.timezone = location.get("timezone", existing.timezone)
                existing.updated_at = datetime.utcnow()
            else:
                # Create new station
                station = Station(
                    station_id=station_id,
                    name=location.get("name", ""),
                    country=location.get("country", ""),
                    city=location.get("city"),
                    latitude=location.get("coordinates", {}).get("latitude", 0.0),
                    longitude=location.get("coordinates", {}).get("longitude", 0.0),
                    timezone=location.get("timezone")
                )
                self.session.add(station)
        
        self.session.commit()
    
    def cache_measurements(
        self, 
        measurements: List[Dict[str, Any]], 
        cache_key: str
    ) -> int:
        """
        Cache and aggregate measurements to daily values.
        
        Args:
            measurements: Raw measurements from OpenAQ
            cache_key: Cache key for metadata tracking
            
        Returns:
            Number of cached measurements
        """
        # Group measurements by station and date
        daily_data = {}
        
        for measurement in measurements:
            station_id = measurement.get("locationId")
            if not station_id:
                continue
                
            # Get station from database
            station = self.session.exec(
                select(Station).where(Station.station_id == station_id)
            ).first()
            
            if not station:
                continue
            
            # Parse date (OpenAQ uses UTC)
            date_str = measurement.get("date", {}).get("utc")
            if not date_str:
                continue
                
            try:
                measurement_date = datetime.fromisoformat(date_str.replace("Z", "+00:00")).date()
            except ValueError:
                continue
            
            parameter = measurement.get("parameter", "").lower()
            value = measurement.get("value")
            
            if value is None:
                continue
            
            # Group by station and date
            key = (station.id, measurement_date)
            if key not in daily_data:
                daily_data[key] = {
                    "station_id": station.id,
                    "date": measurement_date,
                    "measurements": {}
                }
            
            daily_data[key]["measurements"][parameter] = value
        
        # Calculate daily AQI and store
        cached_count = 0
        for (station_id, measurement_date), data in daily_data.items():
            measurements_dict = data["measurements"]
            
            # Calculate AQI
            aqi, category, breakdown = AQICalculator.calculate_daily_aqi(measurements_dict)
            
            # Check if measurement already exists
            existing = self.session.exec(
                select(Measurement).where(
                    Measurement.station_id == station_id,
                    Measurement.date == measurement_date
                )
            ).first()
            
            if existing:
                # Update existing measurement
                existing.pm25 = measurements_dict.get("pm25")
                existing.pm10 = measurements_dict.get("pm10")
                existing.no2 = measurements_dict.get("no2")
                existing.o3 = measurements_dict.get("o3")
                existing.so2 = measurements_dict.get("so2")
                existing.co = measurements_dict.get("co")
                existing.aqi = aqi
                existing.aqi_category = category
                existing.updated_at = datetime.utcnow()
            else:
                # Create new measurement
                measurement = Measurement(
                    station_id=station_id,
                    date=measurement_date,
                    pm25=measurements_dict.get("pm25"),
                    pm10=measurements_dict.get("pm10"),
                    no2=measurements_dict.get("no2"),
                    o3=measurements_dict.get("o3"),
                    so2=measurements_dict.get("so2"),
                    co=measurements_dict.get("co"),
                    aqi=aqi,
                    aqi_category=category
                )
                self.session.add(measurement)
                cached_count += 1
        
        # Update cache metadata
        self._update_cache_metadata(cache_key, cached_count)
        
        self.session.commit()
        return cached_count
    
    def _update_cache_metadata(self, cache_key: str, data_count: int) -> None:
        """Update cache metadata."""
        existing = self.session.exec(
            select(CacheMetadata).where(CacheMetadata.cache_key == cache_key)
        ).first()
        
        if existing:
            existing.last_updated = datetime.utcnow()
            existing.data_count += data_count
        else:
            metadata = CacheMetadata(
                cache_key=cache_key,
                data_count=data_count,
                expires_at=datetime.utcnow() + timedelta(hours=24)
            )
            self.session.add(metadata)
    
    def get_cached_measurements(
        self,
        country: Optional[str] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Measurement]:
        """Get cached measurements from database."""
        query = select(Measurement).join(Station)
        
        if country:
            query = query.where(Station.country == country)
        if lat is not None and lon is not None:
            # Simple bounding box for now (could be improved with proper distance calculation)
            lat_range = 0.5  # ~50km
            lon_range = 0.5
            query = query.where(
                Station.latitude.between(lat - lat_range, lat + lat_range),
                Station.longitude.between(lon - lon_range, lon + lon_range)
            )
        if start_date:
            query = query.where(Measurement.date >= start_date)
        if end_date:
            query = query.where(Measurement.date <= end_date)
        
        return self.session.exec(query).all()
    
    def is_cache_fresh(self, cache_key: str, max_age_hours: int = 24) -> bool:
        """Check if cache is fresh."""
        metadata = self.session.exec(
            select(CacheMetadata).where(CacheMetadata.cache_key == cache_key)
        ).first()
        
        if not metadata:
            return False
        
        age = datetime.utcnow() - metadata.last_updated
        return age.total_seconds() < max_age_hours * 3600
