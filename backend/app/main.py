"""Main FastAPI application entry point."""

import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging_config import get_logger, setup_logging
from app.db import init_db
from app.routes import datasets, exports, inference, jobs, metrics, models

# Setup logging
setup_logging(
    level=settings.log_level,
    log_dir=settings.log_dir,
    enable_json=settings.enable_json_logs,
    enable_file_rotation=settings.enable_log_rotation,
)
logger = get_logger(__name__)

app = FastAPI(title="Sienn-AI API", version="0.1.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:5173",  # Vite default port
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all HTTP requests with timing."""
    start_time = time.time()

    logger.info(
        "Request started",
        extra={
            "method": request.method,
            "path": request.url.path,
            "client": request.client.host if request.client else None,
        },
    )

    response = await call_next(request)

    process_time = time.time() - start_time
    logger.info(
        "Request completed",
        extra={
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "process_time": f"{process_time:.3f}s",
        },
    )

    return response


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    logger.info("Starting Sienn-AI API", extra={"version": "0.1.0", "environment": settings.environment})
    await init_db()
    logger.info("Database initialized successfully")


@app.get("/health")
async def health():
    """Health check endpoint."""
    logger.debug("Health check called")
    return JSONResponse({"status": "ok", "env": settings.environment})


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Sienn-AI API", "version": "0.1.0"}


app.include_router(datasets.router)
app.include_router(jobs.router)
app.include_router(inference.router)
app.include_router(exports.router)
app.include_router(metrics.router)
app.include_router(models.router)
