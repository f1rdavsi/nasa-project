"""
OpenRouter (DeepSeek) service for air pollution forecasting.

This replaces the previous TimeGPT integration by prompting an LLM
(`deepseek/deepseek-chat-v3.1:free`) via OpenRouter to produce a
structured forecast compatible with the existing parser.
"""
import os
import logging
from datetime import datetime, date, timedelta
from typing import List, Dict, Optional, Any, Tuple
import httpx
import asyncio
from services.aqi import AQICalculator

logger = logging.getLogger(__name__)

class TimeGPTService:
    """Service for OpenRouter DeepSeek integration (former TimeGPT service)."""
    
    BASE_URL = "https://openrouter.ai/api/v1/chat/completions"
    
    def __init__(self):
        # Use OpenRouter API key instead of Nixtla
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.client = httpx.AsyncClient(timeout=60.0)
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    async def forecast_aqi(
        self, 
        historical_data: List[Dict[str, Any]], 
        forecast_days: int
    ) -> Tuple[List[Dict[str, Any]], bool]:
        """
        Forecast AQI using OpenRouter DeepSeek model output.
        
        Args:
            historical_data: List of historical AQI measurements
            forecast_days: Number of days to forecast
            
        Returns:
            Tuple of (forecast_results, used_fallback)
        """
        if not self.api_key:
            logger.warning("OPENROUTER_API_KEY not found, using fallback forecast")
            return self._fallback_forecast(historical_data, forecast_days), True
        
        try:
            # Prepare data for LLM prompting
            y_values = []
            for data_point in historical_data:
                aqi = data_point.get("aqi")
                if aqi is not None:
                    y_values.append(float(aqi))
            
            if len(y_values) < 7:  # Need at least a week of data
                logger.warning("Insufficient historical data for OpenRouter forecast, using fallback")
                return self._fallback_forecast(historical_data, forecast_days), True
            
            # OpenRouter API call (LLM prompt-engineered to emit TimeGPT-like JSON)
            url = self.BASE_URL
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }

            system_prompt = (
                "You are a forecasting assistant for air quality index (AQI). "
                "Given a univariate daily AQI time series and a horizon, output a STRICT JSON object with this schema: "
                "{\n  \"forecast\": {\n    \"y\": number[],\n    \"y_80\": number[],\n    \"y_80_hi\": number[],\n    \"y_95\": number[],\n    \"y_95_hi\": number[]\n  }\n}. "
                "All arrays must be length equal to the forecast horizon. "
                "Values must be reasonable AQI in [0,500]. Do not include any prose."
            )

            user_prompt = {
                "y_history": y_values[-90:],  # cap history size
                "h": forecast_days,
                "notes": "Daily AQI. Provide numeric arrays only."
            }

            payload = {
                "model": "deepseek/deepseek-chat-v3.1:free",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": str(user_prompt)}
                ],
                "temperature": 0.2,
                "response_format": {"type": "json_object"}
            }

            response = await self.client.post(url, headers=headers, json=payload)
            
            if response.status_code == 401:
                logger.error("OpenRouter API key invalid or expired")
                return self._fallback_forecast(historical_data, forecast_days), True
            elif response.status_code == 429:
                logger.warning("OpenRouter API rate limit exceeded, using fallback")
                return self._fallback_forecast(historical_data, forecast_days), True
            
            response.raise_for_status()
            data = response.json()
            # Extract model content (JSON string) and convert to dict
            content = None
            try:
                content = data.get("choices", [{}])[0].get("message", {}).get("content")
            except Exception:
                content = None
            if not content:
                logger.warning("OpenRouter response missing content, using fallback")
                return self._fallback_forecast(historical_data, forecast_days), True

            import json as _json
            try:
                parsed = _json.loads(content)
            except Exception as _e:
                logger.warning(f"Failed to parse OpenRouter JSON content: {_e}")
                return self._fallback_forecast(historical_data, forecast_days), True
            
            # Parse LLM response (TimeGPT-compatible structure)
            forecast_results = self._parse_timegpt_response(parsed, forecast_days)
            return forecast_results, False
            
        except httpx.HTTPError as e:
            logger.error(f"OpenRouter API error: {e}")
            return self._fallback_forecast(historical_data, forecast_days), True
        except Exception as e:
            logger.error(f"Unexpected error in OpenRouter forecast: {e}")
            return self._fallback_forecast(historical_data, forecast_days), True
    
    def _parse_timegpt_response(
        self, 
        response_data: Dict[str, Any], 
        forecast_days: int
    ) -> List[Dict[str, Any]]:
        """Parse TimeGPT API response."""
        results = []
        
        forecast_data = response_data.get("forecast", {})
        forecast_values = forecast_data.get("y", [])
        
        # Get confidence intervals if available
        low_80 = response_data.get("forecast", {}).get("y_80", [])
        high_80 = response_data.get("forecast", {}).get("y_80_hi", [])
        low_95 = response_data.get("forecast", {}).get("y_95", [])
        high_95 = response_data.get("forecast", {}).get("y_95_hi", [])
        
        # Generate forecast dates
        start_date = datetime.utcnow().date() + timedelta(days=1)
        
        for i in range(min(forecast_days, len(forecast_values))):
            forecast_date = start_date + timedelta(days=i)
            aqi_value = max(0, min(500, round(forecast_values[i])))  # Clamp to valid AQI range
            category = AQICalculator.get_aqi_category(aqi_value)
            
            result = {
                "date": forecast_date,
                "predicted_aqi": aqi_value,
                "category": category
            }
            
            # Add confidence intervals if available
            confidence = {}
            if i < len(low_80) and i < len(high_80):
                confidence["low_80"] = max(0, min(500, round(low_80[i])))
                confidence["high_80"] = max(0, min(500, round(high_80[i])))
            if i < len(low_95) and i < len(high_95):
                confidence["low_95"] = max(0, min(500, round(low_95[i])))
                confidence["high_95"] = max(0, min(500, round(high_95[i])))
            
            if confidence:
                result["confidence"] = confidence
            
            results.append(result)
        
        return results
    
    def _fallback_forecast(
        self, 
        historical_data: List[Dict[str, Any]], 
        forecast_days: int
    ) -> List[Dict[str, Any]]:
        """
        Enhanced fallback forecast using multiple statistical methods.
        """
        try:
            from forecasting.forecasting_service import ForecastingService
            
            # Use ensemble forecasting
            forecasting_service = ForecastingService()
            predictions, metadata = forecasting_service.forecast_aqi(
                historical_data, forecast_days, method='ensemble'
            )
            
            logger.info(f"Using enhanced forecasting: {metadata.get('model')}")
            return predictions
            
        except ImportError:
            logger.warning("Enhanced forecasting not available, using simple fallback")
        except Exception as e:
            logger.warning(f"Enhanced forecasting failed: {e}, using simple fallback")
        
        # Original simple fallback code
        results = []
        
        if not historical_data:
            # No historical data, return moderate AQI
            start_date = datetime.utcnow().date() + timedelta(days=1)
            for i in range(forecast_days):
                forecast_date = start_date + timedelta(days=i)
                results.append({
                    "date": forecast_date,
                    "predicted_aqi": 75,  # Moderate AQI
                    "category": "Moderate"
                })
            return results
        
        # Calculate basic statistics from historical data
        aqi_values = [d.get("aqi", 0) for d in historical_data if d.get("aqi") is not None]
        
        if not aqi_values:
            # No valid AQI data, return moderate values
            start_date = datetime.utcnow().date() + timedelta(days=1)
            for i in range(forecast_days):
                forecast_date = start_date + timedelta(days=i)
                results.append({
                    "date": forecast_date,
                    "predicted_aqi": 75,
                    "category": "Moderate"
                })
            return results
        
        # Simple trend calculation
        if len(aqi_values) >= 7:
            recent_avg = sum(aqi_values[-7:]) / 7
            older_avg = sum(aqi_values[-14:-7]) / 7 if len(aqi_values) >= 14 else recent_avg
            trend = (recent_avg - older_avg) / 7  # Daily trend
        else:
            recent_avg = sum(aqi_values) / len(aqi_values)
            trend = 0
        
        # Generate forecast with trend and some randomness
        import random
        start_date = datetime.utcnow().date() + timedelta(days=1)
        
        for i in range(forecast_days):
            forecast_date = start_date + timedelta(days=i)
            
            # Apply trend and add some seasonal variation
            base_aqi = recent_avg + (trend * i)
            
            # Add some randomness (±10%)
            variation = random.uniform(-0.1, 0.1)
            predicted_aqi = max(0, min(500, round(base_aqi * (1 + variation))))
            
            category = AQICalculator.get_aqi_category(predicted_aqi)
            
            results.append({
                "date": forecast_date,
                "predicted_aqi": predicted_aqi,
                "category": category
            })
        
        return results
    
    async def get_forecast_metadata(self) -> Dict[str, Any]:
        """Get metadata about the forecasting service."""
        if self.api_key:
            return {
                "model": "deepseek/deepseek-chat-v3.1:free (OpenRouter)",
                "api_available": True,
                "fallback_used": False
            }
        else:
            return {
                "model": "Enhanced Ensemble Forecasting",
                "api_available": False,
                "fallback_used": True,
                "methods": ["Linear Regression", "Moving Average", "Exponential Smoothing", "Seasonal Decomposition", "ARIMA", "Ensemble"]
            }
