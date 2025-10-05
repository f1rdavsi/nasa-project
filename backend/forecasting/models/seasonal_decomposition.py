"""
Seasonal decomposition forecasting model.
"""
import numpy as np
from datetime import date, timedelta
from typing import List, Dict, Any
from .base_model import BaseForecastModel

class SeasonalDecompositionModel(BaseForecastModel):
    """Seasonal decomposition forecasting model."""
    
    def __init__(self, season_length: int = 7):
        self.season_length = season_length
    
    def forecast(self, historical_data: List[Dict[str, Any]], forecast_days: int) -> List[Dict[str, Any]]:
        """Forecast using seasonal decomposition."""
        aqi_values = self._prepare_data(historical_data)
        
        if len(aqi_values) < 14:  # Need at least 2 weeks
            # Fallback to moving average
            from .moving_average import MovingAverageModel
            ma_model = MovingAverageModel()
            return ma_model.forecast(historical_data, forecast_days)
        
        # Calculate seasonal component
        seasonal_component = []
        
        for day in range(self.season_length):
            day_values = [aqi_values[i] for i in range(day, len(aqi_values), self.season_length)]
            if day_values:
                seasonal_component.append(np.mean(day_values))
            else:
                seasonal_component.append(np.mean(aqi_values))
        
        # Calculate trend
        trend = (np.mean(aqi_values[-7:]) - np.mean(aqi_values[:7])) / len(aqi_values)
        
        # Generate predictions
        predictions = []
        start_date = date.today() + timedelta(days=1)
        base_aqi = np.mean(aqi_values[-7:])
        
        for i in range(forecast_days):
            forecast_date = start_date + timedelta(days=i)
            day_of_week = forecast_date.weekday()
            seasonal = seasonal_component[day_of_week % self.season_length]
            
            predicted_aqi = base_aqi + (trend * (i + 1)) + (seasonal - np.mean(seasonal_component))
            predicted_aqi = max(0, min(500, round(predicted_aqi)))
            
            predictions.append({
                'date': forecast_date,
                'predicted_aqi': predicted_aqi,
                'category': self._get_aqi_category(predicted_aqi)
            })
        
        return predictions
    
    def get_name(self) -> str:
        return f"Seasonal Decomposition (period={self.season_length})"
    
    def get_description(self) -> str:
        return "Forecasting with seasonal pattern recognition"
    
    def get_min_data_points(self) -> int:
        return 14
    
    def get_best_for(self) -> str:
        return "Data with weekly or seasonal patterns"
    
    def _default_forecast(self, forecast_days: int) -> List[Dict[str, Any]]:
        """Default forecast for insufficient data."""
        predictions = []
        start_date = date.today() + timedelta(days=1)
        
        for i in range(forecast_days):
            forecast_date = start_date + timedelta(days=i)
            predictions.append({
                'date': forecast_date,
                'predicted_aqi': 75,
                'category': "Moderate"
            })
        
        return predictions
