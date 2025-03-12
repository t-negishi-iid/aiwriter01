#!/bin/sh

if [ "$DATABASE" = "postgres" ]
then
    echo "Waiting for postgres..."

    while ! nc -z $POSTGRES_HOST $POSTGRES_PORT; do
      sleep 0.1
    done

    echo "PostgreSQL started"
fi

# Djangoマイグレーションを実行
python manage.py migrate

# 静的ファイルを収集
python manage.py collectstatic --no-input

exec "$@"
