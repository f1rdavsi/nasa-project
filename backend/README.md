# Air Pollution Prediction API

A comprehensive FastAPI backend for air pollution monitoring, prediction, and alerting. This API provides real-time air quality data, historical analysis, AI-powered forecasting, and Telegram notifications for unhealthy air quality conditions.

## Features

- **🌍 Location Detection**: Auto-detect user location or manual selection by country/coordinates
- **📊 Real-time Data**: Current air pollution measurements from OpenAQ stations
- **📈 Historical Analysis**: Cached historical pollution data with daily AQI aggregation
- **🔮 AI Forecasting**: OpenRouter (DeepSeek)-powered AQI predictions for future dates
- **🚨 Smart Alerts**: Telegram notifications when predicted AQI exceeds thresholds
- **📱 RESTful API**: Clean, documented endpoints for frontend integration
- **🔄 Caching**: Local SQLite database for performance and rate limit management
- **🧪 Mock Mode**: Realistic sample data when API keys are unavailable

## Tech Stack

- **Framework**: FastAPI (async endpoints)
- **Database**: SQLite (with optional PostgreSQL support)
- **HTTP Client**: httpx (async)
- **Data Source**: OpenAQ API
- **AI Forecasting**: OpenRouter (DeepSeek)
- **Notifications**: Telegram Bot API
- **Validation**: Pydantic models
- **Testing**: pytest with async support

## Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd air-pollution-prediction-api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Environment Configuration

Copy the example environment file and configure your API keys:

```bash
cp env.example .env
```

Edit `.env` with your API keys:

```env
# Required for OpenRouter forecasting
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Required for Telegram alerts
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# Database path (default: ./data/openaq_cache.db)
OPENAQ_CACHE_DB=./data/openaq_cache.db

# Default AQI threshold for alerts
ALERT_DEFAULT_THRESHOLD=100

# Logging level
LOG_LEVEL=INFO
```

### 3. Run the Application

```bash
# Development mode with auto-reload
python main.py

# Or using uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health

## API Endpoints

### Location Endpoints

#### `GET /api/location/current`
Detect user's current location from IP or geolocation headers.

**Response:**
```json
{
  "city": "Dushanbe",
  "country": "Tajikistan", 
  "lat": 38.5358,
  "lon": 68.7791,
  "detected_from": "ip"
}
```

#### `POST /api/location/select`
Set selected location for pollution data requests.

**Request:**
```json
{
  "country": "Tajikistan"
}
```
or
```json
{
  "lat": 38.5358,
  "lon": 68.7791
}
```

### Pollution Endpoints

#### `GET /api/pollution/current/location`
Get current air pollution measurements for a location.

**Parameters:**
- `lat` (float): Latitude coordinate
- `lon` (float): Longitude coordinate  
- `radius_m` (int, optional): Search radius in meters (default: 10000)

**Response:**
```json
{
  "location": {"lat": 38.5358, "lon": 68.7791, "radius_m": 10000},
  "measurements": [
    {
      "parameter": "PM25",
      "value": 25.5,
      "unit": "μg/m³",
      "last_updated": "2024-01-15T10:30:00Z"
    }
  ],
  "aqi": 75,
  "aqi_category": "Moderate",
  "aqi_breakdown": {"pm25": 75, "pm10": 65},
  "last_updated": "2024-01-15T10:30:00Z",
  "station_count": 3
}
```

#### `GET /api/pollution/history`
Get historical pollution data for a date range.

**Parameters:**
- `country` (string, optional): Country code
- `lat` (float, optional): Latitude coordinate
- `lon` (float, optional): Longitude coordinate
- `start` (date): Start date (YYYY-MM-DD)
- `end` (date): End date (YYYY-MM-DD)
- `parameters` (string, optional): Comma-separated parameters (default: "pm25,pm10,no2,o3")
- `page` (int, optional): Page number (default: 1)
- `page_size` (int, optional): Page size (default: 100)

#### `GET /api/pollution/predict`
Predict future AQI values using AI forecasting.

**Parameters:**
- `country` (string, optional): Country code
- `lat` (float, optional): Latitude coordinate
- `lon` (float, optional): Longitude coordinate
- `start` (date): Start date for prediction (must be future)
- `end` (date): End date for prediction
- `model` (string, optional): Prediction model (default: "openrouter")

**Response:**
```json
{
  "location": {"country": "Tajikistan", "lat": 38.56, "lon": 68.78},
  "range": {"start": "2024-02-01", "end": "2024-02-07"},
  "predictions": [
    {
      "date": "2024-02-01",
      "predicted_aqi": 75,
      "category": "Moderate",
      "confidence": {"low_80": 70, "high_80": 80}
    }
  ],
  "alerts": [
    {
      "date": "2024-02-03",
      "aqi": 160,
      "category": "Unhealthy",
      "message": "AQI > 150 predicted for 2024-02-03"
    }
  ],
  "meta": {
    "model": "deepseek/deepseek-chat-v3.1:free (OpenRouter)",
    "used_fallback": false
  }
}
```

### Alert Endpoints

#### `POST /api/alerts/subscribe`
Subscribe to air quality alerts for a location.

**Request:**
```json
{
  "chat_id": "12345",
  "location": {"lat": 38.5358, "lon": 68.7791},
  "threshold": 100
}
```

#### `DELETE /api/alerts/unsubscribe`
Unsubscribe from air quality alerts.

**Request:**
```json
{
  "chat_id": "12345"
}
```

#### `GET /api/alerts/check`
Manually trigger alert check for a location and date range.

**Parameters:**
- `lat` (float): Latitude coordinate
- `lon` (float): Longitude coordinate
- `start` (string): Start date (YYYY-MM-DD)
- `end` (string): End date (YYYY-MM-DD)

## Example Usage

### Using curl

```bash
# Get current pollution for Dushanbe
curl "http://localhost:8000/api/pollution/current/location?lat=38.5358&lon=68.7791"

