"""
Pollution-related Pydantic schemas.
"""
from datetime import datetime, date
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class PollutionMeasurement(BaseModel):
    """Individual pollution measurement."""
    parameter: str
    value: float
    unit: str
    last_updated: datetime


class CurrentPollutionResponse(BaseModel):
    """Response schema for current pollution data."""
    location: Dict[str, Any]
    measurements: List[PollutionMeasurement]
    aqi: int
    aqi_category: str
    aqi_breakdown: Dict[str, int]
    last_updated: datetime
    station_count: int


class HistoricalPollutionRequest(BaseModel):
    """Request schema for historical pollution data."""
    country: Optional[str] = None
    lat: Optional[float] = Field(None, ge=-90, le=90)
    lon: Optional[float] = Field(None, ge=-180, le=180)
    start: date
    end: date
    parameters: Optional[List[str]] = Field(default=["pm25", "pm10", "no2", "o3"])


class DailyMeasurement(BaseModel):
    """Daily aggregated measurement."""
    date: date
    pm25: Optional[float] = None
    pm10: Optional[float] = None
    no2: Optional[float] = None
    o3: Optional[float] = None
    so2: Optional[float] = None
    co: Optional[float] = None
    aqi: Optional[int] = None
    aqi_category: Optional[str] = None
    station_count: int


class HistoricalPollutionResponse(BaseModel):
    """Response schema for historical pollution data."""
    location: Dict[str, Any]
    range: Dict[str, date]
    measurements: List[DailyMeasurement]
    total_count: int
    page: int = 1
    page_size: int = 100


class PredictionRequest(BaseModel):
    """Request schema for pollution prediction."""
    country: Optional[str] = None
    lat: Optional[float] = Field(None, ge=-90, le=90)
    lon: Optional[float] = Field(None, ge=-180, le=180)
    start: date
    end: date
    model: str = Field(default="timegpt", description="Prediction model to use")


class PredictionPoint(BaseModel):
    """Single prediction point."""
    date: date
    predicted_aqi: int
    category: str
    confidence: Optional[Dict[str, int]] = None


class Alert(BaseModel):
    """Alert information."""
    date: date
    aqi: int
    category: str
    message: str


class PredictionResponse(BaseModel):
    """Response schema for pollution prediction."""
    location: Dict[str, Any]
    range: Dict[str, date]
    predictions: List[PredictionPoint]
    alerts: List[Alert]
    meta: Dict[str, Any]
