# AI小説執筆支援システム 画面構成案とシステム構成案

## 画面構成案

### 1. ホーム画面
- ログイン/サインアップ機能
- 作成中の小説一覧（サムネイル、タイトル、最終更新日時、進捗状況を表示）
- 新規小説作成ボタン
- ヘルプ・ガイド（執筆フローの説明）
- 最近編集した小説の続きから作業ボタン

### 2. 新規小説作成フロー
#### 2.1 基本設定作成用データ入力画面
- フォーム形式で以下の項目を選択
  - 主題（ドロップダウン）
    - 「自己成長・成長物語」「恋愛成就」「復讐譚」「英雄の旅」など
  - 時代と場所（ドロップダウン）
    - 「現代日本・都市部」「中世ヨーロッパ風ファンタジー世界」など
  - 作品世界と舞台設定（ドロップダウン）
    - 「現代学園設定」「異世界ファンタジー」「SF宇宙開拓」など
  - プロットパターン（ドロップダウン）
    - 「英雄の旅」「恋愛成就」「復讐譚」「自己発見」「悲劇的転落」「救済物語」など
  - 愛情表現（チェックボックス・複数選択可）
    - 「初恋」「片思い」「禁断の恋」「再会」など
  - 感情表現（チェックボックス・複数選択可）
    - 「友情」「憎悪」「嫉妬」「後悔」など
  - 雰囲気演出（チェックボックス・複数選択可）
    - 「ミステリアス」「コミカル」「シリアス」「ホラー」など
  - 官能表現（チェックボックス・複数選択可）
    - 「エロティシズム」「純愛」「プラトニック」など
  - 精神的要素（チェックボックス・複数選択可）
    - 「トラウマ」「罪悪感」「使命感」など
  - 社会的要素（チェックボックス・複数選択可）
    - 「階級対立」「差別」「伝統と革新」など
  - 過去の謎（チェックボックス・複数選択可）
    - 「記憶喪失」「秘密の出自」「封印された力」など
- 生成ボタン
- 生成中のローディング表示（進捗バー付き）
- 選択肢ごとの説明ツールチップ

#### 2.2 基本設定確認・編集画面
- 生成された基本設定の表示（以下のセクション構成）
  - 仮題
  - サマリー（200字程度）
  - テーマ（主題）と説明
  - 時代と場所
  - 作品世界と舞台設定（基本的な世界観、特徴的な要素）
  - 情緒的・感覚的要素（愛情表現、感情表現、雰囲気演出、官能的表現など）
  - 主な登場人物（名前、役割、説明）
  - 主な固有名詞（名前、役割、説明）
  - あらすじ（3幕構成：各幕のタイトルとストーリー）
- リッチテキストエディタで編集可能（Markdown対応）
- セクションごとの編集ボタン
- 保存ボタン（自動保存機能付き）
- 次のステップへ進むボタン
- 前のステップに戻るボタン

#### 2.3 キャラクター詳細設定画面
- 登場人物一覧（サイドバー表示）
- 各キャラクターの詳細設定を表示・編集（以下のセクション構成）
  - 名前
  - 性別と年齢
  - 役割
  - 説明
  - 強烈な個性や特徴
  - キャラクターパターン名
  - 表面的な性格、気質
  - 内に秘めた生きる目的、目標
  - 思想/信条/プライドにかけて譲れないもの
  - 趣味や嗜好
  - 日常生活での習慣や癖
  - 思い出の品や大切にしているもの
  - 過去の重要な経験
  - 特技や専門知識、特殊技能
  - 長所、強み
  - 嫌いなモノ、苦手なモノ
- キャラクター詳細の生成ボタン（キャラクターごと）
- 全キャラクター一括生成ボタン
- リッチテキストエディタで編集可能
- 保存ボタン（自動保存機能付き）
- 次のステップへ進むボタン
- 前のステップに戻るボタン

#### 2.4 あらすじ詳細作成画面
- 3幕構成のあらすじ詳細を表示（タブ切り替え）
  - 第1幕（幕タイトル、ストーリー）
  - 第2幕（幕タイトル、ストーリー）
  - 第3幕（幕タイトル、ストーリー）
- リッチテキストエディタで編集可能
- 各幕ごとの生成ボタン
- 全幕一括生成ボタン
- 保存ボタン（自動保存機能付き）
- 次のステップへ進むボタン
- 前のステップに戻るボタン
- 文字数カウンター（各幕の推奨文字数ガイド付き）

