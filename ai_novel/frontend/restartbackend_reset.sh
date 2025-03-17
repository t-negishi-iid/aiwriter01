#!/bin/bash

echo "バックエンドサーバーの再起動を開始します。"

echo "バックエンドコンテナを停止します。"
docker-compose down

echo "バックエンドコンテナをビルドします。"
docker-compose build ai_novel_backend

echo "バックエンドコンテナを起動します。"
docker-compose up -d ai_novel_backend ai_novel_db ai_novel_redis

echo "バックエンドサーバーの再起動が完了しました。"
