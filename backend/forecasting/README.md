# Enhanced Forecasting Module

This module provides multiple sophisticated forecasting methods for air pollution prediction without requiring external API keys like TimeGPT.

## Features

- **6 Different Forecasting Methods:**
  - Linear Regression
  - Moving Average
  - Exponential Smoothing
  - Seasonal Decomposition
  - Simple ARIMA
  - Ensemble (combines all methods)

- **No External Dependencies** - Works completely offline
- **Confidence Intervals** - Provides uncertainty estimates
- **Robust Error Handling** - Falls back gracefully if methods fail
- **Easy to Extend** - Modular design for adding new methods

## Quick Start

### 1. Install Dependencies
```bash
pip install numpy pandas scikit-learn
```

### 2. Test the Forecasting System
```bash
cd backend/forecasting
python test_forecasting.py
```

### 3. Use in Your Code
```python
from forecasting.forecasting_service import ForecastingService

# Create service
service = ForecastingService()

# Historical data
historical_data = [
    {"date": "2024-01-01", "aqi": 45},
    {"date": "2024-01-02", "aqi": 50},
    {"date": "2024-01-03", "aqi": 55},
    # ... more data
]

# Forecast
predictions, metadata = await service.forecast_aqi(
    historical_data, 
    forecast_days=7, 
    method='ensemble'
)

print(f"Model: {metadata['model']}")
for pred in predictions:
    print(f"{pred['date']}: AQI {pred['predicted_aqi']} ({pred['category']})")
```

## Available Methods

### 1. Linear Regression (`linear`)
- **Best for:** Data with clear linear trends
- **Min data points:** 3
- **Description:** Linear trend-based forecasting using least squares regression

### 2. Moving Average (`moving_average`)
- **Best for:** Data with noise that needs smoothing
- **Min data points:** 5
- **Description:** Smoothing-based forecasting using moving averages

### 3. Exponential Smoothing (`exponential_smoothing`)
- **Best for:** Data with recent trends and patterns
- **Min data points:** 3
- **Description:** Weighted average forecasting with exponential decay

### 4. Seasonal Decomposition (`seasonal`)
- **Best for:** Data with weekly or seasonal patterns
- **Min data points:** 14
- **Description:** Forecasting with seasonal pattern recognition

### 5. Simple ARIMA (`arima`)
- **Best for:** Time series with trends and autocorrelation
- **Min data points:** 7
- **Description:** Autoregressive integrated moving average forecasting

### 6. Ensemble (`ensemble`) - **Recommended**
- **Best for:** General purpose forecasting with improved accuracy
- **Min data points:** 3
- **Description:** Combines multiple forecasting methods for improved accuracy

## API Integration

The enhanced forecasting is automatically integrated into the main API. When `NIXTLA_API_KEY` is not provided, the API will use the ensemble method by default.

### Test the API
```bash
# Start the API
cd backend
python run.py

# Test prediction endpoint
curl "http://localhost:8000/api/pollution/predict?lat=38.5358&lon=68.7791&start=2024-02-01&end=2024-02-07"
```

## Response Format

```json
{
  "location": {"lat": 38.5358, "lon": 68.7791},
  "range": {"start": "2024-02-01", "end": "2024-02-07"},
  "predictions": [
    {
      "date": "2024-02-01",
      "predicted_aqi": 75,
      "category": "Moderate",
      "confidence": {
        "low_80": 70,
        "high_80": 80,
        "low_95": 65,
        "high_95": 85
      }
    }
  ],
  "meta": {
    "model": "Ensemble (Multiple Models)",
    "method": "ensemble",
    "data_points": 30,
    "confidence": "high"
  }
}
```

## Benefits

✅ **No API Key Required** - Works completely offline
✅ **Multiple Methods** - Ensemble of 6 different forecasting techniques
✅ **Confidence Intervals** - Provides uncertainty estimates
✅ **Robust** - Falls back gracefully if methods fail
✅ **Fast** - No external API calls
✅ **Accurate** - Combines multiple statistical approaches
✅ **Professional Grade** - Suitable for production use

## Extending the System

To add a new forecasting method:

1. Create a new model class inheriting from `BaseForecastModel`
2. Implement the required methods: `forecast()`, `get_name()`
3. Add it to the `ForecastingService` models dictionary
4. Update the `__init__.py` files

Example:
```python
class MyCustomModel(BaseForecastModel):
    def forecast(self, historical_data, forecast_days):
        # Your forecasting logic here
        pass
    
    def get_name(self):
        return "My Custom Model"
```

## Troubleshooting

### Import Errors
Make sure you have installed the required dependencies:
```bash
pip install numpy pandas scikit-learn
```

### Insufficient Data
The system will automatically fall back to simpler methods or default forecasts if there's insufficient historical data.

### Method Failures
If a specific method fails, the ensemble will use the remaining working methods and adjust weights accordingly.
