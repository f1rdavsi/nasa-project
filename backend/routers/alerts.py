"""
Alert-related API endpoints.
"""
import logging
from datetime import datetime, date, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlmodel import Session, select
from db.database import get_session
from db.models import Subscriber, AlertLog
from schemas.alerts import (
    SubscribeRequest, UnsubscribeRequest, AlertCheckRequest, 
    AlertCheckResponse, SubscriptionResponse
)
from services.telegram_service import TelegramService
from services.timegpt_service import TimeGPTService
from services.openaq_service import OpenAQService
from fastapi import Request

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/alerts", tags=["alerts"])
@router.post("/webhook")
async def telegram_webhook(request: Request, session: Session = Depends(get_session)):
    """
    Telegram webhook to handle /start and location messages.
    Configure your bot webhook to point to /api/alerts/webhook.
    """
    try:
        payload = await request.json()

        message = payload.get("message") or {}
        chat = (message.get("chat") or {})
        chat_id = str(chat.get("id")) if chat.get("id") is not None else None
        text = message.get("text")
        location = message.get("location")

        if not chat_id:
            return {"ok": True}

        async with TelegramService(session) as telegram:
            # /start command: send welcome and prompt for location
            if text and text.strip().lower().startswith("/start"):
                await telegram.send_welcome_message(chat_id)
                await telegram.send_message(
                    chat_id,
                    "Please share your location to subscribe to AQI alerts.",
                    reply_markup={
                        "keyboard": [[{"text": "Share location", "request_location": True}]],
                        "resize_keyboard": True,
                        "one_time_keyboard": True,
                    },
                )
                return {"ok": True}

            # Handle location message
            if location and "latitude" in location and "longitude" in location:
                lat = float(location["latitude"])  # Telegram uses 'latitude'
                lon = float(location["longitude"])  # and 'longitude'

                # Upsert subscriber
                existing = session.exec(
                    select(Subscriber).where(Subscriber.chat_id == chat_id)
                ).first()

                if existing:
                    existing.latitude = lat
                    existing.longitude = lon
                    existing.is_active = True
                    existing.updated_at = datetime.utcnow()
                    session.add(existing)
                    session.commit()
                    subscriber = existing
                else:
                    subscriber = Subscriber(
                        chat_id=chat_id,
                        latitude=lat,
                        longitude=lon,
                        threshold=100,
                        is_active=True,
                    )
                    session.add(subscriber)
                    session.commit()

                await telegram.send_message(
                    chat_id,
                    f"Thanks! Location saved: {lat:.4f}, {lon:.4f}. You'll receive AQI alerts when forecasts exceed your threshold.",
                )
                return {"ok": True}

        return {"ok": True}
    except Exception as e:
        logger.error(f"Telegram webhook error: {e}")
        return {"ok": True}

@router.post("/subscribe", response_model=SubscriptionResponse)
async def subscribe_to_alerts(
    request: SubscribeRequest,
    session: Session = Depends(get_session)
):
    """
    Subscribe to air quality alerts for a specific location.
    
    Creates a new subscription that will receive Telegram alerts when
    predicted AQI exceeds the specified threshold.
    
    Args:
        request: SubscribeRequest with chat_id, location, and threshold
        session: Database session
        
    Returns:
        SubscriptionResponse with subscription details
    """
    try:
        # Validate location
        location = request.location
        if "lat" not in location or "lon" not in location:
            raise HTTPException(
                status_code=400,
                detail="Location must contain 'lat' and 'lon' keys"
            )
        
        lat = location["lat"]
        lon = location["lon"]
        
        if not (-90 <= lat <= 90 and -180 <= lon <= 180):
            raise HTTPException(
                status_code=400,
                detail="Invalid coordinates: lat must be -90 to 90, lon must be -180 to 180"
            )
        
        # Check if subscription already exists
        existing = session.exec(
            select(Subscriber).where(Subscriber.chat_id == request.chat_id)
        ).first()
        
        if existing:
            # Update existing subscription
            existing.latitude = lat
            existing.longitude = lon
            existing.threshold = request.threshold
            existing.is_active = True
            existing.updated_at = datetime.utcnow()
            session.add(existing)
            session.commit()
            session.refresh(existing)
            
            subscriber = existing
        else:
            # Create new subscription
            subscriber = Subscriber(
                chat_id=request.chat_id,
                latitude=lat,
                longitude=lon,
                threshold=request.threshold,
                is_active=True
            )
            session.add(subscriber)
            session.commit()
            session.refresh(subscriber)
        
        # Send welcome message
        async with TelegramService(session) as telegram:
            await telegram.send_welcome_message(request.chat_id)
        
        return SubscriptionResponse(
            chat_id=subscriber.chat_id,
            location={"lat": subscriber.latitude, "lon": subscriber.longitude},
            threshold=subscriber.threshold,
            is_active=subscriber.is_active,
            created_at=subscriber.created_at.isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating subscription: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to create subscription"
        )

@router.delete("/unsubscribe")
async def unsubscribe_from_alerts(
    request: UnsubscribeRequest,
    session: Session = Depends(get_session)
):
    """
    Unsubscribe from air quality alerts.
    
    Deactivates the subscription for the specified chat_id.
    
    Args:
        request: UnsubscribeRequest with chat_id
        session: Database session
        
    Returns:
        Success message
    """
    try:
        # Find subscription
        subscriber = session.exec(
            select(Subscriber).where(Subscriber.chat_id == request.chat_id)
        ).first()
        
        if not subscriber:
            raise HTTPException(
                status_code=404,
                detail="Subscription not found"
            )
        
        # Deactivate subscription
        subscriber.is_active = False
        subscriber.updated_at = datetime.utcnow()
        session.add(subscriber)
        session.commit()
        
        return {"message": "Successfully unsubscribed from alerts"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unsubscribing: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to unsubscribe"
        )

