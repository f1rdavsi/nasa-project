#!/usr/bin/env python3
"""
Test script to verify the Air Pollution Prediction API installation.
"""
import sys
import os
from pathlib import Path

def test_imports():
    """Test that all required modules can be imported."""
    print("🔍 Testing imports...")
    
    try:
        import fastapi
        print("✅ FastAPI imported successfully")
    except ImportError as e:
        print(f"❌ FastAPI import failed: {e}")
        return False
    
    try:
        import uvicorn
        print("✅ Uvicorn imported successfully")
    except ImportError as e:
        print(f"❌ Uvicorn import failed: {e}")
        return False
    
    try:
        import httpx
        print("✅ HTTPX imported successfully")
    except ImportError as e:
        print(f"❌ HTTPX import failed: {e}")
        return False
    
    try:
        import sqlmodel
        print("✅ SQLModel imported successfully")
    except ImportError as e:
        print(f"❌ SQLModel import failed: {e}")
        return False
    
    try:
        import pydantic
        print("✅ Pydantic imported successfully")
    except ImportError as e:
        print(f"❌ Pydantic import failed: {e}")
        return False
    
    return True

def test_project_structure():
    """Test that all required files exist."""
    print("\n📁 Testing project structure...")
    
    required_files = [
        "main.py",
        "requirements.txt",
        "env.example",
        "README.md",
        "db/models.py",
        "db/database.py",
        "services/aqi.py",
        "services/openaq_service.py",
        "services/timegpt_service.py",
        "services/telegram_service.py",
        "routers/location.py",
        "routers/pollution.py",
        "routers/alerts.py",
        "schemas/location.py",
        "schemas/pollution.py",
        "schemas/alerts.py",
        "tests/test_aqi.py",
        "tests/test_timegpt.py",
        "tests/test_api.py"
    ]
    
    missing_files = []
    for file_path in required_files:
        if not Path(file_path).exists():
            missing_files.append(file_path)
        else:
            print(f"✅ {file_path}")
    
    if missing_files:
        print(f"\n❌ Missing files: {missing_files}")
        return False
    
    return True

def test_aqi_calculations():
    """Test AQI calculation functions."""
    print("\n🧮 Testing AQI calculations...")
    
    try:
        from services.aqi import AQICalculator, calculate_pm25_aqi
        
        # Test PM2.5 calculation
        aqi = calculate_pm25_aqi(25.0)
        if aqi is not None and 0 <= aqi <= 500:
            print(f"✅ PM2.5 AQI calculation: {aqi}")
        else:
            print(f"❌ Invalid PM2.5 AQI: {aqi}")
            return False
        
        # Test category mapping
        category = AQICalculator.get_aqi_category(75)
        if category:
            print(f"✅ AQI category mapping: {category}")
        else:
            print("❌ AQI category mapping failed")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ AQI calculation test failed: {e}")
        return False

def test_environment():
    """Test environment configuration."""
    print("\n🌍 Testing environment...")
    
    # Check if .env file exists
    if Path(".env").exists():
        print("✅ .env file found")
    else:
        print("⚠️  .env file not found (copy from env.example)")
    
    # Check environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    env_vars = {
        "NIXTLA_API_KEY": os.getenv("NIXTLA_API_KEY"),
        "TELEGRAM_BOT_TOKEN": os.getenv("TELEGRAM_BOT_TOKEN"),
        "OPENAQ_CACHE_DB": os.getenv("OPENAQ_CACHE_DB"),
        "ALERT_DEFAULT_THRESHOLD": os.getenv("ALERT_DEFAULT_THRESHOLD"),
        "LOG_LEVEL": os.getenv("LOG_LEVEL")
    }
    
    for var, value in env_vars.items():
        if value:
            print(f"✅ {var}: configured")
        else:
            print(f"⚠️  {var}: not set")
    
    return True

def main():
    """Run all tests."""
    print("🚀 Air Pollution Prediction API - Installation Test")
    print("=" * 50)
    
    tests = [
        ("Import Test", test_imports),
        ("Project Structure", test_project_structure),
        ("AQI Calculations", test_aqi_calculations),
        ("Environment", test_environment)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
            else:
                print(f"\n❌ {test_name} failed")
        except Exception as e:
            print(f"\n❌ {test_name} failed with error: {e}")
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The API is ready to run.")
        print("\nNext steps:")
        print("1. Configure your API keys in .env file")
        print("2. Run: python run.py")
        print("3. Visit: http://localhost:8000/docs")
    else:
        print("⚠️  Some tests failed. Please check the errors above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
