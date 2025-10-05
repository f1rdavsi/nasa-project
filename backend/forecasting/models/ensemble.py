"""
Ensemble forecasting model combining multiple methods.
"""
import numpy as np
from datetime import date, timedelta
from typing import List, Dict, Any
from .base_model import BaseForecastModel
from .linear_regression import LinearRegressionModel
from .moving_average import MovingAverageModel
from .exponential_smoothing import ExponentialSmoothingModel
from .seasonal_decomposition import SeasonalDecompositionModel

class EnsembleModel(BaseForecastModel):
    """Ensemble forecasting model combining multiple methods."""
    
    def __init__(self):
        self.sub_models = {
            'linear': LinearRegressionModel(),
            'moving_average': MovingAverageModel(),
            'exponential_smoothing': ExponentialSmoothingModel(),
            'seasonal': SeasonalDecompositionModel()
        }
    
    def forecast(self, historical_data: List[Dict[str, Any]], forecast_days: int) -> List[Dict[str, Any]]:
        """Forecast using ensemble of multiple models."""
        predictions_list = []
        
        # Get predictions from each sub-model
        for name, model in self.sub_models.items():
            try:
                preds = model.forecast(historical_data, forecast_days)
                predictions_list.append(preds)
            except Exception as e:
                print(f"Sub-model {name} failed: {e}")
                continue
        
        if not predictions_list:
            # Fallback to simple average
            return self._simple_average_forecast(historical_data, forecast_days)
        
        # Combine predictions using weighted average
        weights = [0.3, 0.25, 0.25, 0.2]  # Weights for each model
        combined_predictions = []
        
        for i in range(forecast_days):
            aqi_values = []
            for j, preds in enumerate(predictions_list):
                if i < len(preds):
                    aqi_values.append(preds[i]['predicted_aqi'])
            
            if aqi_values:
                # Weighted average
                weighted_aqi = sum(aqi * weights[j] for j, aqi in enumerate(aqi_values[:len(weights)]))
                if len(aqi_values) < len(weights):
                    # If fewer models succeeded, normalize weights
                    total_weight = sum(weights[:len(aqi_values)])
                    weighted_aqi = sum(aqi * weights[j] / total_weight for j, aqi in enumerate(aqi_values))
                
                predicted_aqi = max(0, min(500, round(weighted_aqi)))
            else:
                predicted_aqi = 75  # Default moderate AQI
            
            forecast_date = date.today() + timedelta(days=i+1)
            combined_predictions.append({
                'date': forecast_date,
                'predicted_aqi': predicted_aqi,
                'category': self._get_aqi_category(predicted_aqi)
            })
        
        return combined_predictions
    
    def _simple_average_forecast(self, historical_data: List[Dict[str, Any]], forecast_days: int) -> List[Dict[str, Any]]:
        """Simple average-based forecast as fallback."""
        aqi_values = self._prepare_data(historical_data)
        
        if not aqi_values:
            return self._default_forecast(forecast_days)
        
        avg_aqi = np.mean(aqi_values)
        trend = (np.mean(aqi_values[-7:]) - np.mean(aqi_values[:7])) / len(aqi_values) if len(aqi_values) > 7 else 0
        
        predictions = []
        start_date = date.today() + timedelta(days=1)
        
        for i in range(forecast_days):
            predicted_aqi = avg_aqi + (trend * (i + 1))
            predicted_aqi = max(0, min(500, round(predicted_aqi)))
            
            forecast_date = start_date + timedelta(days=i)
            predictions.append({
                'date': forecast_date,
                'predicted_aqi': predicted_aqi,
                'category': self._get_aqi_category(predicted_aqi)
            })
        
        return predictions
    
    def get_name(self) -> str:
        return "Ensemble (Multiple Models)"
    
    def get_description(self) -> str:
        return "Combines multiple forecasting methods for improved accuracy"
    
    def get_min_data_points(self) -> int:
        return 3
    
    def get_best_for(self) -> str:
        return "General purpose forecasting with improved accuracy"
    
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