@router.get("/check", response_model=AlertCheckResponse)
async def check_alerts(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    start: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end: str = Query(..., description="End date (YYYY-MM-DD)"),
    session: Session = Depends(get_session)
):
    """
    Manually trigger alert check for a location and date range.
    
    This endpoint generates predictions and checks them against subscriber
    thresholds, sending alerts as needed.
    
    Args:
        lat: Latitude coordinate
        lon: Longitude coordinate
        start: Start date for alert check (YYYY-MM-DD)
        end: End date for alert check (YYYY-MM-DD)
        session: Database session
        
    Returns:
        AlertCheckResponse with alert statistics
    """
    try:
        # Parse dates
        try:
            start_date = datetime.fromisoformat(start).date()
            end_date = datetime.fromisoformat(end).date()
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid date format. Use YYYY-MM-DD"
            )
        
        # Validate date range
        if start_date > end_date:
            raise HTTPException(
                status_code=400,
                detail="Start date must be before end date"
            )
        
        if (end_date - start_date).days > 30:
            raise HTTPException(
                status_code=400,
                detail="Date range cannot exceed 30 days"
            )
        
        # Generate predictions
        async with OpenAQService(session) as openaq:
            # Get historical data for forecasting
            historical_end = date.today() - timedelta(days=1)
            historical_start = historical_end - timedelta(days=30)
            
            cached_measurements = openaq.get_cached_measurements(
                lat=lat,
                lon=lon,
                start_date=historical_start,
                end_date=historical_end
            )
            
            if not cached_measurements:
                # Use mock data for testing
                historical_data = _get_mock_historical_data_for_alerts()
            else:
                historical_data = []
                for measurement in cached_measurements:
                    if measurement.aqi is not None:
                        historical_data.append({
                            "date": measurement.date,
                            "aqi": measurement.aqi
                        })
        
        # Generate forecast
        forecast_days = (end_date - start_date).days + 1
        
        async with TimeGPTService() as timegpt:
            predictions, used_fallback = await timegpt.forecast_aqi(
                historical_data, forecast_days
            )
        
        # Check alerts and send notifications
        async with TelegramService(session) as telegram:
            alert_results = await telegram.check_and_send_alerts(
                predictions, lat, lon
            )
        
        return AlertCheckResponse(
            alerts_sent=alert_results["alerts_sent"],
            subscribers_notified=alert_results["subscribers_notified"],
            details=alert_results["details"],
            checked_at=datetime.utcnow().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking alerts: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to check alerts"
        )

@router.get("/subscriptions/{chat_id}", response_model=SubscriptionResponse)
async def get_subscription(
    chat_id: str,
    session: Session = Depends(get_session)
):
    """
    Get subscription details for a chat_id.
    
    Args:
        chat_id: Telegram chat ID
        session: Database session
        
    Returns:
        SubscriptionResponse with subscription details
    """
    try:
        subscriber = session.exec(
            select(Subscriber).where(Subscriber.chat_id == chat_id)
        ).first()
        
        if not subscriber:
            raise HTTPException(
                status_code=404,
                detail="Subscription not found"
            )
        
        return SubscriptionResponse(
            chat_id=subscriber.chat_id,
            location={"lat": subscriber.latitude, "lon": subscriber.longitude},
            threshold=subscriber.threshold,
            is_active=subscriber.is_active,
            created_at=subscriber.created_at.isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting subscription: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get subscription"
        )

@router.get("/history/{chat_id}")
async def get_alert_history(
    chat_id: str,
    limit: int = Query(10, ge=1, le=100, description="Number of alerts to return"),
    session: Session = Depends(get_session)
):
    """
    Get alert history for a subscriber.
    
    Args:
        chat_id: Telegram chat ID
        limit: Maximum number of alerts to return
        session: Database session
        
    Returns:
        List of alert history entries
    """
    try:
        # Find subscriber
        subscriber = session.exec(
            select(Subscriber).where(Subscriber.chat_id == chat_id)
        ).first()
        
        if not subscriber:
            raise HTTPException(
                status_code=404,
                detail="Subscription not found"
            )
        
        # Get alert history
        alerts = session.exec(
            select(AlertLog)
            .where(AlertLog.subscriber_id == subscriber.id)
            .order_by(AlertLog.sent_at.desc())
            .limit(limit)
        ).all()
        
        return [
            {
                "alert_date": alert.alert_date.isoformat(),
                "aqi_value": alert.aqi_value,
                "threshold": alert.threshold,
                "message": alert.message,
                "sent_at": alert.sent_at.isoformat(),
                "success": alert.success,
                "error_message": alert.error_message
            }
            for alert in alerts
        ]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting alert history: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get alert history"
        )

def _get_mock_historical_data_for_alerts() -> List[Dict[str, Any]]:
    """Generate mock historical data for alert testing."""
    import random
    data = []
    base_date = date.today() - timedelta(days=30)
    
    for i in range(30):
        current_date = base_date + timedelta(days=i)
        # Generate AQI values that might trigger alerts
        base_aqi = 80 + (i * 3) + random.randint(-20, 30)
        aqi = max(0, min(500, base_aqi))
        
        data.append({
            "date": current_date,
            "aqi": aqi
        })
    
    return data
