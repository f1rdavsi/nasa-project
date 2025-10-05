"""
Linear regression forecasting model.
"""
import numpy as np
from datetime import datetime, date, timedelta
from typing import List, Dict, Any
from .base_model import BaseForecastModel

class LinearRegressionModel(BaseForecastModel):
    """Linear regression forecasting model."""
    
    def forecast(self, historical_data: List[Dict[str, Any]], forecast_days: int) -> List[Dict[str, Any]]:
        """Forecast using linear regression."""
        aqi_values = self._prepare_data(historical_data)
        
        if len(aqi_values) < 3:
            return self._default_forecast(forecast_days)
        
        # Create time series
        X = np.arange(len(aqi_values)).reshape(-1, 1)
        y = np.array(aqi_values)
        
        # Simple linear regression using numpy
        X_mean = X.mean()
        y_mean = y.mean()
        
        numerator = ((X.flatten() - X_mean) * (y - y_mean)).sum()
        denominator = ((X.flatten() - X_mean) ** 2).sum()
        
        if denominator == 0:
            return self._default_forecast(forecast_days)
        
        slope = numerator / denominator
        intercept = y_mean - slope * X_mean
        
        # Generate predictions
        predictions = []
        start_date = date.today() + timedelta(days=1)
        
        for i in range(forecast_days):
            future_x = len(aqi_values) + i
            predicted_aqi = slope * future_x + intercept
            predicted_aqi = max(0, min(500, round(predicted_aqi)))
            
            forecast_date = start_date + timedelta(days=i)
            predictions.append({
                'date': forecast_date,
                'predicted_aqi': predicted_aqi,
                'category': self._get_aqi_category(predicted_aqi)
            })
        
        return predictions
    
    def get_name(self) -> str:
        return "Linear Regression"
    
    def get_description(self) -> str:
        return "Linear trend-based forecasting using least squares regression"
    
    def get_min_data_points(self) -> int:
        return 3
    
    def get_best_for(self) -> str:
        return "Data with clear linear trends"
    
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
