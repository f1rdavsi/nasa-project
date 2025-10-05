"""
Air Pollution Prediction API - Main FastAPI application.
"""
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import routers
from routers import location, pollution, alerts
from db.database import create_db_and_tables

# Configure logging
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("Starting Air Pollution Prediction API...")
    
    # Create database tables
    try:
        create_db_and_tables()
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        raise
    
    # Check environment variables
    required_vars = ["NIXTLA_API_KEY", "TELEGRAM_BOT_TOKEN"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        logger.warning(f"Missing environment variables: {missing_vars}")
        logger.warning("API will run in mock mode for missing services")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Air Pollution Prediction API...")

# Create FastAPI application
app = FastAPI(
    title="Air Pollution Prediction API",
    description="""
    A comprehensive API for air pollution monitoring and prediction.
    
    ## Features
    
    * **Location Detection**: Auto-detect user location or manual selection
    * **Current Pollution**: Real-time air quality data from OpenAQ
    * **Historical Data**: Cached historical pollution measurements
    * **Predictions**: AI-powered AQI forecasting using OpenRouter (DeepSeek)
    * **Alerts**: Telegram notifications for unhealthy air quality
    
    ## Data Sources
    
    * **OpenAQ**: Real-time and historical air pollution data
    * **OpenRouter (DeepSeek)**: AI forecasting model
    * **EPA Standards**: AQI calculations and categories
    
    ## Environment Variables
    
    Make sure to set the following environment variables:
    - `OPENROUTER_API_KEY`: Your OpenRouter API key
    - `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
    - `OPENAQ_CACHE_DB`: Path to SQLite database file
    - `ALERT_DEFAULT_THRESHOLD`: Default AQI threshold (default: 100)
    - `LOG_LEVEL`: Logging level (default: INFO)
    
    ## Mock Mode
    
    If API keys are not provided, the service will run in mock mode
    with realistic sample data for development and testing.
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(location.router)
app.include_router(pollution.router)
app.include_router(alerts.router)

@app.get("/api/health")
async def health_check():
    """
    Health check endpoint.
    
    Returns the current status of the API and its dependencies.
    """
    try:
        # Check environment variables
        env_status = {
            "OPENROUTER_API_KEY": bool(os.getenv("OPENROUTER_API_KEY")),
            "TELEGRAM_BOT_TOKEN": bool(os.getenv("TELEGRAM_BOT_TOKEN")),
            "OPENAQ_CACHE_DB": bool(os.getenv("OPENAQ_CACHE_DB")),
        }
        
        # Check database
        try:
            from db.database import engine
            with engine.connect() as conn:
                conn.execute("SELECT 1")
            db_status = "healthy"
        except Exception as e:
            db_status = f"unhealthy: {str(e)}"
        
        return {
            "status": "healthy",
            "version": "1.0.0",
            "environment": env_status,
            "database": db_status,
            "services": {
                "openaq": "available",
                "forecast_llm": "available" if env_status["OPENROUTER_API_KEY"] else "mock_mode",
                "telegram": "available" if env_status["TELEGRAM_BOT_TOKEN"] else "mock_mode"
            }
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "status": "unhealthy",
                "error": str(e)
            }
        )

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Air Pollution Prediction API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health",
        "endpoints": {
            "location": "/api/location",
            "pollution": "/api/pollution", 
            "alerts": "/api/alerts"
        }
    }

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """General exception handler."""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "status_code": 500
        }
    )

if __name__ == "__main__":
    import uvicorn
    
    # Get configuration from environment
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    reload = os.getenv("RELOAD", "false").lower() == "true"
    
    logger.info(f"Starting server on {host}:{port}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=reload,
        log_level=os.getenv("LOG_LEVEL", "info").lower()
    )
