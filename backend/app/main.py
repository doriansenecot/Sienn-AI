"""Main FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.db import init_db
from app.routes import datasets, jobs, inference, exports

app = FastAPI(title="Sienn-AI API", version="0.1.0")


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    await init_db()


@app.get("/health")
async def health():
    """Health check endpoint."""
    return JSONResponse({"status": "ok", "env": settings.environment})


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Sienn-AI API", "version": "0.1.0"}


app.include_router(datasets.router)
app.include_router(jobs.router)
app.include_router(inference.router)
app.include_router(exports.router)
