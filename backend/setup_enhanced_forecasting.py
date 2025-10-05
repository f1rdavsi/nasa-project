#!/usr/bin/env python3
"""
Setup script for the enhanced forecasting system.
"""
import subprocess
import sys
import os

def install_dependencies():
    """Install required dependencies for enhanced forecasting."""
    print("📦 Installing enhanced forecasting dependencies...")
    
    dependencies = [
        "numpy==1.24.3",
        "pandas==2.0.3", 
        "scikit-learn==1.3.0"
    ]
    
    for dep in dependencies:
        try:
            print(f"Installing {dep}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", dep])
            print(f"✅ {dep} installed successfully")
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install {dep}: {e}")
            return False
    
    return True

def test_imports():
    """Test that all required modules can be imported."""
    print("\n🔍 Testing imports...")
    
    try:
        import numpy as np
        print("✅ NumPy imported successfully")
    except ImportError as e:
        print(f"❌ NumPy import failed: {e}")
        return False
    
    try:
        import pandas as pd
        print("✅ Pandas imported successfully")
    except ImportError as e:
        print(f"❌ Pandas import failed: {e}")
        return False
    
    try:
        import sklearn
        print("✅ Scikit-learn imported successfully")
    except ImportError as e:
        print(f"❌ Scikit-learn import failed: {e}")
        return False
    
    return True

def test_forecasting():
    """Test the enhanced forecasting system."""
    print("\n🧪 Testing enhanced forecasting system...")
    
    try:
        from forecasting.forecasting_service import ForecastingService
        print("✅ ForecastingService imported successfully")
        
        # Create service
        service = ForecastingService()
        print("✅ ForecastingService created successfully")
        
        # Test available methods
        methods = service.get_available_methods()
        print(f"✅ Available methods: {methods}")
        
        return True
        
    except ImportError as e:
        print(f"❌ Forecasting import failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Forecasting test failed: {e}")
        return False

def main():
    """Main setup function."""
    print("🚀 Enhanced Forecasting Setup")
    print("=" * 40)
    
    # Install dependencies
    if not install_dependencies():
        print("\n❌ Dependency installation failed!")
        sys.exit(1)
    
    # Test imports
    if not test_imports():
        print("\n❌ Import tests failed!")
        sys.exit(1)
    
    # Test forecasting
    if not test_forecasting():
        print("\n❌ Forecasting tests failed!")
        sys.exit(1)
    
    print("\n🎉 Enhanced forecasting setup completed successfully!")
    print("\nNext steps:")
    print("1. Run the API: python run.py")
    print("2. Test prediction: curl 'http://localhost:8000/api/pollution/predict?lat=38.5358&lon=68.7791&start=2024-02-01&end=2024-02-07'")
    print("3. View docs: http://localhost:8000/docs")

if __name__ == "__main__":
    main()
