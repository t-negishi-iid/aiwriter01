FROM python:3.10-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# システムの依存関係をインストール
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
        gcc \
        python3-dev \
        musl-dev \
        libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# pipをアップグレード
RUN pip install --upgrade pip

# 必要なPythonパッケージをインストール
COPY requirements.txt .
RUN pip install -r requirements.txt

# プロジェクトファイルをコピー
COPY . .

# サーバー起動スクリプトを作成
RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
