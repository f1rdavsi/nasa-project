"""
Unit tests for AQI calculation service.
"""
import pytest
from services.aqi import AQICalculator, calculate_pm25_aqi, calculate_pm10_aqi


class TestAQICalculator:
    """Test cases for AQI calculation."""
    
    def test_pm25_aqi_calculation(self):
        """Test PM2.5 AQI calculation."""
        # Good air quality
        assert calculate_pm25_aqi(10.0) == 42
        assert calculate_pm25_aqi(12.0) == 50
        
        # Moderate air quality
        assert calculate_pm25_aqi(25.0) == 75
        assert calculate_pm25_aqi(35.4) == 100
        
        # Unhealthy for sensitive groups
        assert calculate_pm25_aqi(45.0) == 125
        assert calculate_pm25_aqi(55.4) == 150
        
        # Unhealthy
        assert calculate_pm25_aqi(100.0) == 175
        assert calculate_pm25_aqi(150.4) == 200
        
        # Very unhealthy
        assert calculate_pm25_aqi(200.0) == 250
        assert calculate_pm25_aqi(250.4) == 300
        
        # Hazardous
        assert calculate_pm25_aqi(300.0) == 400
        assert calculate_pm25_aqi(500.4) == 500
    
    def test_pm10_aqi_calculation(self):
        """Test PM10 AQI calculation."""
        # Good air quality
        assert calculate_pm10_aqi(30.0) == 28
        assert calculate_pm10_aqi(54.0) == 50
        
        # Moderate air quality
        assert calculate_pm10_aqi(100.0) == 75
        assert calculate_pm10_aqi(154.0) == 100
    
    def test_no2_aqi_calculation(self):
        """Test NO2 AQI calculation."""
        # Good air quality
        assert AQICalculator.calculate_aqi(30.0, "no2") == 28
        assert AQICalculator.calculate_aqi(53.0, "no2") == 50
        
        # Moderate air quality
        assert AQICalculator.calculate_aqi(75.0, "no2") == 75
        assert AQICalculator.calculate_aqi(100.0, "no2") == 100
    
    def test_o3_aqi_calculation(self):
        """Test O3 AQI calculation."""
        # Good air quality
        assert AQICalculator.calculate_aqi(30.0, "o3") == 28
        assert AQICalculator.calculate_aqi(54.0, "o3") == 50
        
        # Moderate air quality
        assert AQICalculator.calculate_aqi(60.0, "o3") == 75
        assert AQICalculator.calculate_aqi(70.0, "o3") == 100
    
    def test_invalid_inputs(self):
        """Test AQI calculation with invalid inputs."""
        # None values
        assert calculate_pm25_aqi(None) is None
        assert AQICalculator.calculate_aqi(None, "pm25") is None
        
        # Negative values
        assert calculate_pm25_aqi(-10.0) is None
        assert AQICalculator.calculate_aqi(-5.0, "pm25") is None
        
        # Invalid pollutant
        assert AQICalculator.calculate_aqi(25.0, "invalid") is None
        assert AQICalculator.calculate_aqi(25.0, "") is None
    
    def test_daily_aqi_calculation(self):
        """Test daily AQI calculation from multiple pollutants."""
        measurements = {
            "pm25": 25.0,
            "pm10": 45.0,
            "no2": 35.0,
            "o3": 65.0
        }
        
        daily_aqi, category, breakdown = AQICalculator.calculate_daily_aqi(measurements)
        
        assert daily_aqi is not None
        assert category is not None
        assert isinstance(breakdown, dict)
        assert len(breakdown) == 4  # All 4 pollutants
        
        # Daily AQI should be the maximum of individual AQIs
        individual_aqis = [breakdown[param] for param in measurements.keys()]
        assert daily_aqi == max(individual_aqis)
    
    def test_aqi_categories(self):
        """Test AQI category mapping."""
        assert AQICalculator.get_aqi_category(25) == "Good"
        assert AQICalculator.get_aqi_category(75) == "Moderate"
        assert AQICalculator.get_aqi_category(125) == "Unhealthy for Sensitive Groups"
        assert AQICalculator.get_aqi_category(175) == "Unhealthy"
        assert AQICalculator.get_aqi_category(250) == "Very Unhealthy"
        assert AQICalculator.get_aqi_category(400) == "Hazardous"
    
    def test_alert_threshold_check(self):
        """Test alert threshold checking."""
        assert AQICalculator.is_alert_threshold_exceeded(75, 100) == False
        assert AQICalculator.is_alert_threshold_exceeded(125, 100) == True
        assert AQICalculator.is_alert_threshold_exceeded(100, 100) == False
        assert AQICalculator.is_alert_threshold_exceeded(101, 100) == True
    
    def test_edge_cases(self):
        """Test edge cases in AQI calculation."""
        # Zero values
        assert calculate_pm25_aqi(0.0) == 0
        
        # Very high values (should be capped at 500)
        assert calculate_pm25_aqi(1000.0) == 500
        assert AQICalculator.calculate_aqi(1000.0, "pm25") == 500
        
        # Boundary values
        assert calculate_pm25_aqi(12.1) == 51  # Just above good threshold
        assert calculate_pm25_aqi(35.5) == 101  # Just above moderate threshold