# Get historical data
curl "http://localhost:8000/api/pollution/history?lat=38.5358&lon=68.7791&start=2024-01-01&end=2024-01-07"

# Predict future AQI
curl "http://localhost:8000/api/pollution/predict?lat=38.5358&lon=68.7791&start=2024-02-01&end=2024-02-07"

# Subscribe to alerts
curl -X POST "http://localhost:8000/api/alerts/subscribe" \
  -H "Content-Type: application/json" \
  -d '{"chat_id": "12345", "location": {"lat": 38.5358, "lon": 68.7791}, "threshold": 100}'
```

### Using Python

```python
import httpx

# Get current pollution
async with httpx.AsyncClient() as client:
    response = await client.get(
        "http://localhost:8000/api/pollution/current/location",
        params={"lat": 38.5358, "lon": 68.7791}
    )
    data = response.json()
    print(f"Current AQI: {data['aqi']} ({data['aqi_category']})")
```

## AQI Categories

The API uses EPA AQI standards:

| AQI Range | Category | Health Concern |
|-----------|----------|----------------|
| 0-50 | Good | Air quality is satisfactory |
| 51-100 | Moderate | Sensitive people may experience minor issues |
| 101-150 | Unhealthy for Sensitive Groups | Children, elderly, and people with respiratory issues should limit outdoor activities |
| 151-200 | Unhealthy | Everyone may experience health effects |
| 201-300 | Very Unhealthy | Health warnings for everyone |
| 301-500 | Hazardous | Emergency conditions |

## Data Sources

- **OpenAQ**: Real-time and historical air pollution measurements
- **OpenRouter (DeepSeek)**: AI-powered time series forecasting
- **EPA Standards**: AQI calculation formulas and breakpoints

## Mock Mode

If API keys are not configured, the service runs in mock mode with realistic sample data:

- **OpenRouter**: Uses statistical fallback forecasting
- **Telegram**: Logs messages instead of sending
- **OpenAQ**: Returns sample pollution data

This allows frontend development to proceed without requiring API keys.

## Database Schema

The API uses SQLite with the following tables:

- **stations**: OpenAQ station metadata
- **measurements**: Daily aggregated pollution measurements
- **subscribers**: Telegram alert subscribers
- **alerts_log**: Log of sent alerts
- **cache_metadata**: Cache freshness tracking

## Testing

Run the test suite:

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=.

# Run specific test file
pytest tests/test_aqi.py

# Run with verbose output
pytest -v
```

## Production Deployment

### Environment Variables

For production, set these additional variables:

```env
# Database (optional - defaults to SQLite)
DATABASE_URL=postgresql://user:password@localhost/air_pollution_db

# Server configuration
HOST=0.0.0.0
PORT=8000
RELOAD=false

# Security
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

### Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
RUN mkdir -p data

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Health Monitoring

The `/api/health` endpoint provides service status:

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": {
    "NIXTLA_API_KEY": true,
    "TELEGRAM_BOT_TOKEN": true,
    "OPENAQ_CACHE_DB": true
  },
  "database": "healthy",
  "services": {
    "openaq": "available",
    "forecast_llm": "available",
    "telegram": "available"
  }
}
```

## API Keys Setup

### OpenRouter

1. Sign up at [OpenRouter](https://openrouter.ai/)
2. Get your API key from the dashboard
3. Add to `.env` as `OPENROUTER_API_KEY`

### Telegram Bot

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Create a new bot with `/newbot`
3. Get your bot token
4. Add to `.env` as `TELEGRAM_BOT_TOKEN`

### OpenAQ

No API key required - OpenAQ is a free, open API.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
- Check the [API documentation](http://localhost:8000/docs)
- Review the test cases in `tests/`
- Open an issue on GitHub

## Roadmap

- [ ] Add more forecasting models (Prophet, Chronos)
- [ ] Implement real-time WebSocket updates
- [ ] Add email notifications
- [ ] Support for more pollutants (CO, SO2)
- [ ] Mobile app integration
- [ ] Advanced analytics and trends