#### 2.5 幕内エピソード詳細作成画面
- 幕の選択（第1幕、第2幕、第3幕）のタブ
- エピソード数の入力（スライダーまたは数値入力）
- エピソード詳細の生成ボタン
- 生成されたエピソード詳細の表示・編集
  - エピソードごとのカード表示
  - エピソードタイトル（自動生成・編集可能）
  - エピソード内容（編集可能）
- エピソードの並べ替え機能（ドラッグ＆ドロップ）
- エピソードの追加・削除ボタン
- 保存ボタン（自動保存機能付き）
- 次のステップへ進むボタン
- 前のステップに戻るボタン

#### 2.6 エピソード執筆画面
- エピソード一覧（サイドバー表示、幕ごとにグループ化）
- 執筆するエピソードの選択
- 文字数の指定（スライダーまたは数値入力、1000〜10000字程度）
- 本文生成ボタン
- 生成された本文の表示・編集（リッチテキストエディタ）
  - 段落分け
  - 会話文のフォーマット
  - 文体の統一
- 保存ボタン（自動保存機能付き）
- 次のエピソードへボタン
- 前のエピソードへボタン
- 文字数カウンター（指定文字数との差分表示）
- 執筆ガイドライン参照ボタン（「物語執筆のルール」を表示）

#### 2.7 タイトル作成画面
- タイトル生成対象の選択（エピソード、幕、小説全体）
- 生成ボタン
- 生成されたタイトル候補の表示（複数候補をカード形式で表示）
- タイトル選択・編集機能
- 保存ボタン（自動保存機能付き）
- 完了ボタン（小説管理画面へ）

### 3. 小説管理画面
- 作成した小説の一覧（グリッド表示）
  - サムネイル画像（自動生成）
  - タイトル
  - 作成日・更新日
  - 進捗状況（ステータスバー）
  - 文字数
- 各小説の操作メニュー
  - 編集（各ステップに直接ジャンプ可能）
  - プレビュー
  - エクスポート（PDF、テキスト、HTML形式）
  - 削除
- フィルタリング機能（完成済み、作成中、下書きなど）
- 検索機能（タイトル、内容、キーワードで検索）

### 4. プレビュー画面
- 小説のプレビュー表示（本の形式で表示）
  - 表紙（タイトル、サブタイトル）
  - 目次
  - 本文（幕・エピソードごとに区切り）
- 印刷機能（印刷用PDFの生成）
- シェア機能（リンク生成、SNSシェア）
- 編集に戻るボタン
- 表示オプション（フォントサイズ、行間、背景色など）

## システム構成案

### フロントエンド（Next.js）
- **ページ構成**
  - ホーム（`/`）
  - 新規小説作成（`/ai_stories/new`）
  - 基本設定作成用データ入力（`/ai_stories/[id]/basic-setting-data`）
  - 基本設定（`/ai_stories/[id]/basic-settings`）
  - キャラクター詳細（`/ai_stories/[id]/characters`）
  - あらすじ詳細（`/ai_stories/[id]/plot`）
  - エピソード詳細（`/ai_stories/[id]/story_parts`）
  - エピソード執筆（`/ai_stories/[id]/story_parts/[partId]/write`）
  - タイトル作成（`/ai_stories/[id]/title`）
  - 小説管理（`/ai_stories`）
  - プレビュー（`/ai_stories/[id]/preview`）

- **コンポーネント**
  - ヘッダー/フッター
  - サイドナビゲーション（執筆ステップ表示）
  - フォーム要素
    - ドロップダウン選択
    - チェックボックスグループ
    - スライダー
    - 数値入力
  - リッチテキストエディタ（Markdown対応）
  - ローディングインジケータ（進捗表示付き）
  - モーダルダイアログ
  - タブパネル
  - カードコンポーネント
  - ドラッグ＆ドロップ並べ替え
  - プレビューコンポーネント
  - ツールチップ
  - トースト通知

- **状態管理**
  - React Context API または Redux
  - フォーム状態管理（React Hook Form）
  - API通信状態（React Query）

- **スタイリング**
  - Tailwind CSS
  - レスポンシブデザイン（モバイル対応）
  - ダークモード対応

