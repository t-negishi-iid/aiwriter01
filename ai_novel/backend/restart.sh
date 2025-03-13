#!/bin/bash

# バックエンドサーバーを再起動するスクリプト

# 現在のディレクトリを表示
echo "現在のディレクトリ: $(pwd)"

# ログディレクトリの作成
mkdir -p logs

# Dockerコンテナの状態を確認
echo "Dockerコンテナの状態を確認中..."
docker-compose ps

# バックエンドコンテナを再起動
echo "バックエンドコンテナを再起動中..."
docker-compose restart backend

# 再起動後の状態を確認
echo "再起動後のコンテナの状態:"
docker-compose ps

# ログの表示
echo "バックエンドのログを表示中..."
docker-compose logs --tail=50 backend

echo "バックエンドサーバーの再起動が完了しました。"
