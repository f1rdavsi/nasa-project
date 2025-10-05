"""
Unit tests for TimeGPT service.
"""
import pytest
from unittest.mock import AsyncMock, patch
from services.timegpt_service import TimeGPTService


class TestTimeGPTService:
    """Test cases for TimeGPT service."""
    
    @pytest.fixture
    def timegpt_service(self):
        """Create TimeGPT service instance."""
        return TimeGPTService()
    
    @pytest.fixture
    def sample_historical_data(self):
        """Sample historical AQI data."""
        return [
            {"date": "2024-01-01", "aqi": 45},
            {"date": "2024-01-02", "aqi": 50},
            {"date": "2024-01-03", "aqi": 55},
            {"date": "2024-01-04", "aqi": 60},
            {"date": "2024-01-05", "aqi": 65},
            {"date": "2024-01-06", "aqi": 70},
            {"date": "2024-01-07", "aqi": 75},
        ]
    
    @pytest.mark.asyncio
    async def test_forecast_aqi_with_api_key(self, timegpt_service, sample_historical_data):
        """Test AQI forecasting with valid API key."""
        # Mock the OpenRouter API chat completion response
        mock_response = {
            "choices": [
                {
                    "message": {
                        "role": "assistant",
                        "content": "{\n  \"forecast\": {\n    \"y\": [80, 85, 90, 95, 100],\n    \"y_80\": [75, 80, 85, 90, 95],\n    \"y_80_hi\": [85, 90, 95, 100, 105],\n    \"y_95\": [70, 75, 80, 85, 90],\n    \"y_95_hi\": [90, 95, 100, 105, 110]\n  }\n}"
                    }
                }
            ]
        }
        
        with patch.object(timegpt_service, 'api_key', 'test_key'):
            with patch.object(timegpt_service.client, 'post', new_callable=AsyncMock) as mock_post:
                mock_post.return_value.status_code = 200
                mock_post.return_value.json.return_value = mock_response
                
                predictions, used_fallback = await timegpt_service.forecast_aqi(
                    sample_historical_data, 5
                )
                
                assert not used_fallback
                assert len(predictions) == 5
                assert all("date" in pred for pred in predictions)
                assert all("predicted_aqi" in pred for pred in predictions)
                assert all("category" in pred for pred in predictions)
    
    @pytest.mark.asyncio
    async def test_forecast_aqi_without_api_key(self, timegpt_service, sample_historical_data):
        """Test AQI forecasting without API key (fallback mode)."""
        with patch.object(timegpt_service, 'api_key', None):
            predictions, used_fallback = await timegpt_service.forecast_aqi(
                sample_historical_data, 5
            )
            
            assert used_fallback
            assert len(predictions) == 5
            assert all("date" in pred for pred in predictions)
            assert all("predicted_aqi" in pred for pred in predictions)
            assert all("category" in pred for pred in predictions)
    
    @pytest.mark.asyncio
    async def test_forecast_aqi_insufficient_data(self, timegpt_service):
        """Test AQI forecasting with insufficient historical data."""
        insufficient_data = [
            {"date": "2024-01-01", "aqi": 45},
            {"date": "2024-01-02", "aqi": 50},
        ]
        
        with patch.object(timegpt_service, 'api_key', 'test_key'):
            predictions, used_fallback = await timegpt_service.forecast_aqi(
                insufficient_data, 5
            )
            
            assert used_fallback  # Should use fallback due to insufficient data
            assert len(predictions) == 5
    
    @pytest.mark.asyncio
    async def test_forecast_aqi_api_error(self, timegpt_service, sample_historical_data):
        """Test AQI forecasting with API error."""
        with patch.object(timegpt_service, 'api_key', 'test_key'):
            with patch.object(timegpt_service.client, 'post', new_callable=AsyncMock) as mock_post:
                mock_post.side_effect = Exception("API Error")
                
                predictions, used_fallback = await timegpt_service.forecast_aqi(
                    sample_historical_data, 5
                )
                
                assert used_fallback  # Should use fallback due to API error
                assert len(predictions) == 5
    
    @pytest.mark.asyncio
    async def test_forecast_aqi_rate_limit(self, timegpt_service, sample_historical_data):
        """Test AQI forecasting with rate limit error."""
        with patch.object(timegpt_service, 'api_key', 'test_key'):
            with patch.object(timegpt_service.client, 'post', new_callable=AsyncMock) as mock_post:
                mock_post.return_value.status_code = 429
                
                predictions, used_fallback = await timegpt_service.forecast_aqi(
                    sample_historical_data, 5
                )
                
                assert used_fallback  # Should use fallback due to rate limit
                assert len(predictions) == 5
    
    @pytest.mark.asyncio
    async def test_forecast_aqi_invalid_key(self, timegpt_service, sample_historical_data):
        """Test AQI forecasting with invalid API key."""
        with patch.object(timegpt_service, 'api_key', 'invalid_key'):
            with patch.object(timegpt_service.client, 'post', new_callable=AsyncMock) as mock_post:
                mock_post.return_value.status_code = 401
                
                predictions, used_fallback = await timegpt_service.forecast_aqi(
                    sample_historical_data, 5
                )
                
                assert used_fallback  # Should use fallback due to invalid key
                assert len(predictions) == 5
    
    def test_parse_timegpt_response(self, timegpt_service):
        """Test parsing TimeGPT API response."""
        response_data = {
            "forecast": {
                "y": [80, 85, 90],
                "y_80": [75, 80, 85],
                "y_80_hi": [85, 90, 95],
                "y_95": [70, 75, 80],
                "y_95_hi": [90, 95, 100]
            }
        }
        
        results = timegpt_service._parse_timegpt_response(response_data, 3)
        
        assert len(results) == 3
        assert all("date" in result for result in results)
        assert all("predicted_aqi" in result for result in results)
        assert all("category" in result for result in results)
        assert all("confidence" in result for result in results)
    
    def test_fallback_forecast(self, timegpt_service, sample_historical_data):
        """Test fallback forecast generation."""
        predictions = timegpt_service._fallback_forecast(sample_historical_data, 5)
        
        assert len(predictions) == 5
        assert all("date" in pred for pred in predictions)
        assert all("predicted_aqi" in pred for pred in predictions)
        assert all("category" in pred for pred in predictions)
        
        # Check that AQI values are within valid range
        for pred in predictions:
            assert 0 <= pred["predicted_aqi"] <= 500
    
    def test_fallback_forecast_no_data(self, timegpt_service):
        """Test fallback forecast with no historical data."""
        predictions = timegpt_service._fallback_forecast([], 3)
        
        assert len(predictions) == 3
        assert all(pred["predicted_aqi"] == 75 for pred in predictions)  # Default moderate AQI
        assert all(pred["category"] == "Moderate" for pred in predictions)
    
    @pytest.mark.asyncio
    async def test_get_forecast_metadata(self, timegpt_service):
        """Test getting forecast metadata."""
        with patch.object(timegpt_service, 'api_key', 'test_key'):
            metadata = await timegpt_service.get_forecast_metadata()
            
            assert "deepseek" in metadata["model"].lower()
            assert metadata["api_available"] == True
            assert metadata["fallback_used"] == False
        
        with patch.object(timegpt_service, 'api_key', None):
            metadata = await timegpt_service.get_forecast_metadata()
            
            # In new service, fallback model label changed
            assert "ensemble" in metadata["model"].lower()
            assert metadata["api_available"] == False
            assert metadata["fallback_used"] == True