### バックエンド（Django + DRF）
- **モデル**
  - User（ユーザー情報）
    - username
    - email
    - password
    - created_at
    - last_login

  - AIStory（小説の基本情報）
    - user (ForeignKey to User)
    - title
    - status (enum: draft, in_progress, completed)
    - created_at
    - updated_at
    - word_count
    - current_step (執筆の現在ステップ)

  - BasicSettingData（基本設定作成用データ）
    - ai_story (ForeignKey to AIStory)
    - theme
    - time_and_place
    - world_setting
    - plot_pattern
    - love_expressions (ArrayField)
    - emotional_expressions (ArrayField)
    - atmosphere (ArrayField)
    - sensual_expressions (ArrayField)
    - mental_elements (ArrayField)
    - social_elements (ArrayField)
    - past_mysteries (ArrayField)
    - created_at
    - updated_at
    - raw_content (JSONField)

  - BasicSetting（基本設定）
    - ai_story (ForeignKey to AIStory)
    - provisional_title
    - summary
    - theme
    - theme_description
    - time_and_place
    - world_setting
    - world_view
    - distinctive_elements
    - emotional_elements (JSONField)
    - created_at
    - updated_at
    - raw_content (JSONField)

  - Character（キャラクター詳細）
    - ai_story (ForeignKey to AIStory)
    - name
    - gender
    - age
    - role
    - description
    - distinctive_traits
    - character_pattern
    - personality
    - goals
    - beliefs
    - hobbies
    - habits
    - treasured_items
    - past_experiences
    - skills
    - strengths
    - dislikes
    - created_at
    - updated_at
    - raw_content (JSONField)

  - Plot（あらすじ詳細）
    - ai_story (ForeignKey to AIStory)
    - act_number (1, 2, 3)
    - act_title
    - story_content
    - created_at
    - updated_at
    - raw_content (JSONField)

  - StoryPart（エピソード詳細）
    - ai_story (ForeignKey to AIStory)
    - plot (ForeignKey to Plot)
    - order (順序)
    - title
    - description
    - created_at
    - updated_at
    - raw_content (JSONField)

  - StoryPartContent（エピソード本文）
    - story_part (ForeignKey to StoryPart)
    - content
    - word_count
    - created_at
    - updated_at
    - raw_content (JSONField)

  - Title（タイトル情報）
    - ai_story (ForeignKey to AIStory)
    - target_type (enum: episode, act, full_story)
    - target_id (関連するエピソードやアクトのID)
    - title
    - alternatives (JSONField, 代替タイトル候補)
    - created_at
    - updated_at

- **API エンドポイント**
  - `/api/auth/` - 認証関連
    - `/api/auth/login/` - ログイン
    - `/api/auth/logout/` - ログアウト
    - `/api/auth/register/` - 新規登録
    - `/api/auth/password/reset/` - パスワードリセット

  - `/api/ai_stories/` - 小説CRUD
    - GET - 小説一覧取得
    - POST - 新規小説作成
    - `/api/ai_stories/<id>/` - 個別小説操作
      - GET - 小説詳細取得
      - PUT - 小説更新
      - DELETE - 小説削除

  - `/api/ai_stories/<id>/basic-setting-data/` - 基本設定作成用データ
    - GET - データ取得
    - POST - データ作成
    - PUT - データ更新
    - `/api/ai_stories/<id>/basic-setting-data/generate/` - Dify APIで生成

  - `/api/ai_stories/<id>/basic-setting/` - 基本設定
    - GET - 設定取得
    - POST - 設定作成
    - PUT - 設定更新
    - `/api/ai_stories/<id>/basic-setting/generate/` - Dify APIで生成

  - `/api/ai_stories/<id>/characters/` - キャラクター詳細
    - GET - 全キャラクター取得
    - POST - キャラクター追加
    - `/api/ai_stories/<id>/characters/<char_id>/` - 個別キャラクター操作
      - GET - キャラクター詳細取得
      - PUT - キャラクター更新
      - DELETE - キャラクター削除
    - `/api/ai_stories/<id>/characters/<char_id>/generate/` - Dify APIで生成

  - `/api/ai_stories/<id>/plot/` - あらすじ詳細
    - GET - 全幕取得
    - `/api/ai_stories/<id>/plot/<act_number>/` - 個別幕操作
      - GET - 幕詳細取得
      - PUT - 幕更新
    - `/api/ai_stories/<id>/plot/generate/` - Dify APIで生成

  - `/api/ai_stories/<id>/story_parts/` - エピソード詳細
    - GET - 全エピソード取得
    - POST - エピソード追加
    - `/api/ai_stories/<id>/story_parts/<part_id>/` - 個別エピソード操作
      - GET - エピソード詳細取得
      - PUT - エピソード更新
      - DELETE - エピソード削除
    - `/api/ai_stories/<id>/story_parts/generate/` - Dify APIで生成

  - `/api/ai_stories/<id>/story_parts/<part_id>/content/` - エピソード本文
    - GET - 本文取得
    - POST - 本文作成
    - PUT - 本文更新
    - `/api/ai_stories/<id>/story_parts/<part_id>/content/generate/` - Dify APIで生成

  - `/api/ai_stories/<id>/title/` - タイトル生成
    - GET - タイトル取得
    - POST - タイトル作成
    - PUT - タイトル更新
    - `/api/ai_stories/<id>/title/generate/` - Dify APIで生成

  - `/api/ai_stories/<id>/export/` - エクスポート
    - `/api/ai_stories/<id>/export/pdf/` - PDF形式
    - `/api/ai_stories/<id>/export/text/` - テキスト形式
    - `/api/ai_stories/<id>/export/html/` - HTML形式

