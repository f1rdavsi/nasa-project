"""
Moving average forecasting model.
"""
import numpy as np
from datetime import date, timedelta
from typing import List, Dict, Any
from .base_model import BaseForecastModel

class MovingAverageModel(BaseForecastModel):
    """Moving average forecasting model."""
    
    def __init__(self, window: int = 7):
        self.window = window
    
    def forecast(self, historical_data: List[Dict[str, Any]], forecast_days: int) -> List[Dict[str, Any]]:
        """Forecast using moving average."""
        aqi_values = self._prepare_data(historical_data)
        
        if len(aqi_values) < 3:
            return self._default_forecast(forecast_days)
        
        # Adjust window if data is too short
        window = min(self.window, len(aqi_values) // 2)
        window = max(3, window)
        
        # Calculate moving average
        ma = np.convolve(aqi_values, np.ones(window)/window, mode='valid')
        
        # Calculate trend from moving average
        if len(ma) > 1:
            trend = (ma[-1] - ma[0]) / len(ma)
        else:
            trend = 0
        
        # Generate predictions
        predictions = []
        start_date = date.today() + timedelta(days=1)
        last_ma = ma[-1] if len(ma) > 0 else np.mean(aqi_values)
        
        for i in range(forecast_days):
            predicted_aqi = last_ma + (trend * (i + 1))
            predicted_aqi = max(0, min(500, round(predicted_aqi)))
            
            forecast_date = start_date + timedelta(days=i)
            predictions.append({
                'date': forecast_date,
                'predicted_aqi': predicted_aqi,
                'category': self._get_aqi_category(predicted_aqi)
            })
        
        return predictions
    
    def get_name(self) -> str:
        return f"Moving Average (window={self.window})"
    
    def get_description(self) -> str:
        return "Smoothing-based forecasting using moving averages"
    
    def get_min_data_points(self) -> int:
        return 5
    
    def get_best_for(self) -> str:
        return "Data with noise that needs smoothing"
    
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
