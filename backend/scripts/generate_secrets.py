#!/usr/bin/env python
"""Generate cryptographically secure secrets for Django and JWT.

Usage:
    python scripts/generate_secrets.py            # print new secrets
    python scripts/generate_secrets.py --write    # write into backend/.env

The Django ``SECRET_KEY`` uses ``get_random_string`` (the same source Django's
``startproject`` uses). The JWT secret uses ``secrets.token_urlsafe`` which is
CSPRNG-backed and URL-safe.
"""
from __future__ import annotations

import argparse
import secrets
from pathlib import Path

from django.core.management.utils import get_random_string

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"


def generate_django_secret_key() -> str:
    return get_random_string(
        50,
        "abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(-_=+)",
    )


def generate_jwt_secret_key() -> str:
    return secrets.token_urlsafe(64)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Django + JWT secrets")
    parser.add_argument(
        "--write",
        action="store_true",
        help="Write the generated secrets into backend/.env (updating existing keys)",
    )
    args = parser.parse_args()

    django_key = generate_django_secret_key()
    jwt_key = generate_jwt_secret_key()

    if not args.write:
        print(f"DJANGO_SECRET_KEY={django_key}")
        print(f"JWT_SECRET_KEY={jwt_key}")
        return

    if not ENV_PATH.exists():
        ENV_PATH.write_text(
            f"DJANGO_SECRET_KEY={django_key}\nJWT_SECRET_KEY={jwt_key}\n"
        )
        print(f"Wrote new secrets to {ENV_PATH}")
        return

    lines = ENV_PATH.read_text().splitlines()
    updated = {"DJANGO_SECRET_KEY": django_key, "JWT_SECRET_KEY": jwt_key}
    seen = set()
    out = []
    for line in lines:
        key = line.split("=", 1)[0].strip()
        if key in updated and key not in seen:
            out.append(f"{key}={updated[key]}")
            seen.add(key)
        else:
            out.append(line)
    for key, value in updated.items():
        if key not in seen:
            out.append(f"{key}={value}")
    ENV_PATH.write_text("\n".join(out) + "\n")
    print(f"Updated secrets in {ENV_PATH}")


if __name__ == "__main__":
    main()