- **サービス層**
  - DifyAPIクライアント
    - 各Dify APIへのリクエスト処理
    - APIキー管理
    - レスポンス変換
  - キャッシュ管理（Redis）
    - API応答のキャッシュ
    - 一時データの保存
  - データ変換処理
    - Markdown ⇔ HTML変換
    - JSONデータ処理

### データベース（PostgreSQL）
- **テーブル構成**
  - users - ユーザー情報
  - ai_stories - 小説基本情報
  - basic_setting_data - 基本設定作成用データ
  - basic_settings - 基本設定
  - characters - キャラクター詳細
  - plots - あらすじ詳細
  - story_parts - エピソード詳細
  - story_part_contents - エピソード本文
  - titles - タイトル情報

### 認証（Django Allauth + JWT）
- ユーザー登録・ログイン
  - メールアドレス認証
  - ソーシャルログイン（オプション）
- JWTによるAPI認証
  - トークン発行
  - トークン更新
  - トークン検証

### キャッシュ（Redis）
- Dify API レスポンスのキャッシュ
  - TTL設定（有効期限）
  - キー設計（ユーザーID + リクエスト種別）
- セッション管理
  - ユーザーセッション
  - CSRF保護
- 一時データの保存
  - 下書き自動保存
  - 生成中データの一時保存

## データフロー

1. ユーザーがフロントエンドでフォーム入力
   - 入力データのバリデーション
   - 一時保存（自動保存）

2. Next.jsがバックエンドAPIにリクエスト
   - JWT認証
   - CSRFトークン検証

3. DjangoがDify APIにリクエスト
   - APIキー認証
   - リクエストデータの整形
   - キャッシュチェック（既存データ再利用）

4. Dify APIからのレスポンスをDjangoで処理
   - レスポンスのパース
   - データ変換・整形
   - キャッシュ保存

5. 処理結果をデータベースに保存
   - トランザクション管理
   - 関連データの整合性確保

6. フロントエンドに結果を返却
   - データのシリアライズ
   - 必要に応じた圧縮

7. ユーザーに表示
   - データのレンダリング
   - インタラクティブ編集機能の提供

## セキュリティ考慮事項

- Dify APIキーはバックエンド側で管理し、フロントエンドには公開しない
  - 環境変数での管理
  - シークレット管理サービスの利用（オプション）

- JWTによるAPI認証
  - トークン有効期限の適切な設定
  - リフレッシュトークンの実装

- CSRFトークンによる保護
  - フォーム送信時の検証
  - Cookieベースの保護

- 入力データのバリデーション
  - サーバーサイドでの厳格な検証
  - SQLインジェクション対策
  - XSS対策

- レート制限の実装
  - ユーザーごとのリクエスト制限
  - IP単位の制限（オプション）

## 拡張性

- 将来的に他のAI APIへの対応も可能な設計
  - 抽象化されたAPIクライアントインターフェース
  - プラグイン形式の拡張機能

- 小説のバージョン管理機能の追加
  - 変更履歴の保存
  - バージョン間の差分表示
  - ロールバック機能

- コミュニティ機能（レビュー、共有など）の追加
  - コメント機能
  - 評価システム
  - 公開/非公開設定

- 多言語対応
  - UI多言語化
  - 小説の翻訳機能
  - 言語ごとのテンプレート

- テンプレート管理機能
  - ユーザー定義テンプレート
  - テンプレートのインポート/エクスポート
  - テンプレートマーケットプレイス

このシステム構成は、基本仕様に記載された7つのステップをサポートし、ユーザーが効率的に小説を執筆できるように設計されています。Next.jsとDjangoの組み合わせにより、フロントエンドの高いユーザー体験とバックエンドの堅牢性を両立させています。また、実際のデータファイル構造を反映したデータモデルとAPIエンドポイントにより、Dify APIとの連携を効率的に行うことができます。

## Dify API連携基盤

### 1. Dify API共通基盤

