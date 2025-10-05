"""
Telegram service for sending air pollution alerts.
"""
import os
import logging
import asyncio
from datetime import datetime
from typing import List, Dict, Optional, Any
import httpx
from sqlmodel import Session, select
from db.models import Subscriber, AlertLog

logger = logging.getLogger(__name__)

class TelegramService:
    """Service for sending Telegram alerts."""
    
    BASE_URL = "https://api.telegram.org/bot"
    
    def __init__(self, session: Session):
        self.bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
        self.session = session
        self.client = httpx.AsyncClient(timeout=30.0)
        self.rate_limit_delay = 1.0  # Delay between messages to avoid rate limits
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    async def send_message(self, chat_id: str, message: str, reply_markup: Optional[Dict[str, Any]] = None) -> bool:
        """
        Send a message to a Telegram chat.
        
        Args:
            chat_id: Telegram chat ID
            message: Message text to send
            reply_markup: Optional Telegram reply markup dict
            
        Returns:
            True if message sent successfully, False otherwise
        """
        if not self.bot_token:
            logger.warning("TELEGRAM_BOT_TOKEN not configured, skipping message send")
            return False
        
        try:
            url = f"{self.BASE_URL}{self.bot_token}/sendMessage"
            payload = {
                "chat_id": chat_id,
                "text": message,
                "parse_mode": "HTML"
            }
            if reply_markup:
                payload["reply_markup"] = reply_markup
            
            response = await self.client.post(url, json=payload)
            
            if response.status_code == 429:
                # Rate limited, wait and retry
                retry_after = response.json().get("parameters", {}).get("retry_after", 60)
                logger.warning(f"Telegram rate limited, waiting {retry_after} seconds")
                await asyncio.sleep(retry_after)
                return await self.send_message(chat_id, message)
            
            response.raise_for_status()
            return True
            
        except httpx.HTTPError as e:
            logger.error(f"Telegram API error: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error sending Telegram message: {e}")
            return False
    
    async def send_air_quality_alert(
        self, 
        subscriber: Subscriber, 
        alert_date: datetime, 
        aqi_value: int, 
        threshold: int
    ) -> bool:
        """
        Send air quality alert to a subscriber.
        
        Args:
            subscriber: Subscriber object
            alert_date: Date of the alert
            aqi_value: Predicted AQI value
            threshold: Alert threshold
            
        Returns:
            True if alert sent successfully, False otherwise
        """
        from services.aqi import AQICalculator
        
        category = AQICalculator.get_aqi_category(aqi_value)
        
        message = (
            f"🚨 <b>Air Quality Alert</b>\n\n"
            f"📍 Location: {subscriber.latitude:.4f}, {subscriber.longitude:.4f}\n"
            f"📅 Date: {alert_date.strftime('%Y-%m-%d')}\n"
            f"🌫️ Predicted AQI: <b>{aqi_value}</b> ({category})\n"
            f"⚠️ Threshold: {threshold}\n\n"
            f"Air quality is expected to be unhealthy. "
            f"Consider limiting outdoor activities and using air purifiers if available."
        )
        
        success = await self.send_message(subscriber.chat_id, message)
        
        # Log the alert attempt
        alert_log = AlertLog(
            subscriber_id=subscriber.id,
            alert_date=alert_date,
            aqi_value=aqi_value,
            threshold=threshold,
            message=message,
            success=success
        )
        
        if not success:
            alert_log.error_message = "Failed to send message"
        
        self.session.add(alert_log)
        self.session.commit()
        
        return success
    
    async def check_and_send_alerts(
        self, 
        predictions: List[Dict[str, Any]], 
        lat: float, 
        lon: float
    ) -> Dict[str, Any]:
        """
        Check predictions against subscriber thresholds and send alerts.
        
        Args:
            predictions: List of prediction dictionaries
            lat: Latitude for location matching
            lon: Longitude for location matching
            
        Returns:
            Dictionary with alert statistics
        """
        if not self.bot_token:
            return {
                "alerts_sent": 0,
                "subscribers_notified": 0,
                "details": []
            }
        
        # Find subscribers near the location
        subscribers = self._get_nearby_subscribers(lat, lon)
        
        if not subscribers:
            return {
                "alerts_sent": 0,
                "subscribers_notified": 0,
                "details": []
            }
        
        alerts_sent = 0
        subscribers_notified = set()
        details = []
        
        for prediction in predictions:
            predicted_aqi = prediction.get("predicted_aqi", 0)
            alert_date = prediction.get("date")
            
            if not alert_date:
                continue
            
            # Convert date to datetime for comparison
            if isinstance(alert_date, str):
                alert_date = datetime.fromisoformat(alert_date)
            elif hasattr(alert_date, 'date'):
                alert_date = datetime.combine(alert_date, datetime.min.time())
            
            for subscriber in subscribers:
                if predicted_aqi > subscriber.threshold:
                    success = await self.send_air_quality_alert(
                        subscriber, alert_date, predicted_aqi, subscriber.threshold
                    )
                    
                    if success:
                        alerts_sent += 1
                        subscribers_notified.add(subscriber.chat_id)
                    
                    details.append({
                        "chat_id": subscriber.chat_id,
                        "date": alert_date.isoformat(),
                        "aqi": predicted_aqi,
                        "threshold": subscriber.threshold,
                        "sent": success
                    })
                    
                    # Rate limiting
                    await asyncio.sleep(self.rate_limit_delay)
        
        return {
            "alerts_sent": alerts_sent,
            "subscribers_notified": len(subscribers_notified),
            "details": details
        }
    
    def _get_nearby_subscribers(self, lat: float, lon: float, radius_km: float = 50.0) -> List[Subscriber]:
        """
        Get subscribers within a certain radius of the given coordinates.
        
        Args:
            lat: Latitude
            lon: Longitude
            radius_km: Search radius in kilometers
            
        Returns:
            List of nearby subscribers
        """
        # Simple bounding box approach (could be improved with proper distance calculation)
        lat_range = radius_km / 111.0  # Rough conversion: 1 degree ≈ 111 km
        lon_range = radius_km / (111.0 * abs(lat) / 90.0)  # Adjust for latitude
        
        query = select(Subscriber).where(
            Subscriber.is_active == True,
            Subscriber.latitude.between(lat - lat_range, lat + lat_range),
            Subscriber.longitude.between(lon - lon_range, lon + lon_range)
        )
        
        return self.session.exec(query).all()
    
    async def send_welcome_message(self, chat_id: str) -> bool:
        """Send welcome message to new subscribers."""
        message = (
            "🌍 <b>Welcome to Air Quality Alerts!</b>\n\n"
            "You'll receive notifications when air quality is predicted to exceed your threshold.\n\n"
            "Use /help to see available commands.\n"
            "Use /threshold to set your alert threshold.\n"
            "Use /location to update your location.\n\n"
            "Stay safe and breathe easy! 🌱"
        )
        
        return await self.send_message(chat_id, message)
    
    
    async def send_help_message(self, chat_id: str) -> bool:
        """Send help message with available commands."""
        message = (
            "🤖 <b>Air Quality Bot Commands</b>\n\n"
            "/start - Start receiving alerts\n"
            "/stop - Stop receiving alerts\n"
            "/threshold [value] - Set AQI threshold (default: 100)\n"
            "/location [lat] [lon] - Set your location\n"
            "/status - Check your subscription status\n"
            "/help - Show this help message\n\n"
            "<b>AQI Categories:</b>\n"
            "0-50: Good\n"
            "51-100: Moderate\n"
            "101-150: Unhealthy for Sensitive Groups\n"
            "151-200: Unhealthy\n"
            "201-300: Very Unhealthy\n"
            "301-500: Hazardous"
        )
        
        return await self.send_message(chat_id, message)
