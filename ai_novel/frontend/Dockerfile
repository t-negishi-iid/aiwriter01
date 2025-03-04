FROM node:18-alpine

WORKDIR /app

# 依存関係のインストール
COPY package.json ./
RUN npm install

# アプリケーションのソースコードをコピー
COPY . .

# 開発環境用の設定
ENV NODE_ENV development

# 開発サーバーの起動
CMD ["npm", "run", "dev"]
