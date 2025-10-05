"""
Database models for Air Pollution Prediction app.
"""
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship


class Station(SQLModel, table=True):
    """OpenAQ station metadata."""
    id: Optional[int] = Field(default=None, primary_key=True)
    station_id: str = Field(unique=True, index=True)
    name: str
    country: str
    city: Optional[str] = None
    latitude: float
    longitude: float
    timezone: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    measurements: list["Measurement"] = Relationship(back_populates="station")


class Measurement(SQLModel, table=True):
    """Daily aggregated pollution measurements."""
    id: Optional[int] = Field(default=None, primary_key=True)
    station_id: int = Field(foreign_key="station.id")
    date: datetime = Field(index=True)  # UTC date
    pm25: Optional[float] = None
    pm10: Optional[float] = None
    no2: Optional[float] = None
    o3: Optional[float] = None
    so2: Optional[float] = None
    co: Optional[float] = None
    aqi: Optional[int] = None
    aqi_category: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    station: Station = Relationship(back_populates="measurements")


class Subscriber(SQLModel, table=True):
    """Telegram alert subscribers."""
    id: Optional[int] = Field(default=None, primary_key=True)
    chat_id: str = Field(unique=True, index=True)
    latitude: float
    longitude: float
    threshold: int = Field(default=100)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    alerts: list["AlertLog"] = Relationship(back_populates="subscriber")


class AlertLog(SQLModel, table=True):
    """Log of sent alerts."""
    id: Optional[int] = Field(default=None, primary_key=True)
    subscriber_id: int = Field(foreign_key="subscriber.id")
    alert_date: datetime
    aqi_value: int
    threshold: int
    message: str
    sent_at: datetime = Field(default_factory=datetime.utcnow)
    success: bool = Field(default=True)
    error_message: Optional[str] = None
    
    # Relationships
    subscriber: Subscriber = Relationship(back_populates="alerts")


class CacheMetadata(SQLModel, table=True):
    """Cache metadata for tracking data freshness."""
    id: Optional[int] = Field(default=None, primary_key=True)
    cache_key: str = Field(unique=True, index=True)
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    data_count: int = Field(default=0)
    expires_at: Optional[datetime] = None