#### 1.1 APIクライアント構成
- **基本構成**
  - APIキー管理
    - 環境変数での安全な保管
    - アプリケーションごとのAPIキー分離
  - ベースURL設定
    - 環境ごとの切り替え（開発/本番）
  - リクエストヘッダー共通設定
    - Content-Type: application/json
    - Authorization: Bearer {API_KEY}

- **リクエスト処理**
  - リトライ機能
    - 指数バックオフによる再試行（最大3回）
    - 一時的なエラー（5xx）のみ再試行
  - タイムアウト設定
    - 接続タイムアウト: 5秒
    - 読み取りタイムアウト: 60秒（ストリーミングの場合は300秒）

- **レスポンス処理**
  - エラーハンドリング
    - HTTPステータスコードに基づく例外処理
    - エラーメッセージの標準化
  - レスポンス変換
    - JSON → アプリケーションモデルへの変換
    - 日時フォーマットの標準化

#### 1.2 ユーザー識別と会話管理
- **ユーザー識別（user_id）**
  - 形式: 英数字とハイフンのみ（メールアドレス形式は避ける）
  - 長さ: 最大64文字
  - 生成方法:
    - ログインユーザーの場合: `user_{ユーザーID}`
    - 匿名ユーザーの場合: `anon_{ランダムUUID}`
  - 保存場所:
    - ログインユーザー: データベースのユーザーテーブルに関連付け
    - 匿名ユーザー: セッションまたはローカルストレージに保存

- **会話管理（conversation_id）**
  - 新規会話の開始:
    - 初回リクエスト時は`conversation_id`を空で送信
    - レスポンスから返却された`conversation_id`を保存
  - 会話の継続:
    - 保存した`conversation_id`を後続リクエストに含める
    - 同一ユーザーの複数会話を区別するためにフロントエンドで管理
  - 会話の終了:
    - 明示的な終了APIはなく、単に新しい会話を開始する
  - 会話データの保持期間:
    - サーバー側: 30日間（設定可能）
    - クライアント側: ブラウザセッションまたはローカルストレージ

- **同時リクエスト管理**
  - リクエスト識別子の生成
    - 形式: `{user_id}_{timestamp}_{random_string}`
  - 同時リクエストの制限
    - ユーザーごとの同時リクエスト数: 最大5件
    - 429エラー（Too Many Requests）時の処理

#### 1.3 エラーハンドリングと監視
- **エラー種別**
  - クライアントエラー（4xx）
    - 400: リクエスト不正
    - 401: 認証エラー
    - 403: 権限エラー
    - 404: リソース未発見
    - 429: リクエスト過多
  - サーバーエラー（5xx）
    - 500: 内部サーバーエラー
    - 502: ゲートウェイエラー
    - 503: サービス利用不可
    - 504: ゲートウェイタイムアウト

- **エラー応答フォーマット**
  ```json
  {
    "error": {
      "message": "エラーメッセージ",
      "type": "エラータイプ",
      "code": "エラーコード"
    }
  }
  ```

- **監視とロギング**
  - リクエスト/レスポンスのロギング
    - タイムスタンプ
    - ユーザーID
    - 会話ID
    - リクエスト内容（機密情報を除く）
    - レスポンスステータス
    - 処理時間
  - パフォーマンス監視
    - レスポンスタイム
    - エラー率
    - 同時接続数

### 2. 各機能別API仕様

#### 2.1 基本設定作成用データ生成API
- **エンドポイント**: `/api/ai_stories/<id>/basic-setting-data/generate/`
- **メソッド**: POST
- **リクエスト**:
  ```json
  {
    "inputs": {
      "theme": "自己成長・成長物語",
      "time_and_place": "現代日本・都市部",
      "world_setting": "現代学園設定",
      "plot_pattern": "英雄の旅",
      "love_expressions": ["初恋", "片思い"],
      "emotional_expressions": ["友情", "憎悪"],
      "atmosphere": ["ミステリアス", "シリアス"],
      "sensual_expressions": ["エロティシズム"],
      "mental_elements": ["トラウマ", "罪悪感"],
      "social_elements": ["階級対立"],
      "past_mysteries": ["記憶喪失"]
    },
    "user": "user_12345",
    "response_mode": "streaming"
  }
  ```
- **レスポンス**:
  ```json
  {
    "id": "gen_12345",
    "message_id": "msg_67890",
    "conversation_id": "conv_abcde",
    "created_at": 1705395332,
    "answer": "基本設定の生成結果...",
    "metadata": {
      "usage": {
        "prompt_tokens": 1024,
        "completion_tokens": 512,
        "total_tokens": 1536
      },
      "process_time": 5.2
    }
  }
  ```
