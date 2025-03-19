#!/bin/bash

# スクリプトの説明
echo "Next.js開発サーバー再起動スクリプト"
echo "既存のNext.jsプロセスを終了してから新しいプロセスを起動します"
echo "----------------------------------------"

# 現在のディレクトリを表示
echo "現在のディレクトリ: $(pwd)"

# Next.jsのプロセスを検索して終了
echo "既存のNext.jsプロセスを検索しています..."
NEXT_PIDS=$(ps aux | grep "node" | grep "next" | grep -v grep | awk '{print $2}')

if [ -n "$NEXT_PIDS" ]; then
  echo "次のNext.jsプロセスを終了します: $NEXT_PIDS"
  echo $NEXT_PIDS | xargs kill -9
  echo "プロセスを終了しました"
else
  echo "実行中のNext.jsプロセスは見つかりませんでした"
fi

# 3000ポートを使用しているプロセスを検索して終了
echo "ポート3000を使用しているプロセスを検索しています..."
PORT_3000_PID=$(lsof -i :3000 -t)

if [ -n "$PORT_3000_PID" ]; then
  echo "ポート3000を使用しているプロセスを終了します: $PORT_3000_PID"
  echo $PORT_3000_PID | xargs kill -9
  echo "プロセスを終了しました"
else
  echo "ポート3000を使用しているプロセスは見つかりませんでした"
fi

# 3001ポートを使用しているプロセスを検索して終了
echo "ポート3001を使用しているプロセスを検索しています..."
PORT_3001_PID=$(lsof -i :3001 -t)

if [ -n "$PORT_3001_PID" ]; then
  echo "ポート3001を使用しているプロセスを終了します: $PORT_3001_PID"
  echo $PORT_3001_PID | xargs kill -9
  echo "プロセスを終了しました"
else
  echo "ポート3001を使用しているプロセスは見つかりませんでした"
fi

# 3002ポートを使用しているプロセスを検索して終了
echo "ポート3002を使用しているプロセスを検索しています..."
PORT_3002_PID=$(lsof -i :3002 -t)

if [ -n "$PORT_3002_PID" ]; then
  echo "ポート3002を使用しているプロセスを終了します: $PORT_3002_PID"
  echo $PORT_3002_PID | xargs kill -9
  echo "プロセスを終了しました"
else
  echo "ポート3002を使用しているプロセスは見つかりませんでした"
fi

# 少し待機
echo "プロセスの終了を待機しています..."
sleep 2

# Next.js開発サーバーを起動
echo "Next.js開発サーバーを起動します..."
npm run dev
