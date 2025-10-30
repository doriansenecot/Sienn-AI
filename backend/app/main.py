from fastapi import FastAPI
from fastapi.responses import JSONResponse

from .core.config import settings

app = FastAPI(title="Sienn-AI API", version="0.1.0")


@app.get("/health")
async def health():
    """Simple health endpoint"""
    return JSONResponse({"status": "ok", "env": settings.environment})


@app.get("/")
async def root():
    return {"message": "Sienn-AI API", "version": "0.1.0"}
