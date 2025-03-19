# フロントエンドとバックエンドの通信方法一覧

## 1. API呼び出し関数

| 関数名 | ファイルパス | 特徴 |
|--------|-------------|------|
| fetchApi | /ai_novel/frontend/src/lib/api-client.ts | ・主要なAPI呼び出し関数<br>・`backendBaseUrl`を使用<br>・末尾に`/`を自動追加<br>・詳細なデバッグログ |
| fetchBackendApi | /ai_novel/frontend/src/lib/backend-api.ts | ・別の実装<br>・`apiUrl`を使用<br>・末尾に`/`を自動追加<br>・詳細なデバッグログ |
| 直接fetch呼び出し | 各コンポーネント内 | ・統一されていない実装<br>・環境変数参照方法が異なる可能性 |

## 2. API呼び出しレイヤー

| レイヤー | ファイルパス | 特徴 |
|----------|-------------|------|
| 直接API呼び出し | 各コンポーネント内 | ・個別に実装<br>・一貫性に欠ける |
| API関数群 | /ai_novel/frontend/src/lib/api-client.ts | ・機能ごとにまとめられたAPI関数<br>・`storyApi`, `characterApi`などの名前空間 |
| ラッパーAPI | /ai_novel/frontend/src/lib/api.ts | ・api-client.tsの関数をラップ<br>・追加のデバッグログを含む |

## 3. 主要なAPIエンドポイント呼び出し

| 機能カテゴリ | エンドポイント例 | 呼び出し方法 |
|--------------|------------------|-------------|
| 小説関連 | `/stories/`, `/stories/{id}/` | `storyApi.getStories`, `storyApi.getStory` |
| 基本設定関連 | `/stories/{id}/basic-setting/` | `basicSettingApi.getBasicSetting` |
| キャラクター関連 | `/stories/{id}/characters/` | `characterApi.getCharacters` |
| プロット関連 | `/stories/{id}/acts/` | `plotApi.getPlot` |
| エピソード関連 | `/stories/{id}/episodes/` | `episodeApi.getEpisodes` |
| タイトル関連 | `/stories/{id}/title/` | `titleApi.getTitle` |
| 統合設定クリエイター | `/stories/{id}/integrated-setting-creator/` | `integratedSettingCreatorApi.getIntegratedSettingData` |

## 4. 問題点

1. **複数の実装方法の混在**:
   - fetchApiとfetchBackendApiに機能的な重複がある
   - 共通の基盤コードがなく、重複実装がある

2. **URL構造の不一致**:
   - 旧バージョンでは`/stories?id={id}`形式
   - 新バージョンでは`/stories/{id}/`形式

3. **レスポンス形式の不一致**:
   - API間でレスポンス形式が異なり、フロントエンド側で変換処理が必要

4. **環境変数参照の不統一**:
   - `backendBaseUrl`, `apiUrl`など、異なる変数名と取得方法

## 5. APIクライアント段階的統一の提案

1. **第1段階**: 基本関数の統一
   - fetchApiに一本化し、fetchBackendApiは廃止
   - 環境変数参照方法の統一

2. **第2段階**: APIクライアント関数の統一
   - エンドポイント形式の統一（`/stories/{id}/`形式に統一）
   - 機能ごとのAPIクライアント関数の整理

3. **第3段階**: レスポンス形式の標準化
   - バックエンド側で標準DRFページネーション形式に統一
   - フロントエンド側での変換処理の削除

## 5. API統一の移行計画

### 5.1 統一方針

1. **新しいfetchAPIの作成**
   - 新しい共通関数`unifiedFetchApi`を作成
   - バックエンドURLパターンに厳密に準拠
   - 適切なエラーハンドリングと一貫性のあるレスポンス処理
   - 詳細なログ機能の実装

2. **段階的な移行アプローチ**
   - 機能ごとに1つずつテストと検証を行いながら移行
   - 既存のAPIクライアントは並行稼働を維持
   - 各移行完了後に動作検証の実施

3. **移行の優先順位**
   - 使用頻度が低いAPIから開始
   - 複雑なロジックを含むAPIは後半で対応
   - コアシステム機能は最後に移行

### 5.2 移行チェック表

#### 新API実装チェック項目

| 実装項目 | 説明 | 状態 |
|---------|------|------|
| 基本関数 | `unifiedFetchApi`の作成 | 未着手 |
| 環境変数 | 環境変数の統一と設定 | 未着手 |
| エラーハンドリング | 標準エラー処理の実装 | 未着手 |
| 認証処理 | 統一された認証処理の実装 | 未着手 |
| ログ機能 | 詳細なログ機能の実装 | 未着手 |

