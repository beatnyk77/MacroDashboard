"""
Market Cache & Persistence Engine
=================================
Dual-layer (in-memory + SQLite) caching system with configurable TTL
to enforce FinViz scraping hygiene and guard against rate limiting.

Features:
- In-memory fast layer with fallback to persistent SQLite.
- Configurable TTL (default: 15 minutes / 900 seconds).
- Thread-safe SQLite access with automatic directory creation.
- Fallback dataset loader for resilient offline execution and CI/CD.
"""

import json
import logging
import os
import sqlite3
import time
from typing import Any, Dict, Optional, Tuple

logger = logging.getLogger("market_cache")
logger.setLevel(logging.INFO)

DEFAULT_CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
DEFAULT_CACHE_DB = os.path.join(DEFAULT_CACHE_DIR, "market_cache.sqlite3")
DEFAULT_FALLBACK_FILE = os.path.join(DEFAULT_CACHE_DIR, "market_fallbacks.json")
DEFAULT_TTL_SECONDS = 900  # 15 minutes


class MarketCache:
    """Thread-safe SQLite + in-memory dual caching layer."""

    def __init__(
        self,
        db_path: str = DEFAULT_CACHE_DB,
        fallback_file: str = DEFAULT_FALLBACK_FILE,
        default_ttl: int = DEFAULT_TTL_SECONDS,
    ):
        self.db_path = db_path
        self.fallback_file = fallback_file
        self.default_ttl = default_ttl
        self._memory_store: Dict[str, Tuple[float, float, Any]] = {}  # key -> (timestamp, expires_at, value)
        self._init_db()

    def _init_db(self) -> None:
        """Initialize the SQLite schema if not already present."""
        try:
            os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS market_cache (
                        key TEXT PRIMARY KEY,
                        value_json TEXT NOT NULL,
                        created_at REAL NOT NULL,
                        expires_at REAL NOT NULL
                    )
                    """
                )
                conn.commit()
        except Exception as e:
            logger.warning(f"Could not initialize SQLite cache at {self.db_path}: {e}. Proceeding in-memory.")

    def get(self, key: str, allow_expired: bool = False) -> Optional[Dict[str, Any]]:
        """
        Retrieve value for key.
        If `allow_expired` is False, returns None if current time > expires_at.
        If `allow_expired` is True, returns the cached value even if expired (useful for fallbacks).
        """
        now = time.time()

        # Check memory first
        if key in self._memory_store:
            created_at, expires_at, value = self._memory_store[key]
            if allow_expired or now <= expires_at:
                return {
                    "data": value,
                    "cached": True,
                    "is_expired": now > expires_at,
                    "created_at": created_at,
                    "expires_at": expires_at,
                    "ttl_remaining_sec": max(0, int(expires_at - now)),
                }

        # Check SQLite
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT value_json, created_at, expires_at FROM market_cache WHERE key = ?",
                    (key,),
                )
                row = cursor.fetchone()
                if row:
                    value_json, created_at, expires_at = row
                    value = json.loads(value_json)
                    # Sync to memory store
                    self._memory_store[key] = (created_at, expires_at, value)
                    if allow_expired or now <= expires_at:
                        return {
                            "data": value,
                            "cached": True,
                            "is_expired": now > expires_at,
                            "created_at": created_at,
                            "expires_at": expires_at,
                            "ttl_remaining_sec": max(0, int(expires_at - now)),
                        }
        except Exception as e:
            logger.error(f"Error reading SQLite cache for key '{key}': {e}")

        return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Store value with specified or default TTL (in seconds)."""
        now = time.time()
        ttl_seconds = ttl if ttl is not None else self.default_ttl
        expires_at = now + ttl_seconds

        # Update in-memory
        self._memory_store[key] = (now, expires_at, value)

        # Update SQLite
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                value_json = json.dumps(value)
                cursor.execute(
                    """
                    INSERT INTO market_cache (key, value_json, created_at, expires_at)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(key) DO UPDATE SET
                        value_json = excluded.value_json,
                        created_at = excluded.created_at,
                        expires_at = excluded.expires_at
                    """,
                    (key, value_json, now, expires_at),
                )
                conn.commit()
        except Exception as e:
            logger.error(f"Error persisting to SQLite cache for key '{key}': {e}")

    def is_fresh(self, key: str) -> bool:
        """Check if cache contains a non-expired entry for key."""
        entry = self.get(key, allow_expired=False)
        return entry is not None and not entry.get("is_expired", True)

    def load_fallback_snapshot(self, section_key: str) -> Optional[Dict[str, Any]]:
        """Load deterministic institutional fallback data if both live and cached data fail."""
        try:
            if os.path.exists(self.fallback_file):
                with open(self.fallback_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return data.get(section_key)
        except Exception as e:
            logger.error(f"Error reading fallback snapshot file {self.fallback_file}: {e}")
        return None

    def clear(self, key: Optional[str] = None) -> None:
        """Clear specific key or entire cache."""
        if key:
            self._memory_store.pop(key, None)
            try:
                with sqlite3.connect(self.db_path) as conn:
                    conn.cursor().execute("DELETE FROM market_cache WHERE key = ?", (key,))
                    conn.commit()
            except Exception as e:
                logger.error(f"Error deleting key '{key}' from SQLite: {e}")
        else:
            self._memory_store.clear()
            try:
                with sqlite3.connect(self.db_path) as conn:
                    conn.cursor().execute("DELETE FROM market_cache")
                    conn.commit()
            except Exception as e:
                logger.error(f"Error clearing SQLite cache: {e}")


# Singleton instance
default_cache = MarketCache()
