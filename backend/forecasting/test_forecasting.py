"""
Test script for the enhanced forecasting system.
"""
import asyncio
from datetime import date, timedelta
from forecasting_service import ForecastingService
from forecasting.models import SomeModel


async def test_forecasting():
    """Test the enhanced forecasting system."""
    service = ForecastingService()
    
    # Create sample historical data
    historical_data = []
    base_date = date.today() - timedelta(days=30)
    
    for i in range(30):
        current_date = base_date + timedelta(days=i)
        # Generate realistic AQI with some trend
        base_aqi = 50 + (i * 2) + (i % 7) * 5  # Trend + weekly pattern
        aqi = max(0, min(500, base_aqi))
        
        historical_data.append({
            "date": current_date,
            "aqi": aqi
        })
    
    print("🧪 Testing Enhanced Forecasting System")
    print("=" * 50)
    
    # Test different methods
    methods = ['linear', 'moving_average', 'exponential_smoothing', 'seasonal', 'arima', 'ensemble']
    
    for method in methods:
        print(f"\n📊 Testing {method.upper()} method:")
        try:
            predictions, metadata = await service.forecast_aqi(
                historical_data, 
                forecast_days=7, 
                method=method
            )
            
            print(f"✅ Model: {metadata['model']}")
            print(f"📈 Data points: {metadata['data_points']}")
            print(f"🎯 Confidence: {metadata['confidence']}")
            
            print("📅 Predictions:")
            for pred in predictions[:3]:  # Show first 3 predictions
                print(f"   {pred['date']}: AQI {pred['predicted_aqi']} ({pred['category']})")
            
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print("\n🎉 Testing completed!")

if __name__ == "__main__":
    asyncio.run(test_forecasting())
