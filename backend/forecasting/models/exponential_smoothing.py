"""
Exponential smoothing forecasting model.
"""
import numpy as np
from datetime import date, timedelta
from typing import List, Dict, Any
from .base_model import BaseForecastModel

class ExponentialSmoothingModel(BaseForecastModel):
    """Exponential smoothing forecasting model."""
    
    def __init__(self, alpha: float = 0.3):
        self.alpha = alpha
    
    def forecast(self, historical_data: List[Dict[str, Any]], forecast_days: int) -> List[Dict[str, Any]]:
        """Forecast using exponential smoothing."""
        aqi_values = self._prepare_data(historical_data)
        
        if len(aqi_values) < 3:
            return self._default_forecast(forecast_days)
        
        # Calculate exponentially smoothed values
        smoothed = [aqi_values[0]]
        for i in range(1, len(aqi_values)):
            smoothed_value = self.alpha * aqi_values[i] + (1 - self.alpha) * smoothed[i-1]
            smoothed.append(smoothed_value)
        
        # Calculate trend
        if len(smoothed) > 1:
            trend = smoothed[-1] - smoothed[-2]
        else:
            trend = 0
        
        # Generate predictions
        predictions = []
        start_date = date.today() + timedelta(days=1)
        last_smoothed = smoothed[-1]
        
        for i in range(forecast_days):
            predicted_aqi = last_smoothed + (trend * (i + 1))
            predicted_aqi = max(0, min(500, round(predicted_aqi)))
            
            forecast_date = start_date + timedelta(days=i)
            predictions.append({
                'date': forecast_date,
                'predicted_aqi': predicted_aqi,
                'category': self._get_aqi_category(predicted_aqi)
            })
        
        return predictions
    
    def get_name(self) -> str:
        return f"Exponential Smoothing (α={self.alpha})"
    
    def get_description(self) -> str:
        return "Weighted average forecasting with exponential decay"
    
    def get_min_data_points(self) -> int:
        return 3
    
    def get_best_for(self) -> str:
        return "Data with recent trends and patterns"
    
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
