#!/bin/sh

if [ "$DATABASE" = "postgres" ]
then
    echo "Waiting for postgres..."

    while ! python -c "import sys, psycopg2; sys.exit(0 if psycopg2.connect(dbname='$POSTGRES_DB', user='$POSTGRES_USER', password='$POSTGRES_PASSWORD', host='$POSTGRES_HOST', port='$POSTGRES_PORT') else 1);" 2>/dev/null; do
      echo "PostgreSQL is unavailable - sleeping"
      sleep 1
    done

    echo "PostgreSQL started"
fi

echo "Running migrations"
python manage.py migrate

echo "Collecting static files"
python manage.py collectstatic --no-input

exec "$@"
