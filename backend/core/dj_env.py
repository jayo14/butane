"""Thin, dependency-free wrapper around :mod:`os.environ` for Django settings.

Mirrors the common ``env.str(...)`` / ``env.bool(...)`` / ``env.int(...)`` /
``env.timedelta(...)`` helpers used by ``django-environ`` so settings remain
readable, while keeping the dependency surface minimal.
"""
from __future__ import annotations

import datetime
import os
from pathlib import Path


class _Undefined:
    def __repr__(self) -> str:  # pragma: no cover - debug only
        return "UNDEFINED"


_UNDEFINED = _Undefined()


class Env:
    """Reads variables from the process environment with typed accessors."""

    def __init__(self) -> None:
        self._store: dict[str, str] = dict(os.environ)

    def read_env(self, path: str) -> None:
        """Load a ``.env`` style file into the environment if present."""
        fp = Path(path)
        if not fp.exists():
            return
        for raw_line in fp.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key, value = key.strip(), value.strip()
            value = value.strip("\"'")
            if key and key not in self._store:
                os.environ.setdefault(key, value)
                self._store[key] = value

    def _get(self, key: str, default):
        return self._store.get(key, default)

    def __call__(self, key: str, default=_UNDEFINED):
        value = self._get(key, default)
        if value is _UNDEFINED:
            raise KeyError(f"Environment variable {key!r} is not set and has no default.")
        return value

    def str(self, key: str, default=_UNDEFINED) -> str:
        value = self._get(key, default)
        if value is _UNDEFINED:
            raise KeyError(f"Environment variable {key!r} is not set and has no default.")
        return str(value)

    def bool(self, key: str, default=_UNDEFINED) -> bool:
        value = self._get(key, default)
        if value is _UNDEFINED:
            raise KeyError(f"Environment variable {key!r} is not set and has no default.")
        return str(value).strip().lower() in {"1", "true", "yes", "on"}

    def int(self, key: str, default=_UNDEFINED) -> int:
        value = self._get(key, default)
        if value is _UNDEFINED:
            raise KeyError(f"Environment variable {key!r} is not set and has no default.")
        return int(str(value).strip())

    def list(self, key: str, default=_UNDEFINED):
        value = self._get(key, default)
        if value is _UNDEFINED:
            raise KeyError(f"Environment variable {key!r} is not set and has no default.")
        return [item.strip() for item in str(value).split(",") if item.strip()]

    def timedelta(self, key: str, default=0, unit: str = "seconds") -> datetime.timedelta:
        value = self._get(key, default)
        kwargs = {unit: float(str(value).strip())}
        return datetime.timedelta(**kwargs)