#### API移行状況チェック表

| API名 | エンドポイント | 新API実装 | 単体テスト | 結合テスト | リリース | 備考 |
|-------|--------------|-----------|-----------|-----------|----------|------|
| **小説関連** |
| getStories | /stories/ | 未着手 | 未着手 | 未着手 | 未着手 | |
| getStory | /stories/{id}/ | 未着手 | 未着手 | 未着手 | 未着手 | |
| createStory | /stories/ | 未着手 | 未着手 | 未着手 | 未着手 | |
| updateStory | /stories/{id}/ | 未着手 | 未着手 | 未着手 | 未着手 | |
| deleteStory | /stories/{id}/ | 未着手 | 未着手 | 未着手 | 未着手 | |
| **基本設定関連** |
| getBasicSetting | /stories/{id}/basic-setting/ | 未着手 | 未着手 | 未着手 | 未着手 | |
| createBasicSetting | /stories/{id}/basic-setting/ | 未着手 | 未着手 | 未着手 | 未着手 | |
| updateBasicSetting | /stories/{id}/basic-setting/{pk}/ | 未着手 | 未着手 | 未着手 | 未着手 | |
| getLatestBasicSetting | /stories/{id}/latest-basic-setting/ | 未着手 | 未着手 | 未着手 | 未着手 | |
| updateBasicSettingAct | /stories/{id}/basic-setting-act/{act_number}/ | 未着手 | 未着手 | 未着手 | 未着手 | |
| **キャラクター関連** |
| getCharacters | /stories/{id}/characters/ | 未着手 | 未着手 | 未着手 | 未着手 | |
| getCharacter | /stories/{id}/characters/{pk}/ | 未着手 | 未着手 | 未着手 | 未着手 | |
| createCharacter | /stories/{id}/create-character-detail/ | 未着手 | 未着手 | 未着手 | 未着手 | |
| **プロット関連** |
| getPlots | /stories/{id}/acts/ | 未着手 | 未着手 | 未着手 | 未着手 | |
| getPlot | /stories/{id}/acts/{pk}/ | 未着手 | 未着手 | 未着手 | 未着手 | |
| createPlot | /stories/{id}/create-plot-detail/ | 未着手 | 未着手 | 未着手 | 未着手 | |
| **エピソード関連** |
| getEpisodes | /acts/{act_id}/episodes/ | 未着手 | 未着手 | 未着手 | 未着手 | |
| getEpisode | /acts/{act_id}/episodes/{pk}/ | 未着手 | 未着手 | 未着手 | 未着手 | |
| getStoryEpisodes | /stories/{id}/episodes/ | 未着手 | 未着手 | 未着手 | 未着手 | |
| createEpisodeDetails | /stories/{id}/create-episode-details/ | 未着手 | 未着手 | 未着手 | 未着手 | |
| **エピソード本文関連** |
| getEpisodeContent | /episodes/{episode_id}/content/ | 未着手 | 未着手 | 未着手 | 未着手 | |
| createEpisodeContent | /stories/{id}/create-episode-content/ | 未着手 | 未着手 | 未着手 | 未着手 | |
| **統合設定関連** |
| getIntegratedSetting | /stories/{id}/integrated-setting-creator/ | 未着手 | 未着手 | 未着手 | 未着手 | |
| getIntegratedSettingDetail | /stories/{id}/integrated-setting-creator/detail/ | 未着手 | 未着手 | 未着手 | 未着手 | |
| **ユーザー関連** |
| getUserProfile | /user/profile/ | 未着手 | 未着手 | 未着手 | 未着手 | |
| getCreditHistory | /user/credit-history/ | 未着手 | 未着手 | 未着手 | 未着手 | |

### 5.3 テスト・検証方法

1. **単体テスト**
   - 各API関数の呼び出しテスト
   - 正常系と異常系のパターンをテスト
   - モックデータを使用せず、実際のAPIレスポンスを確認

2. **結合テスト**
   - 実際の画面から新APIを呼び出すテスト
   - ユーザーシナリオに沿った一連の操作テスト
   - フロントエンド全体の挙動を確認

3. **リリース判断基準**
   - 単体テストと結合テストが全て成功
   - 既存機能と同等以上の動作確認
   - エラーケースの適切な処理確認

### 5.4 リスク対策

1. **フォールバック機構**
   - 移行中に問題が発生した場合の切り戻し手順
   - 旧APIを維持し、簡単に切り替えられる構造