- **Dify API連携**:
  - 使用するDify APIエンドポイント: `/v1/chat-messages`
  - 変換処理:
    - フロントエンドの入力をDify APIの`inputs`形式に変換
    - Dify APIからのレスポンスをアプリケーションモデルに変換

#### 2.2 キャラクター詳細生成API
- **エンドポイント**: `/api/ai_stories/<id>/characters/<char_id>/generate/`
- **メソッド**: POST
- **リクエスト**:
  ```json
  {
    "inputs": {
      "character_name": "秋月透",
      "role": "主人公",
      "basic_description": "記憶を失った高校生",
      "character_pattern": "英雄の旅の主人公"
    },
    "user": "user_12345",
    "conversation_id": "conv_abcde",
    "response_mode": "streaming"
  }
  ```
- **レスポンス**:
  ```json
  {
    "id": "gen_12345",
    "message_id": "msg_67890",
    "conversation_id": "conv_abcde",
    "created_at": 1705395332,
    "answer": "キャラクター詳細の生成結果...",
    "metadata": {
      "usage": {
        "prompt_tokens": 1024,
        "completion_tokens": 512,
        "total_tokens": 1536
      },
      "process_time": 5.2
    }
  }
  ```
- **Dify API連携**:
  - 使用するDify APIエンドポイント: `/v1/chat-messages`
  - 会話変数の活用:
    - 基本設定情報を会話変数として保持
    - キャラクター間の関係性を考慮した生成

#### 2.3 あらすじ詳細生成API
- **エンドポイント**: `/api/ai_stories/<id>/plot/generate/`
- **メソッド**: POST
- **リクエスト**:
  ```json
  {
    "inputs": {
      "act_number": 1,
      "previous_acts": []
    },
    "user": "user_12345",
    "conversation_id": "conv_abcde",
    "response_mode": "streaming"
  }
  ```
- **レスポンス**:
  ```json
  {
    "id": "gen_12345",
    "message_id": "msg_67890",
    "conversation_id": "conv_abcde",
    "created_at": 1705395332,
    "answer": "あらすじ詳細の生成結果...",
    "metadata": {
      "usage": {
        "prompt_tokens": 1024,
        "completion_tokens": 512,
        "total_tokens": 1536
      },
      "process_time": 5.2
    }
  }
  ```
- **Dify API連携**:
  - 使用するDify APIエンドポイント: `/v1/chat-messages`
  - 会話変数の活用:
    - 基本設定とキャラクター情報を会話変数として保持
    - 幕ごとの連続性を確保

#### 2.4 エピソード詳細生成API
- **エンドポイント**: `/api/ai_stories/<id>/story_parts/generate/`
- **メソッド**: POST
- **リクエスト**:
  ```json
  {
    "inputs": {
      "act_number": 1,
      "episode_count": 3
    },
    "user": "user_12345",
    "conversation_id": "conv_abcde",
    "response_mode": "streaming"
  }
  ```
- **レスポンス**:
  ```json
  {
    "id": "gen_12345",
    "message_id": "msg_67890",
    "conversation_id": "conv_abcde",
    "created_at": 1705395332,
    "answer": "エピソード詳細の生成結果...",
    "metadata": {
      "usage": {
        "prompt_tokens": 1024,
        "completion_tokens": 512,
        "total_tokens": 1536
      },
      "process_time": 5.2
    }
  }
  ```
- **Dify API連携**:
  - 使用するDify APIエンドポイント: `/v1/chat-messages`
  - 会話変数の活用:
    - あらすじ情報を会話変数として保持
    - エピソード間の連続性を確保

#### 2.5 エピソード本文生成API
- **エンドポイント**: `/api/ai_stories/<id>/story_parts/<part_id>/content/generate/`
- **メソッド**: POST
- **リクエスト**:
  ```json
  {
    "inputs": {
      "word_count": 5000,
      "style": "描写重視"
    },
    "user": "user_12345",
    "conversation_id": "conv_abcde",
    "response_mode": "streaming"
  }
  ```
- **レスポンス**:
  ```json
  {
    "id": "gen_12345",
    "message_id": "msg_67890",
    "conversation_id": "conv_abcde",
    "created_at": 1705395332,
    "answer": "エピソード本文の生成結果...",
    "metadata": {
      "usage": {
        "prompt_tokens": 1024,
        "completion_tokens": 512,
        "total_tokens": 1536
      },
      "process_time": 5.2
    }
  }
  ```
