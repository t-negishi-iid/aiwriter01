#!/bin/bash

echo "バックエンドサーバーの再起動を開始します。"

docker-compose restart ai_novel_backend

echo "バックエンドサーバーの再起動が完了しました。"
