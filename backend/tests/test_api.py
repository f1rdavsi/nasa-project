"""
Unit tests for API endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

class TestAPIEndpoints:
    """Test cases for API endpoints."""
    
    def test_root_endpoint(self):
        """Test root endpoint."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
        assert "docs" in data
    
    def test_health_check(self):
        """Test health check endpoint."""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "version" in data
        assert "environment" in data
        assert "database" in data
        assert "services" in data
    
    def test_get_current_location(self):
        """Test current location detection."""
        response = client.get("/api/location/current")
        assert response.status_code == 200
        data = response.json()
        assert "city" in data
        assert "country" in data
        assert "lat" in data
        assert "lon" in data
        assert "detected_from" in data
    
    def test_select_location_by_country(self):
        """Test location selection by country."""
        response = client.post(
            "/api/location/select",
            json={"country": "Tajikistan"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["country"] == "Tajikistan"
        assert "lat" in data
        assert "lon" in data
    
    def test_select_location_by_coordinates(self):
        """Test location selection by coordinates."""
        response = client.post(
            "/api/location/select",
            json={"lat": 38.5358, "lon": 68.7791}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["lat"] == 38.5358
        assert data["lon"] == 68.7791
    
    def test_select_location_invalid_input(self):
        """Test location selection with invalid input."""
        response = client.post(
            "/api/location/select",
            json={}
        )
        assert response.status_code == 400
    
    def test_get_current_pollution(self):
        """Test current pollution endpoint."""
        response = client.get(
            "/api/pollution/current/location",
            params={"lat": 38.5358, "lon": 68.7791}
        )
        assert response.status_code == 200
        data = response.json()
        assert "location" in data
        assert "measurements" in data
        assert "aqi" in data
        assert "aqi_category" in data
        assert "aqi_breakdown" in data
    
    def test_get_historical_pollution(self):
        """Test historical pollution endpoint."""
        response = client.get(
            "/api/pollution/history",
            params={
                "lat": 38.5358,
                "lon": 68.7791,
                "start": "2024-01-01",
                "end": "2024-01-07"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "location" in data
        assert "range" in data
        assert "measurements" in data
        assert "total_count" in data
    
    def test_get_historical_pollution_invalid_dates(self):
        """Test historical pollution with invalid date range."""
        response = client.get(
            "/api/pollution/history",
            params={
                "lat": 38.5358,
                "lon": 68.7791,
                "start": "2024-01-07",
                "end": "2024-01-01"  # End before start
            }
        )
        assert response.status_code == 400
    
    def test_get_pollution_prediction(self):
        """Test pollution prediction endpoint."""
        response = client.get(
            "/api/pollution/predict",
            params={
                "lat": 38.5358,
                "lon": 68.7791,
                "start": "2024-02-01",
                "end": "2024-02-07"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "location" in data
        assert "range" in data
        assert "predictions" in data
        assert "alerts" in data
        assert "meta" in data
    
    def test_get_pollution_prediction_past_date(self):
        """Test pollution prediction with past start date."""
        response = client.get(
            "/api/pollution/predict",
            params={
                "lat": 38.5358,
                "lon": 68.7791,
                "start": "2024-01-01",  # Past date
                "end": "2024-01-07"
            }
        )
        assert response.status_code == 400
    
    def test_subscribe_to_alerts(self):
        """Test alert subscription."""
        response = client.post(
            "/api/alerts/subscribe",
            json={
                "chat_id": "12345",
                "location": {"lat": 38.5358, "lon": 68.7791},
                "threshold": 100
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["chat_id"] == "12345"
        assert data["threshold"] == 100
        assert data["is_active"] == True
    
    def test_subscribe_to_alerts_invalid_location(self):
        """Test alert subscription with invalid location."""
        response = client.post(
            "/api/alerts/subscribe",
            json={
                "chat_id": "12345",
                "location": {"lat": 200, "lon": 68.7791},  # Invalid lat
                "threshold": 100
            }
        )
        assert response.status_code == 400
    
    def test_unsubscribe_from_alerts(self):
        """Test alert unsubscription."""
        # First subscribe
        client.post(
            "/api/alerts/subscribe",
            json={
                "chat_id": "12345",
                "location": {"lat": 38.5358, "lon": 68.7791},
                "threshold": 100
            }
        )
        
        # Then unsubscribe
        response = client.delete(
            "/api/alerts/unsubscribe",
            json={"chat_id": "12345"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
    
    def test_unsubscribe_nonexistent(self):
        """Test unsubscribing from non-existent subscription."""
        response = client.delete(
            "/api/alerts/unsubscribe",
            json={"chat_id": "nonexistent"}
        )
        assert response.status_code == 404
    
    def test_check_alerts(self):
        """Test manual alert check."""
        response = client.get(
            "/api/alerts/check",
            params={
                "lat": 38.5358,
                "lon": 68.7791,
                "start": "2024-02-01",
                "end": "2024-02-07"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "alerts_sent" in data
        assert "subscribers_notified" in data
        assert "details" in data
        assert "checked_at" in data
    
    def test_check_alerts_invalid_dates(self):
        """Test alert check with invalid date format."""
        response = client.get(
            "/api/alerts/check",
            params={
                "lat": 38.5358,
                "lon": 68.7791,
                "start": "invalid-date",
                "end": "2024-02-07"
            }
        )
        assert response.status_code == 400
    
    def test_get_subscription(self):
        """Test getting subscription details."""
        # First subscribe
        client.post(
            "/api/alerts/subscribe",
            json={
                "chat_id": "12345",
                "location": {"lat": 38.5358, "lon": 68.7791},
                "threshold": 100
            }
        )
        
        # Then get subscription
        response = client.get("/api/alerts/subscriptions/12345")
        assert response.status_code == 200
        data = response.json()
        assert data["chat_id"] == "12345"
        assert data["threshold"] == 100
    
    def test_get_nonexistent_subscription(self):
        """Test getting non-existent subscription."""
        response = client.get("/api/alerts/subscriptions/nonexistent")
        assert response.status_code == 404
    
    def test_get_alert_history(self):
        """Test getting alert history."""
        # First subscribe
        client.post(
            "/api/alerts/subscribe",
            json={
                "chat_id": "12345",
                "location": {"lat": 38.5358, "lon": 68.7791},
                "threshold": 100
            }
        )
        
        # Then get history
        response = client.get("/api/alerts/history/12345")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