2. **段階的デプロイ**
   - 全てのAPIを一度に置き換えない
   - 1つのAPIごとに検証とデプロイを繰り返す

3. **モニタリング強化**
   - エラーログの監視体制強化
   - パフォーマンス指標の計測

## エラーハンドリングとユーザー通知の仕様

### APIエラー処理の基本方針

1. **エラータイプの分類**
   - システムエラー：内部エラー、通信エラーなど技術的な問題
   - ユーザー通知：クレジット不足、設定不足など操作上の問題
   - 認証エラー：ログイン必要、権限不足などの認証に関する問題

2. **エラー処理フロー**
   - バックエンドからのレスポンスを適切なタイプに分類
   - エラータイプに応じた処理を実行（UI表示、リダイレクトなど）
   - ユーザーフレンドリーなメッセージを表示

### 親システムとの認証連携

1. **認証環境の前提条件**
   - 親システム：Django allauthを拡張して使用
   - ローカルストレージベースのセッション管理
   - ユーザー識別：intタイプのuser_idを使用
   - 当システムは常に認証された状態で使用される

2. **認証エラーの再定義**
   - 通常の認証エラー（401）ではなく「予期せぬセッション切れ」や「権限不足」の例外的状況を対象
   - 親システムのセッション（ローカルストレージのuser_id）が無効になった場合の処理

3. **エラー処理の実装**
   ```typescript
   case ApiErrorType.AUTH:
     // 認証エラー（例外的な状況）
     console.error(`[認証エラー] ${error.message} - セッションが無効または期限切れの可能性があります`);
     
     // 親システムのリフレッシュ機能を呼び出す
     try {
       // 親システムが提供する関数を呼び出す
       window.parentSystem?.refreshAuth?.();
     } catch (refreshError) {
       console.error('認証更新に失敗しました', refreshError);
     }
     
     if (options?.onAuthError) {
       options.onAuthError(error);
     }
     
     // ユーザーに通知（リロードを促す等）
     break;
   ```

4. **親システムとの統合方法**
   - 親システムが提供するグローバル関数/変数を利用してセッション管理と連携
   - リクエストヘッダーに親システムのユーザーIDを常に含める
   - 認証情報の受け渡しインターフェース：
     ```typescript
     interface ParentSystemAuth {
       userId: number;
       refreshAuth?: () => Promise<boolean>;
       redirectToLogin?: () => void;
     }
     
     // グローバル拡張
     declare global {
       interface Window {
         parentSystem?: ParentSystemAuth;
       }
     }
     ```

5. **エラー発生時の対応**
   - 親システムの認証リフレッシュ機能呼び出し
   - リフレッシュ失敗時：親システムログイン画面へリダイレクト
   - ユーザーへの適切な通知（セッション切れのメッセージ表示）

この実装は「例外的な認証エラー」に対処するためのもので、通常の操作では発生しないことを前提としています。シンプルに保ちつつ、万が一のセッション問題に対応できるようにします。

### トースト通知の実装仕様

1. **トースト通知の種類**
   - 情報（青）：一般的な情報通知
   - 成功（緑）：操作成功の通知
   - 警告（黄）：ユーザー通知（クレジット不足など）
   - エラー（赤）：システムエラー

2. **トースト表示の基本機能**
   - メッセージ内容
   - 表示タイプ（情報/成功/警告/エラー）
   - 表示時間（デフォルト：5秒）
   - 自動消去オプション
   - クリックによる手動消去

3. **実装コンポーネント**
   - `toast.tsx`：トースト表示コンポーネント
   - `ToastProvider`：アプリケーション全体でのトースト状態管理
   - `useToast`：トースト表示用のカスタムフック

4. **APIエラーとの連携**
   ```typescript
   // トースト表示関数
   export const showToast = (
     message: string, 
     type: 'info' | 'success' | 'warning' | 'error' = 'info', 
     duration = 5000
   ) => {
     // トースト表示ロジック
   };
   
   // API通知と連携
   handleApiError(error, {
     onUserNotification: (error) => {
       showToast(error.message, 'warning');
     },
     onSystemError: (error) => {
       showToast(error.message, 'error');
     }
   });
   ```

5. **デザイン要件**
   - Shadcn UIのデザインシステムに準拠
   - レスポンシブデザイン（モバイル対応）
   - アクセシビリティ対応（キーボード操作、スクリーンリーダー対応）

この実装はシンプルさと機能性のバランスを重視し、最小限のコードで必要な機能を実現します。将来的な拡張にも対応できる柔軟な設計を目指します。

## API統一の移行チェックリスト

{{ ... }}