- **Dify API連携**:
  - 使用するDify APIエンドポイント: `/v1/chat-messages`
  - 会話変数の活用:
    - エピソード詳細を会話変数として保持
    - 文体や表現の一貫性を確保

#### 2.6 タイトル生成API
- **エンドポイント**: `/api/ai_stories/<id>/title/generate/`
- **メソッド**: POST
- **リクエスト**:
  ```json
  {
    "inputs": {
      "target_type": "full_story",
      "target_id": null,
      "style": "印象的",
      "alternatives_count": 5
    },
    "user": "user_12345",
    "conversation_id": "conv_abcde",
    "response_mode": "blocking"
  }
  ```
- **レスポンス**:
  ```json
  {
    "id": "gen_12345",
    "message_id": "msg_67890",
    "conversation_id": "conv_abcde",
    "created_at": 1705395332,
    "answer": "タイトル候補の生成結果...",
    "metadata": {
      "usage": {
        "prompt_tokens": 1024,
        "completion_tokens": 512,
        "total_tokens": 1536
      },
      "process_time": 5.2
    }
  }
  ```
- **Dify API連携**:
  - 使用するDify APIエンドポイント: `/v1/chat-messages`
  - 会話変数の活用:
    - 基本設定とあらすじを会話変数として保持
    - タイトルの一貫性と適切性を確保

### 3. Dify API連携実装詳細

#### 3.1 APIクライアント実装
```python
# dify_client.py
import requests
import json
import time
import logging
from typing import Dict, Any, Optional

class DifyClient:
    def __init__(self, api_key: str, base_url: str = "https://api.dify.ai"):
        self.api_key = api_key
        self.base_url = base_url
        self.logger = logging.getLogger("dify_client")

    def _get_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    def chat_message(
        self,
        query: str,
        inputs: Dict[str, Any],
        user_id: str,
        conversation_id: Optional[str] = None,
        response_mode: str = "streaming"
    ) -> Dict[str, Any]:
        """
        Dify APIのchat-messagesエンドポイントを呼び出す

        Args:
            query: ユーザーの質問/入力
            inputs: 変数の入力値
            user_id: ユーザー識別子
            conversation_id: 会話ID（継続会話の場合）
            response_mode: レスポンスモード（"streaming"または"blocking"）

        Returns:
            APIレスポンス
        """
        url = f"{self.base_url}/v1/chat-messages"
        payload = {
            "query": query,
            "inputs": inputs,
            "user": user_id,
            "response_mode": response_mode
        }

        if conversation_id:
            payload["conversation_id"] = conversation_id

        self.logger.info(f"Sending request to Dify API: user={user_id}, conversation_id={conversation_id}")

        max_retries = 3
        retry_count = 0

        while retry_count < max_retries:
            try:
                response = requests.post(
                    url,
                    headers=self._get_headers(),
                    data=json.dumps(payload),
                    timeout=(5, 60 if response_mode == "blocking" else 300)
                )

                response.raise_for_status()
                return response.json()

            except requests.exceptions.HTTPError as e:
                if 500 <= e.response.status_code < 600:
                    retry_count += 1
                    wait_time = 2 ** retry_count  # 指数バックオフ
                    self.logger.warning(f"Retrying in {wait_time} seconds... ({retry_count}/{max_retries})")
                    time.sleep(wait_time)
                else:
                    self.logger.error(f"HTTP Error: {e}")
                    raise
            except Exception as e:
                self.logger.error(f"Error calling Dify API: {e}")
                raise

        raise Exception(f"Failed after {max_retries} retries")
```

#### 3.2 会話管理サービス実装
```python
# conversation_service.py
import uuid
from typing import Dict, Any, Optional
from django.db import models
from .dify_client import DifyClient

class ConversationService:
    def __init__(self, dify_client: DifyClient):
        self.dify_client = dify_client

    def generate_user_id(self, user_db_id: Optional[int] = None) -> str:
        """
        Dify API用のユーザーIDを生成

        Args:
            user_db_id: データベース上のユーザーID（ログインユーザーの場合）

        Returns:
            Dify API用ユーザーID
        """
        if user_db_id:
            return f"user_{user_db_id}"
        else:
            return f"anon_{uuid.uuid4().hex[:16]}"

    def start_new_conversation(
        self,
        query: str,
        inputs: Dict[str, Any],
        user_id: str
    ) -> Dict[str, Any]:
        """
        新しい会話を開始

        Args:
            query: ユーザーの質問/入力
            inputs: 変数の入力値
            user_id: ユーザー識別子

        Returns:
            APIレスポンスと新しい会話ID
        """
        response = self.dify_client.chat_message(
            query=query,
            inputs=inputs,
            user_id=user_id,
            conversation_id=None  # 新規会話
        )

        # レスポンスから会話IDを取得
        conversation_id = response.get("conversation_id")

        # 会話IDをデータベースに保存（オプション）
        # self._save_conversation_id(user_id, conversation_id)

        return response

    def continue_conversation(
        self,
        query: str,
        user_id: str,
        conversation_id: str,
        inputs: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        既存の会話を継続

        Args:
            query: ユーザーの質問/入力
            user_id: ユーザー識別子
            conversation_id: 継続する会話ID
            inputs: 変数の入力値（既存の会話では無視される）

        Returns:
            APIレスポンス
        """
        return self.dify_client.chat_message(
            query=query,
            inputs=inputs or {},
            user_id=user_id,
            conversation_id=conversation_id
        )
```

