# aiwriter01（AI小説執筆支援システム）dsaku-life組み込みガイド

本ドキュメントは、AI小説執筆支援システム（aiwriter01）を小説コミュニティ dsaku-life に統合するための構築・連携ガイドです。

---

## 1. システム全体構成

- **フロントエンド**: Next.js（TypeScript, Tailwind CSS, Shadcn UI）
- **バックエンド**: Django + Django REST Framework
- **DB**: PostgreSQL
- **非同期処理**: Celery + Redis
- **API連携**: Dify API
- **インフラ**: Docker, Docker Compose

---

## 2. ディレクトリ構成

```
<project-root>/
├── ai_novel/
│   ├── frontend/   # AI小説支援フロントエンド
│   └── backend/    # AI小説支援バックエンド
├── backend/        # dsaku-lifeバックエンド
├── frontend/       # dsaku-lifeフロントエンド
├── docker-compose.yml
└── ...
```

### ai_novel/frontend（Next.js）
- `src/app/` ... ルーティング・ページ定義
- `src/components/` ... UIコンポーネント
- `src/lib/` ... API通信・ユーティリティ
- `src/types/` ... 型定義
- `public/` ... 静的ファイル
- `package.json` ... 依存パッケージ・スクリプト
- `Dockerfile` ... フロントエンド用Dockerビルド

### ai_novel/backend（Django）
- `novel_gen/` ... AI小説支援の主要アプリ
  - `models.py` ... 小説・キャラ・エピソード等のデータモデル
  - `views.py` ... REST API実装
  - `serializers.py` ... シリアライザ
  - `urls.py` ... ルーティング
- `ai_novel/` ... Djangoプロジェクト設定
- `config/` ... 環境設定・Celery設定
- `requirements.txt` ... Python依存
- `Dockerfile` ... バックエンド用Dockerビルド

---

## 3. Docker Composeによる起動・連携

`docker-compose.yml` でdsaku-life本体とaiwriter01を**独立したサービス**として管理します。

- `ai_novel_db`/`ai_novel_redis` ... aiwriter01専用DB/Redis
- `ai_novel_backend` ... aiwriter01バックエンド（ポート8001）
- `ai_novel_frontend` ... aiwriter01フロントエンド（ポート3001）
- `backend`/`frontend` ... dsaku-life本体

### 起動手順

1. 環境変数ファイル（.env）を各backendディレクトリに配置
2. `docker-compose up -d` で全サービス起動
3. マイグレーション（例: `docker-compose exec ai_novel_backend python manage.py migrate`）
4. 各サービスへアクセス
   - aiwriter01フロント: http://localhost:3001
   - aiwriter01バックエンド: http://localhost:8001
   - dsaku-lifeフロント: http://localhost:3000
   - dsaku-lifeバックエンド: http://localhost:8000

---

## 4. フロントエンド構成詳細（ai_novel/frontend）

- `src/app/` ... Next.js App Router構成。`stories/`配下に小説管理・執筆ページ群。
- `src/lib/api.ts` ... バックエンドAPIとの通信ラッパー。
- `src/types/` ... APIレスポンス型やドメイン型定義。
- `tailwind.config.js` ... Tailwind CSS設定。
- `Dockerfile` ... Node18-alpineベース、`npm run dev`で起動。

#### 主要ページ例
- `/stories` ... 小説一覧
- `/stories/[id]` ... 小説詳細
- `/stories/[id]/basic-setting` ... 基本設定表示・生成

---

## 5. バックエンド構成詳細（ai_novel/backend）

- `novel_gen/models.py` ... 小説（AIStory）、基本設定（BasicSetting）、キャラクター、エピソード等のモデル群。
- `novel_gen/views.py` ... 各種ViewSet/APIViewでREST APIを提供。
- `novel_gen/urls.py` ... `/api/novel-gen/`配下でAPIルーティング。
- `config/settings.py` ... Django/Celery/DB/Redis設定。
- `requirements.txt` ... Django, DRF, Celery, Redis, psycopg2等。
- `Dockerfile` ... python:3.10-slimベース。

#### 主要API例
- `/api/novel-gen/stories/` ... 小説CRUD
- `/api/novel-gen/stories/{id}/basic-setting/` ... 基本設定生成・取得
- `/api/novel-gen/stories/{id}/characters/` ... キャラクター管理
- `/api/novel-gen/stories/{id}/acts/` ... 幕・エピソード管理

---

## 6. API連携・統合ポイント

- **フロントエンド**（ai_novel/frontend）は `NEXT_PUBLIC_API_URL` でバックエンドURLを指定
- **バックエンド**（ai_novel/backend）は `/api/novel-gen/`配下でREST APIを提供
- dsaku-life本体からAI小説支援機能を呼び出す場合、`ai_novel_backend`のAPIをHTTP経由で利用
- 認証は不要（本システムは認証前提で開発）

---

## 7. 環境変数例

- `ai_novel/backend/.env`:
  - `DJANGO_SECRET_KEY=...`
  - `POSTGRES_DB=...`
  - `POSTGRES_USER=...`
  - `POSTGRES_PASSWORD=...`
  - `REDIS_URL=redis://ai_novel_redis:6379/0`
  - `DIFY_API_KEY=...`（Dify API連携用）
- `ai_novel/frontend/.env`:
  - `NEXT_PUBLIC_API_URL=http://localhost:8001`

---

## 8. 注意点・ベストプラクティス

- **ポート重複**に注意（aiwriter01は8001/3001、dsaku-lifeは8000/3000）
- DB/Redisは各システムで分離
- Docker Composeでネットワーク分離（`ai_novel_network`/`community_network`）
- 本番統合時はAPI Gatewayや認証連携を検討

---

## 9. 参考
- [ai_novel/README.md](../README.md)
- [docs/frontend_backend_api_communication.md](frontend_backend_api_communication.md)
- [docs/api_documentation_index.md](api_documentation_index.md)
