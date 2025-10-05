"""
Location-related Pydantic schemas.
"""
from typing import Optional
from pydantic import BaseModel, Field


class LocationRequest(BaseModel):
    """Request schema for location selection."""
    country: Optional[str] = None
    lat: Optional[float] = Field(None, ge=-90, le=90)
    lon: Optional[float] = Field(None, ge=-180, le=180)


class LocationResponse(BaseModel):
    """Response schema for location data."""
    city: Optional[str] = None
    country: str
    lat: float
    lon: float
    timezone: Optional[str] = None


class CurrentLocationResponse(BaseModel):
    """Response schema for current location detection."""
    city: Optional[str] = None
    country: str
    lat: float
    lon: float
    detected_from: str = Field(..., description="Source of location detection (ip, geolocation, etc.)")
