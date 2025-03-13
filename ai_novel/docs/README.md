# AI小説執筆支援システム 仕様書

## 概要

AI小説執筆支援システムは、AIを活用して小説の執筆を支援するためのシステムです。ユーザーは基本設定を入力するだけで、AIが小説の基本設定、キャラクター詳細、あらすじ詳細、エピソード詳細を生成し、小説執筆をサポートします。

## 仕様書一覧

本ディレクトリには、AI小説執筆支援システムの各機能に関する仕様書が含まれています。

- [基本設定作成用データ仕様書](./basic_setting_data_specification.md)
- [キャラクター詳細仕様書](./character_detail_specification.md)
- [あらすじ詳細（プロット詳細）仕様書](./plot_detail_specification.md)
- [エピソード詳細仕様書](./episode_detail_specification.md)

## システム構成

AI小説執筆支援システムは、以下のコンポーネントで構成されています。

### フロントエンド

- **技術スタック**: Next.js, React, TypeScript, Tailwind CSS, Shadcn UI
- **主要機能**:
  - ユーザーインターフェース提供
  - フォーム入力と検証
  - APIとの通信
  - 生成されたコンテンツの表示と編集

### バックエンド

- **技術スタック**: Django, Django REST Framework, PostgreSQL, Redis, Celery
- **主要機能**:
  - APIエンドポイント提供
  - データベース管理
  - 外部AI APIとの連携
  - 非同期タスク処理

### 外部サービス

- **Dify API**: 小説生成のためのAI APIを提供
- **Mailhog**: 開発環境でのメール送信テスト用サーバー

## データフロー

AI小説執筆支援システムにおける一般的なデータフローは以下の通りです。

1. ユーザーがフロントエンドでフォームに入力
2. フロントエンドがバックエンドAPIにリクエストを送信
3. バックエンドがリクエストを検証し、必要に応じてDify APIにリクエストを送信
4. Dify APIがAIを使用してコンテンツを生成
5. バックエンドが生成されたコンテンツを受け取り、データベースに保存
6. フロントエンドがバックエンドからデータを取得し、ユーザーに表示

## 小説作成フロー

AI小説執筆支援システムを使用した小説作成の一般的なフローは以下の通りです。

1. **小説の作成**: タイトルと説明を入力して新しい小説を作成
2. **基本設定の作成**: ジャンル、テーマ、舞台設定などの基本情報を入力
3. **キャラクター詳細の作成**: 主要キャラクターの詳細情報を作成
4. **あらすじ詳細の作成**: 3幕構成のあらすじを作成
5. **エピソードの作成**: あらすじをもとに各エピソードを作成
6. **エピソードコンテンツの作成**: 各エピソードの本文を作成
7. **編集と調整**: 生成されたコンテンツを編集・調整

## API構造

AI小説執筆支援システムのAPIは、RESTful設計に基づいており、以下の主要なエンドポイントを提供しています。

- `/api/stories/`: 小説の作成・取得・更新・削除
- `/api/stories/{storyId}/basic-setting-data/`: 基本設定作成用データの作成・取得・更新
- `/api/stories/{storyId}/basic-setting/`: 基本設定の生成・取得・更新
- `/api/stories/{storyId}/character-details/`: キャラクター詳細の作成・取得・更新・削除
- `/api/stories/{storyId}/create-plot-detail/`: あらすじ詳細の生成
- `/api/stories/{storyId}/plot-detail/`: あらすじ詳細の取得・更新
- `/api/stories/{storyId}/create-episode-details/`: エピソードの生成
- `/api/stories/{storyId}/episodes/`: エピソード一覧の取得
- `/api/stories/{storyId}/create-episode-content/`: エピソードコンテンツの生成
- `/api/episodes/{episodeId}/content/`: エピソードコンテンツの取得・更新
- `/api/tasks/{taskId}/`: 非同期タスクのステータス取得

## 開発環境

AI小説執筆支援システムの開発環境は、Docker Composeを使用して構築されています。

```bash
# 開発環境の起動
docker-compose up -d

# フロントエンドの開発サーバー起動
cd ai_novel/frontend
npm run dev

# バックエンドの開発サーバー起動
cd ai_novel/backend
python manage.py runserver
```

## 貢献

AI小説執筆支援システムへの貢献を歓迎します。貢献する際は、以下のガイドラインに従ってください。

1. リポジトリをフォークし、新しいブランチを作成
2. 変更を加え、テストを実行
3. プルリクエストを作成

## ライセンス

AI小説執筆支援システムは、[MITライセンス](../LICENSE)の下で公開されています。
