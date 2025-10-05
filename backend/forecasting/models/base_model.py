"""
Base class for all forecasting models.
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any
from services.aqi import AQICalculator

class BaseForecastModel(ABC):
    """Base class for forecasting models."""
    
    @abstractmethod
    def forecast(self, historical_data: List[Dict[str, Any]], forecast_days: int) -> List[Dict[str, Any]]:
        """Forecast future values."""
        pass
    
    @abstractmethod
    def get_name(self) -> str:
        """Get model name."""
        pass
    
    def get_description(self) -> str:
        """Get model description."""
        return "Base forecasting model"
    
    def get_min_data_points(self) -> int:
        """Get minimum data points required."""
        return 3
    
    def get_best_for(self) -> str:
        """Get description of what this model is best for."""
        return "General forecasting"
    
    def _get_aqi_category(self, aqi: int) -> str:
        """Get AQI category from AQI value."""
        return AQICalculator.get_aqi_category(aqi)
    
    def _prepare_data(self, historical_data: List[Dict[str, Any]]) -> List[float]:
        """Extract AQI values from historical data."""
        aqi_values = []
        for data_point in historical_data:
            aqi = data_point.get("aqi")
            if aqi is not None:
                aqi_values.append(float(aqi))
        return aqi_values
