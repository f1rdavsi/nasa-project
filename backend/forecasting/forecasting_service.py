"""
Main forecasting service that orchestrates multiple forecasting methods.
"""
import logging
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Tuple, Optional
from .models import (
    LinearRegressionModel,
    MovingAverageModel,
    ExponentialSmoothingModel,
    SeasonalDecompositionModel,
    ARIMAModel,
    EnsembleModel
)
from services.aqi import AQICalculator

logger = logging.getLogger(__name__)

class ForecastingService:
    """Main service for air pollution forecasting using multiple methods."""
    
    def __init__(self):
        self.models = {
            'linear': LinearRegressionModel(),
            'moving_average': MovingAverageModel(),
            'exponential_smoothing': ExponentialSmoothingModel(),
            'seasonal': SeasonalDecompositionModel(),
            'arima': ARIMAModel(),
            'ensemble': EnsembleModel()
        }
    
    async def forecast_aqi(
        self,
        historical_data: List[Dict[str, Any]],
        forecast_days: int,
        method: str = 'ensemble'
    ) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        Forecast AQI using specified method.
        
        Args:
            historical_data: List of historical AQI measurements
            forecast_days: Number of days to forecast
            method: Forecasting method to use
            
        Returns:
            Tuple of (predictions, metadata)
        """
        if not historical_data or len(historical_data) < 3:
            logger.warning("Insufficient historical data, using default forecast")
            return self._default_forecast(forecast_days), {
                "model": "Default",
                "method": "default",
                "confidence": "low"
            }
        
        if method not in self.models:
            method = 'ensemble'
        
        try:
            model = self.models[method]
            predictions = model.forecast(historical_data, forecast_days)
            
            # Add confidence intervals
            predictions = self._add_confidence_intervals(predictions, method)
            
            metadata = {
                "model": model.get_name(),
                "method": method,
                "data_points": len(historical_data),
                "confidence": "high" if len(historical_data) > 30 else "medium"
            }
            
            return predictions, metadata
            
        except Exception as e:
            logger.error(f"Forecasting error with {method}: {e}")
            return self._default_forecast(forecast_days), {
                "model": "Default",
                "method": "default",
                "error": str(e),
                "confidence": "low"
            }
    
    def _add_confidence_intervals(self, predictions: List[Dict[str, Any]], method: str) -> List[Dict[str, Any]]:
        """Add confidence intervals to predictions."""
        for pred in predictions:
            aqi = pred.get('predicted_aqi', 0)
            
            # Different confidence intervals based on method
            if method == 'ensemble':
                margin = max(5, aqi * 0.15)  # 15% margin
            elif method == 'linear':
                margin = max(8, aqi * 0.20)  # 20% margin
            elif method == 'moving_average':
                margin = max(6, aqi * 0.18)  # 18% margin
            else:
                margin = max(10, aqi * 0.25)  # 25% margin
            
            pred['confidence'] = {
                'low_80': max(0, min(500, round(aqi - margin))),
                'high_80': max(0, min(500, round(aqi + margin))),
                'low_95': max(0, min(500, round(aqi - margin * 1.5))),
                'high_95': max(0, min(500, round(aqi + margin * 1.5)))
            }
        
        return predictions
    
    def _default_forecast(self, forecast_days: int) -> List[Dict[str, Any]]:
        """Generate default forecast when no historical data is available."""
        import random
        start_date = date.today() + timedelta(days=1)
        
        predictions = []
        for i in range(forecast_days):
            forecast_date = start_date + timedelta(days=i)
            # Generate moderate AQI with some variation
            base_aqi = 60 + random.randint(-15, 25)
            aqi = max(0, min(500, base_aqi))
            
            predictions.append({
                'date': forecast_date,
                'predicted_aqi': aqi,
                'category': AQICalculator.get_aqi_category(aqi)
            })
        
        return predictions
    
    def get_available_methods(self) -> List[str]:
        """Get list of available forecasting methods."""
        return list(self.models.keys())
    
    def get_method_info(self, method: str) -> Dict[str, Any]:
        """Get information about a specific forecasting method."""
        if method in self.models:
            model = self.models[method]
            return {
                "name": model.get_name(),
                "description": model.get_description(),
                "min_data_points": model.get_min_data_points(),
                "best_for": model.get_best_for()
            }
        return {}
