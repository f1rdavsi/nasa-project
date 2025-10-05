"""
Alert-related Pydantic schemas.
"""
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class SubscribeRequest(BaseModel):
    """Request schema for alert subscription."""
    chat_id: str
    location: Dict[str, float] = Field(..., description="Location with lat and lon keys")
    threshold: Optional[int] = Field(default=100, ge=0, le=500)


class UnsubscribeRequest(BaseModel):
    """Request schema for alert unsubscription."""
    chat_id: str


class AlertCheckRequest(BaseModel):
    """Request schema for manual alert check."""
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    start: str = Field(..., description="Start date in YYYY-MM-DD format")
    end: str = Field(..., description="End date in YYYY-MM-DD format")


class AlertCheckResponse(BaseModel):
    """Response schema for alert check."""
    alerts_sent: int
    subscribers_notified: int
    details: List[Dict[str, Any]]
    checked_at: str


class SubscriptionResponse(BaseModel):
    """Response schema for subscription status."""
    chat_id: str
    location: Dict[str, float]
    threshold: int
    is_active: bool
    created_at: str
