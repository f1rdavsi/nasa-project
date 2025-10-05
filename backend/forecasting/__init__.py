"""
Enhanced forecasting module for air pollution prediction.
Multiple statistical and machine learning methods without external API dependencies.
"""

from .forecasting_service import ForecastingService
from .models import (
    LinearRegressionModel,
    MovingAverageModel, 
    ExponentialSmoothingModel,
    SeasonalDecompositionModel,
    ARIMAModel,
    EnsembleModel
)

__all__ = [
    'ForecastingService',
    'LinearRegressionModel',
    'MovingAverageModel',
    'ExponentialSmoothingModel', 
    'SeasonalDecompositionModel',
    'ARIMAModel',
    'EnsembleModel'
]
