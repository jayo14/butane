#!/bin/bash
set -e

# Run database migrations
python manage.py migrate --noinput

# Start gunicorn
exec gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 3 --threads 2 --timeout 120
