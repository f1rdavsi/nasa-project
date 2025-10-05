"""
AQI (Air Quality Index) calculation utilities using EPA standards.
"""
from typing import Dict, Optional, Tuple
import math


class AQICalculator:
    """EPA AQI calculation for various pollutants."""
    
    # EPA AQI breakpoints and corresponding AQI values
    AQI_BREAKPOINTS = {
        "pm25": [
            (0.0, 12.0, 0, 50),      # Good
            (12.1, 35.4, 51, 100),   # Moderate
            (35.5, 55.4, 101, 150),  # Unhealthy for Sensitive Groups
            (55.5, 150.4, 151, 200), # Unhealthy
            (150.5, 250.4, 201, 300), # Very Unhealthy
            (250.5, 500.4, 301, 500) # Hazardous
        ],
        "pm10": [
            (0.0, 54.0, 0, 50),
            (55.0, 154.0, 51, 100),
            (155.0, 254.0, 101, 150),
            (255.0, 354.0, 151, 200),
            (355.0, 424.0, 201, 300),
            (425.0, 604.0, 301, 500)
        ],
        "no2": [
            (0.0, 53.0, 0, 50),
            (54.0, 100.0, 51, 100),
            (101.0, 360.0, 101, 150),
            (361.0, 649.0, 151, 200),
            (650.0, 1249.0, 201, 300),
            (1250.0, 2049.0, 301, 500)
        ],
        "o3": [
            (0.0, 54.0, 0, 50),
            (55.0, 70.0, 51, 100),
            (71.0, 85.0, 101, 150),
            (86.0, 105.0, 151, 200),
            (106.0, 200.0, 201, 300),
            (201.0, 500.0, 301, 500)
        ],
        "so2": [
            (0.0, 35.0, 0, 50),
            (36.0, 75.0, 51, 100),
            (76.0, 185.0, 101, 150),
            (186.0, 304.0, 151, 200),
            (305.0, 604.0, 201, 300),
            (605.0, 1004.0, 301, 500)
        ],
        "co": [
            (0.0, 4.4, 0, 50),
            (4.5, 9.4, 51, 100),
            (9.5, 12.4, 101, 150),
            (12.5, 15.4, 151, 200),
            (15.5, 30.4, 201, 300),
            (30.5, 50.4, 301, 500)
        ]
    }
    
    AQI_CATEGORIES = {
        0: "Good",
        51: "Moderate", 
        101: "Unhealthy for Sensitive Groups",
        151: "Unhealthy",
        201: "Very Unhealthy",
        301: "Hazardous"
    }
    
    @classmethod
    def calculate_aqi(cls, concentration: float, pollutant: str) -> Optional[int]:
        """
        Calculate AQI for a single pollutant concentration.
        
        Args:
            concentration: Pollutant concentration in appropriate units
            pollutant: Pollutant type (pm25, pm10, no2, o3, so2, co)
            
        Returns:
            AQI value or None if concentration is invalid
        """
        if concentration is None or concentration < 0:
            return None
            
        pollutant = pollutant.lower()
        if pollutant not in cls.AQI_BREAKPOINTS:
            return None
            
        breakpoints = cls.AQI_BREAKPOINTS[pollutant]
        
        for c_low, c_high, aqi_low, aqi_high in breakpoints:
            if c_low <= concentration <= c_high:
                # Linear interpolation formula
                aqi = ((aqi_high - aqi_low) / (c_high - c_low)) * (concentration - c_low) + aqi_low
                return round(aqi)
        
        # If concentration exceeds highest breakpoint, return 500
        return 500
    
    @classmethod
    def calculate_daily_aqi(cls, measurements: Dict[str, float]) -> Tuple[Optional[int], str, Dict[str, int]]:
        """
        Calculate daily AQI from multiple pollutant measurements.
        
        Args:
            measurements: Dict of pollutant concentrations {pm25: 25.5, pm10: 45.2, ...}
            
        Returns:
            Tuple of (daily_aqi, category, breakdown)
        """
        aqi_values = {}
        breakdown = {}
        
        # Calculate AQI for each pollutant
        for pollutant, concentration in measurements.items():
            aqi = cls.calculate_aqi(concentration, pollutant)
            if aqi is not None:
                aqi_values[pollutant] = aqi
                breakdown[pollutant] = aqi
        
        if not aqi_values:
            return None, "Unknown", {}
        
        # Daily AQI is the maximum of all pollutant AQIs
        daily_aqi = max(aqi_values.values())
        category = cls.get_aqi_category(daily_aqi)
        
        return daily_aqi, category, breakdown
    
    @classmethod
    def get_aqi_category(cls, aqi: int) -> str:
        """Get AQI category from AQI value."""
        if aqi <= 50:
            return cls.AQI_CATEGORIES[0]
        elif aqi <= 100:
            return cls.AQI_CATEGORIES[51]
        elif aqi <= 150:
            return cls.AQI_CATEGORIES[101]
        elif aqi <= 200:
            return cls.AQI_CATEGORIES[151]
        elif aqi <= 300:
            return cls.AQI_CATEGORIES[201]
        else:
            return cls.AQI_CATEGORIES[301]
    
    @classmethod
    def is_alert_threshold_exceeded(cls, aqi: int, threshold: int) -> bool:
        """Check if AQI exceeds alert threshold."""
        return aqi > threshold


# Utility functions for easy access
def calculate_pm25_aqi(concentration: float) -> Optional[int]:
    """Calculate PM2.5 AQI."""
    return AQICalculator.calculate_aqi(concentration, "pm25")


def calculate_pm10_aqi(concentration: float) -> Optional[int]:
    """Calculate PM10 AQI."""
    return AQICalculator.calculate_aqi(concentration, "pm10")


def calculate_no2_aqi(concentration: float) -> Optional[int]:
    """Calculate NO2 AQI."""
    return AQICalculator.calculate_aqi(concentration, "no2")


def calculate_o3_aqi(concentration: float) -> Optional[int]:
    """Calculate O3 AQI."""
    return AQICalculator.calculate_aqi(concentration, "o3")


def calculate_so2_aqi(concentration: float) -> Optional[int]:
    """Calculate SO2 AQI."""
    return AQICalculator.calculate_aqi(concentration, "so2")


def calculate_co_aqi(concentration: float) -> Optional[int]:
    """Calculate CO AQI."""
    return AQICalculator.calculate_aqi(concentration, "co")
