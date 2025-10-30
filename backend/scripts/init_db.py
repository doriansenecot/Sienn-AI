#!/usr/bin/env python3
"""Init simple SQLite DB for Sienn-AI
Creates data directory and a simple jobs table."""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parents[1] / "data" / "data.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

def init_db(path: Path = DB_PATH):
    conn = sqlite3.connect(path)
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS jobs (
            id TEXT PRIMARY KEY,
            status TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            meta TEXT
        )
    ''')
    conn.commit()
    conn.close()
    print(f"Initialized DB at {path}")

if __name__ == "__main__":
    init_db()
