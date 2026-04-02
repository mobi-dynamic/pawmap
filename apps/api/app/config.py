from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache

from .env import load_local_env


load_local_env()


@dataclass(frozen=True)
class Settings:
    database_url: str | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings(database_url=os.getenv("DATABASE_URL") or None)
