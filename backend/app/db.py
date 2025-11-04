from contextlib import asynccontextmanager
from pathlib import Path

import aiosqlite

from .core.config import settings


@asynccontextmanager
async def get_db():
    """Async context manager yielding an aiosqlite connection.

    Usage in FastAPI endpoints:
        async with get_db() as conn:
            await conn.execute(...)
    """
    db_path = Path(settings.database_path)
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = await aiosqlite.connect(str(db_path))
    try:
        yield conn
    finally:
        await conn.close()


async def init_db():
    """Create basic tables if missing. Can be called at app startup."""
    async with get_db() as conn:
        # Jobs table
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY,
                dataset_id TEXT,
                status TEXT NOT NULL,
                progress REAL DEFAULT 0.0,
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                meta TEXT,
                FOREIGN KEY (dataset_id) REFERENCES datasets(id)
            )
            """
        )

        # Datasets table
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS datasets (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                original_filename TEXT NOT NULL,
                file_path TEXT NOT NULL,
                size_bytes INTEGER NOT NULL,
                content_type TEXT,
                status TEXT DEFAULT 'uploaded',
                num_rows INTEGER,
                num_columns INTEGER,
                column_names TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        await conn.commit()
