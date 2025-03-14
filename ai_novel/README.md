# AI小説執筆支援システム

Dify APIを利用したAI小説執筆支援システムのプロトタイプです。ユーザーはクレジットを消費しながら小説を生成できます。

## システム概要

- AI支援による小説執筆システム
- Dify上に構築された執筆支援エージェントをAPI経由で利用
- クレジット制（機能ごとに消費量が異なる）

## 機能

1. **基本設定作成用データの作成**
   - 主題、舞台設定、プロットパターンなどを選択
   - クレジット消費：0

2. **基本設定の自動生成**
   - 作品設定と登場人物の設定、大まかなあらすじを自動生成
   - 3幕構成で各幕の展開も生成
   - クレジット消費：1

3. **キャラクター詳細の作成**
   - 登場人物を1人ずつ詳細化
   - クレジット消費：2（キャラクター1人1回につき）

4. **あらすじ詳細作成**
   - 3幕のそれぞれの構成を詳細化
   - クレジット消費：2

5. **幕タイトル再生成**
   - 各幕のタイトルを再生成
   - クレジット消費：1

6. **エピソード詳細の作成**
   - 各幕を指定した本数のエピソードに分割
   - クレジット消費：3

7. **エピソード本文の執筆**
   - 各エピソードの本文を生成
   - クレジット消費：4

8. **エピソードタイトル再生成**
   - エピソードのタイトルを再生成
   - クレジット消費：1

9. **小説タイトル生成**
   - 全エピソードを元にタイトルを生成
   - クレジット消費：3

## システム構成

### バックエンド

- **フレームワーク**: Django + Django REST Framework
- **データベース**: PostgreSQL
- **メッセージキュー**: Redis + Celery
- **API連携**: Dify API

### フロントエンド

- **フレームワーク**: Next.js
- **UIライブラリ**: Tailwind CSS, Shadcn UI
- **状態管理**: React Context API

### インフラ

- **コンテナ化**: Docker, Docker Compose
- **開発環境**: ローカル開発環境（Docker Compose使用）

## 開発環境セットアップ

### 前提条件

- Docker と Docker Compose がインストールされていること
- APIキーの準備（Dify APIアクセス用）

### 起動手順

1. リポジトリをクローン

   ```bash
   git clone <repository-url>
   cd ai_novel
   ```

2. 環境変数ファイルの作成

   ```bash
   cp .env.example .env
   # .envファイルを編集し、必要な環境変数を設定
   ```

3. Dockerコンテナのビルドと起動

   ```bash
   docker-compose up -d
   ```

4. マイグレーションの実行

   ```bash
   docker-compose exec backend python manage.py migrate
   ```

5. アクセス
   - バックエンドAPI: <http://localhost:8001/api/>
   - フロントエンド: <http://localhost:3000/>
   - 管理画面: <http://localhost:8001/admin/>

## APIエンドポイント

> **開発者向け**: 詳細なAPI実装ガイドラインと設計指針については [API ドキュメンテーションインデックス](docs/api_documentation.md) を参照してください。このインデックスには、API設計パターン、テスト方法、ルーティング最適化などの情報が含まれています。

### 認証関連

- `POST /api/token/` - JWTトークン取得
- `POST /api/token/refresh/` - JWTトークンリフレッシュ

### ユーザー関連

- `GET /api/novel-gen/user/profile/` - ユーザープロファイル取得
- `GET /api/novel-gen/user/credit-history/` - クレジット履歴取得

### 小説関連

- `GET /api/novel-gen/stories/` - 小説一覧取得
- `POST /api/novel-gen/stories/` - 小説作成
- `GET /api/novel-gen/stories/{id}/` - 小説詳細取得
- `PUT /api/novel-gen/stories/{id}/` - 小説更新
- `DELETE /api/novel-gen/stories/{id}/` - 小説削除

### 基本設定関連

- `GET /api/novel-gen/options/` - 選択肢取得
- `POST /api/novel-gen/stories/{story_id}/basic-setting-data/` - 基本設定作成用データ作成
- `GET /api/novel-gen/stories/{story_id}/basic-setting-data/{id}/` - 基本設定作成用データ取得
- `PUT /api/novel-gen/stories/{story_id}/basic-setting-data/{id}/` - 基本設定作成用データ更新
- `DELETE /api/novel-gen/stories/{story_id}/basic-setting-data/{id}/` - 基本設定作成用データ削除
- `POST /api/novel-gen/preview-basic-setting-data/` - 基本設定作成用データプレビュー

- `POST /api/novel-gen/stories/{story_id}/basic-setting/` - 基本設定生成
- `GET /api/novel-gen/stories/{story_id}/basic-setting/{id}/` - 基本設定取得
- `PUT /api/novel-gen/stories/{story_id}/basic-setting/{id}/` - 基本設定更新
- `DELETE /api/novel-gen/stories/{story_id}/basic-setting/{id}/` - 基本設定削除

### キャラクター関連

- `GET /api/novel-gen/stories/{story_id}/characters/` - キャラクター一覧取得
- `POST /api/novel-gen/stories/{story_id}/characters/` - キャラクター作成
- `GET /api/novel-gen/stories/{story_id}/characters/{id}/` - キャラクター詳細取得
- `PUT /api/novel-gen/stories/{story_id}/characters/{id}/` - キャラクター詳細更新
- `DELETE /api/novel-gen/stories/{story_id}/characters/{id}/` - キャラクター詳細削除
- `POST /api/novel-gen/stories/{story_id}/create-character-detail/` - キャラクター詳細生成

### あらすじ関連

- `GET /api/novel-gen/stories/{story_id}/acts/` - 幕一覧取得
- `POST /api/novel-gen/stories/{story_id}/create-plot-detail/` - あらすじ詳細生成

### エピソード関連

- `GET /api/novel-gen/acts/{act_id}/episodes/` - エピソード一覧取得
- `POST /api/novel-gen/stories/{story_id}/create-episode-details/` - エピソード詳細生成
- `GET /api/novel-gen/episodes/{episode_id}/content/` - エピソード本文取得
- `POST /api/novel-gen/stories/{story_id}/create-episode-content/` - エピソード本文生成

### タイトル生成

- `POST /api/novel-gen/stories/{story_id}/generate-title/` - タイトル生成

## ライセンス

このプロジェクトは [MIT ライセンス](LICENSE) の下で公開されています。
