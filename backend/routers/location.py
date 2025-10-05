"""
Location-related API endpoints.
"""
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Request, Depends
from sqlmodel import Session
from db.database import get_session
from schemas.location import LocationRequest, LocationResponse, CurrentLocationResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/location", tags=["location"])

@router.get("/current", response_model=CurrentLocationResponse)
async def get_current_location(request: Request):
    # Берём реальный IP из заголовков, если есть, иначе fallback на request.client.host
    client_ip = (
            request.headers.get("CF-Connecting-IP") or
            request.headers.get("X-Real-IP") or
            request.headers.get("X-Forwarded-For") or
            request.client.host
    )

    # Игнорируем локальный IP Docker
    if client_ip in ("127.0.0.1", "172.18.0.1"):
        client_ip = None

    # Если есть IP, пробуем геолокацию по IP
    if client_ip:
        location = await _get_location_from_ip(client_ip)
        if location:
            return CurrentLocationResponse(
                city=location.get("city", "Unknown"),
                country=location.get("country", "Unknown"),
                lat=location.get("lat", 0.0),
                lon=location.get("lon", 0.0),
                detected_from="ip"
            )

    # Фолбэк на координаты Душанбe
    return CurrentLocationResponse(
        city="Dushanbe",
        country="Tajikistan",
        lat=38.5358,
        lon=68.7791,
        detected_from="fallback"
    )

@router.post("/select", response_model=LocationResponse)
async def select_location(location_request: LocationRequest):
    """
    Set selected location for pollution data requests.
    
    This endpoint accepts either:
    - Country name for country-wide data
    - Latitude and longitude for specific coordinates
    
    Args:
        location_request: LocationRequest with country or coordinates
        
    Returns:
        LocationResponse with selected location information
    """
    try:
        if location_request.country:
            # Country-based selection
            country_info = await _get_country_info(location_request.country)
            if not country_info:
                raise HTTPException(
                    status_code=400,
                    detail=f"Country '{location_request.country}' not found"
                )
            
            return LocationResponse(
                city=country_info.get("capital", "Unknown"),
                country=location_request.country,
                lat=country_info.get("lat", 0.0),
                lon=country_info.get("lon", 0.0),
                timezone=country_info.get("timezone")
            )
        
        elif location_request.lat is not None and location_request.lon is not None:
            # Coordinate-based selection
            location_info = await _get_location_from_coordinates(
                location_request.lat, location_request.lon
            )
            
            return LocationResponse(
                city=location_info.get("city", "Unknown"),
                country=location_info.get("country", "Unknown"),
                lat=location_request.lat,
                lon=location_request.lon,
                timezone=location_info.get("timezone")
            )
        
        else:
            raise HTTPException(
                status_code=400,
                detail="Either 'country' or both 'lat' and 'lon' must be provided"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error selecting location: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to select location"
        )

async def _get_location_from_ip(ip_address: str) -> Optional[dict]:
    """
    Get location information from IP address using a geolocation service.
    
    Args:
        ip_address: IP address to geolocate
        
    Returns:
        Dictionary with location information or None
    """
    try:
        import httpx
        
        # Using ipapi.co as a free geolocation service
        async with httpx.AsyncClient() as client:
            response = await client.get(f"https://ipapi.co/{ip_address}/json/")
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "city": data.get("city"),
                    "country": data.get("country_name"),
                    "lat": data.get("latitude"),
                    "lon": data.get("longitude"),
                    "timezone": data.get("timezone")
                }
    except Exception as e:
        logger.warning(f"Failed to geolocate IP {ip_address}: {e}")
    
    return None

async def _get_country_info(country_name: str) -> Optional[dict]:
    """
    Get country information including capital coordinates.
    
    Args:
        country_name: Name of the country
        
    Returns:
        Dictionary with country information or None
    """
    # Simple country database (in production, use a proper geocoding service)
    countries = {
        "tajikistan": {
            "capital": "Dushanbe",
            "lat": 38.5358,
            "lon": 68.7791,
            "timezone": "Asia/Dushanbe"
        },
        "germany": {
            "capital": "Berlin",
            "lat": 52.5200,
            "lon": 13.4050,
            "timezone": "Europe/Berlin"
        },
        "usa": {
            "capital": "Washington",
            "lat": 38.9072,
            "lon": -77.0369,
            "timezone": "America/New_York"
        },
        "china": {
            "capital": "Beijing",
            "lat": 39.9042,
            "lon": 116.4074,
            "timezone": "Asia/Shanghai"
        },
        "india": {
            "capital": "New Delhi",
            "lat": 28.6139,
            "lon": 77.2090,
            "timezone": "Asia/Kolkata"
        },
        "russia": {
            "capital": "Moscow",
            "lat": 55.7558,
            "lon": 37.6176,
            "timezone": "Europe/Moscow"
        }
    }
    
    return countries.get(country_name.lower())

async def _get_location_from_coordinates(lat: float, lon: float) -> dict:
    """
    Get location information from coordinates using reverse geocoding.
    
    Args:
        lat: Latitude
        lon: Longitude
        
    Returns:
        Dictionary with location information
    """
    try:
        import httpx
        
        # Using Nominatim (OpenStreetMap) for reverse geocoding
        async with httpx.AsyncClient() as client:
            url = "https://nominatim.openstreetmap.org/reverse"
            params = {
                "lat": lat,
                "lon": lon,
                "format": "json",
                "addressdetails": 1
            }
            
            response = await client.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                address = data.get("address", {})
                
                return {
                    "city": address.get("city") or address.get("town") or address.get("village"),
                    "country": address.get("country"),
                    "lat": lat,
                    "lon": lon,
                    "timezone": None  # Would need additional service for timezone
                }
    except Exception as e:
        logger.warning(f"Failed to reverse geocode coordinates {lat}, {lon}: {e}")
    
    # Fallback
    return {
        "city": "Unknown",
        "country": "Unknown",
        "lat": lat,
        "lon": lon,
        "timezone": None
    }