#### 3.3 フロントエンド実装（Next.js）
```typescript
// difyApi.ts
import axios from 'axios';

interface ChatMessageParams {
  query: string;
  inputs: Record<string, any>;
  userId: string;
  conversationId?: string;
  responseMode?: 'streaming' | 'blocking';
}

interface ChatMessageResponse {
  id: string;
  messageId: string;
  conversationId: string;
  createdAt: number;
  answer: string;
  metadata: {
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    processTime: number;
  };
}

export const sendChatMessage = async ({
  query,
  inputs,
  userId,
  conversationId,
  responseMode = 'streaming'
}: ChatMessageParams): Promise<ChatMessageResponse> => {
  try {
    const response = await axios.post('/api/dify/chat-message', {
      query,
      inputs,
      userId,
      conversationId,
      responseMode
    });

    return response.data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};

// 会話IDの管理
export const getStoredConversationIds = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};

  const stored = localStorage.getItem('conversationIds');
  return stored ? JSON.parse(stored) : {};
};

export const storeConversationId = (key: string, conversationId: string): void => {
  if (typeof window === 'undefined') return;

  const conversationIds = getStoredConversationIds();
  conversationIds[key] = conversationId;
  localStorage.setItem('conversationIds', JSON.stringify(conversationIds));
};
```

### 4. 同時ユーザー対応と負荷分散

#### 4.1 同時ユーザー対応
- **ユーザーセッション分離**
  - 各ユーザーに固有のuser_idを割り当て
  - ユーザーごとに独立した会話コンテキストを維持
  - セッション情報のデータベース保存

- **リクエスト制限とキュー**
  - ユーザーごとのリクエスト制限
  - 優先度付きリクエストキュー
  - 長時間実行タスクの非同期処理

- **スケーラビリティ対応**
  - ステートレスなAPIサーバー設計
  - 水平スケーリング対応
  - コンテナ化とオーケストレーション

#### 4.2 負荷分散と冗長性
- **APIキーのローテーション**
  - 複数のDify APIキーを使用
  - ラウンドロビンまたは負荷ベースの割り当て
  - キーごとの使用状況監視

- **フォールバック機構**
  - プライマリAPIキー障害時の自動切り替え
  - 一時的なエラー時の再試行ロジック
  - 完全障害時のグレースフルデグラデーション

- **キャッシュ戦略**
  - 頻繁に使用される設定のキャッシュ
  - ユーザー固有データの分離キャッシュ
  - キャッシュ無効化ポリシー

### 5. セキュリティと監査

#### 5.1 APIキー保護
- **キー管理**
  - 環境変数またはシークレット管理サービスでの保管
  - 定期的なキーローテーション
  - 最小権限の原則に基づくアクセス制限

- **トラフィック暗号化**
  - すべての通信でTLS 1.2以上を使用
  - 証明書の定期的な更新
  - 安全なサイファースイートの使用

#### 5.2 ユーザーデータ保護
- **データ最小化**
  - 必要最小限の個人情報のみをAPIに送信
  - 機密データのマスキングまたは匿名化
  - 不要データの定期的な削除

- **アクセス制御**
  - ロールベースのアクセス制御
  - 多要素認証
  - セッションタイムアウトと自動ログアウト

#### 5.3 監査とコンプライアンス
- **アクティビティログ**
  - すべてのAPI呼び出しの詳細ログ
  - ユーザーアクション履歴
  - 異常検知と警告

- **使用状況分析**
  - APIキーごとの使用量追跡
  - コスト配分と予算管理
  - パフォーマンス指標の収集

この実装により、複数のユーザーが同時にDify APIを利用する場合でも、各ユーザーのリクエストと応答を適切に管理し、システム全体の安定性とセキュリティを確保することができます。
