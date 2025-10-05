"""
Simple ARIMA-like forecasting model.
"""
import numpy as np
from datetime import date, timedelta
from typing import List, Dict, Any
from .base_model import BaseForecastModel

class ARIMAModel(BaseForecastModel):
    """Simple ARIMA-like forecasting model."""
    
    def forecast(self, historical_data: List[Dict[str, Any]], forecast_days: int) -> List[Dict[str, Any]]:
        """Forecast using simple ARIMA approach."""
        aqi_values = self._prepare_data(historical_data)
        
        if len(aqi_values) < 7:
            return self._default_forecast(forecast_days)
        
        # Calculate moving averages
        window = min(7, len(aqi_values) // 3)
        if window < 3:
            window = 3
        
        ma = np.convolve(aqi_values, np.ones(window)/window, mode='valid')
        
        # Calculate trend
        if len(ma) > 1:
            trend = (ma[-1] - ma[0]) / len(ma)
        else:
            trend = 0
        
        # Calculate seasonal component (if enough data)
        if len(aqi_values) >= 14:
            recent_avg = np.mean(aqi_values[-7:])
            older_avg = np.mean(aqi_values[-14:-7])
            seasonal = recent_avg - older_avg
        else:
            seasonal = 0
        
        # Generate predictions
        predictions = []
        start_date = date.today() + timedelta(days=1)
        last_aqi = aqi_values[-1]
        
        for i in range(forecast_days):
            predicted_aqi = last_aqi + (trend * (i + 1)) + (seasonal * ((i + 1) % 7))
            predicted_aqi = max(0, min(500, round(predicted_aqi)))
            
            forecast_date = start_date + timedelta(days=i)
            predictions.append({
                'date': forecast_date,
                'predicted_aqi': predicted_aqi,
                'category': self._get_aqi_category(predicted_aqi)
            })
        
        return predictions
    
    def get_name(self) -> str:
        return "Simple ARIMA"
    
    def get_description(self) -> str:
        return "Autoregressive integrated moving average forecasting"
    
    def get_min_data_points(self) -> int:
        return 7
    
    def get_best_for(self) -> str:
        return "Time series with trends and autocorrelation"
    
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
