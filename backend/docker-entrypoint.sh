#!/bin/bash
set -e

# Run database migrations
python manage.py migrate --noinput

# Warm up the database connection and verify migrations applied
python -c "
import os, sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django; django.setup()
from django.db import connection
with connection.cursor() as c:
    c.execute('SELECT 1 AS ok')
    print(f'DB keepalive: {c.fetchone()[0]}')
" 2>&1

# Start gunicorn
exec gunicorn core.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --threads 2 \
    --timeout 120 \
    --keep-alive 300
