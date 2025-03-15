# API エンドポイントマッピング

このドキュメントでは、バックエンドのAPIエンドポイントとフロントエンドのAPI呼び出し関数の対応関係を整理します。

## 【重要】API URL構造の統一方針（2025/3/14更新）

システムの安定性向上のため、フロントエンドAPIのURL構造について以下の方針を確立しました：

### バックエンド（Django）

RESTfulな階層構造を維持：

```
/api/stories/{id}/resource/
```

### フロントエンド（Next.js）

ネストされた動的ルートの代わりに、クエリパラメータ形式を採用：

```
/api/story-resource?id={id}
```

この構造はテスト（`test_story_is_live.ts`）により検証済みで、より安定した動作を確認しています。今後のAPI実装は全てこの方針に従ってください。詳細は[APIルーティングのベストプラクティス](/ai_novel/docs/api_routing_best_practices.md)を参照。

## APIレスポンスのステータスコード標準

APIレスポンスのステータスコードは、以下の基準に従って使用します：

### データ取得時のステータスコード

| ステータスコード | 意味 | 使用例 |
|--------------|------|-------|
| 200 OK | リクエストが成功し、データが存在する | リソースが正常に取得できた場合 |
| 204 No Content | リクエストは成功したが、返すコンテンツがない | 対象のリソースは存在するが、データがない場合 |
| 400 Bad Request | リクエストの形式が不正 | パラメータが不足している、形式が間違っている場合 |
| 401 Unauthorized | 認証が必要 | 認証されていないユーザーがアクセスした場合 |
| 403 Forbidden | アクセス権限がない | 認証済みだが権限がない場合 |
| 404 Not Found | リソース自体が存在しない | 存在しないURLにアクセスした場合 |
| 500 Internal Server Error | サーバー内部エラー | 予期しないエラーが発生した場合 |

## リソース別エンドポイント一覧

### 1. 小説 (Story)

| 機能 | バックエンドエンドポイント | HTTP メソッド | フロントエンド関数 | 推奨フロントエンドURL |
|------|--------------------------|--------------|------------------|----------------------|
| 小説一覧取得 | `/stories/` | GET | `storyApi.getStories()` | `/api/stories` |
| 小説詳細取得 | `/stories/{id}/` | GET | `storyApi.getStory(id)` | `/api/story?id={id}` |
| 小説作成 | `/stories/` | POST | `storyApi.createStory(data)` | `/api/stories/new` |
| 小説更新 | `/stories/{id}/` | PATCH | `storyApi.updateStory(id, data)` | `/api/story-update?id={id}` |
| 小説削除 | `/stories/{id}/` | DELETE | `storyApi.deleteStory(id)` | `/api/story-delete?id={id}` |
| 小説ログ取得 | `/stories/{id}/logs/` | GET | `storyApi.getLogs(id)` | `/api/story-logs?id={id}` |
| 疎通確認 | `/stories/{id}/is_live/` | GET | - | `/api/story-is-live?id={id}` |

### 2. 基本設定作成用データ (BasicSettingData)

| 機能 | バックエンドエンドポイント | HTTP メソッド | フロントエンド関数 | 推奨フロントエンドURL |
|------|--------------------------|--------------|------------------|----------------------|
| データ取得 | `/stories/{storyId}/basic-setting-data/` | GET | `basicSettingApi.getBasicSettingData(storyId)` | `/api/story-basic-setting-data?id={storyId}` |
| データ作成 | `/stories/{storyId}/basic-setting-data/` | POST | `basicSettingApi.createBasicSettingData(storyId, data)` | `/api/story-basic-setting-data?id={storyId}` |
| データ更新 | `/stories/{storyId}/basic-setting-data/` | PATCH | `basicSettingApi.updateBasicSettingData(storyId, data)` | `/api/story-basic-setting-data-update?id={storyId}` |
| プレビュー | `/preview-basic-setting-data/` | POST | - | `/api/basic-setting-data-preview` |

### 3. 基本設定 (BasicSetting)

| 機能 | バックエンドエンドポイント | HTTP メソッド | フロントエンド関数 | 推奨フロントエンドURL |
|------|--------------------------|--------------|------------------|----------------------|
| 設定取得 | `/stories/{storyId}/basic-setting/` | GET | `basicSettingApi.getBasicSetting(storyId)` | `/api/story-basic-setting?id={storyId}` |
| 設定生成 | `/stories/{storyId}/basic-setting/` | POST | `basicSettingApi.generateBasicSetting(storyId)` | `/api/story-basic-setting?id={storyId}` |
| 設定更新 | `/stories/{storyId}/basic-setting/` | PATCH | `basicSettingApi.updateBasicSetting(storyId, data)` | `/api/story-basic-setting-update?id={storyId}` |

### 4. キャラクター (Character)

| 機能 | バックエンドエンドポイント | HTTP メソッド | フロントエンド関数 | 推奨フロントエンドURL |
|------|--------------------------|--------------|------------------|----------------------|
| キャラ一覧取得 | `/stories/{storyId}/characters/` | GET | `characterApi.getCharacters(storyId)` | `/api/story-characters?id={storyId}` |
| キャラ詳細取得 | `/stories/{storyId}/characters/{characterId}/` | GET | `characterApi.getCharacter(storyId, characterId)` | `/api/story-character?story_id={storyId}&character_id={characterId}` |
| キャラ生成 | `/stories/{storyId}/create-characters/` | POST | `characterApi.createCharacters(storyId)` | `/api/story-create-characters?id={storyId}` |
| キャラ更新 | `/stories/{storyId}/characters/{characterId}/` | PATCH | `characterApi.updateCharacter(storyId, characterId, data)` | `/api/story-character-update?story_id={storyId}&character_id={characterId}` |
| 非API関数 | `/stories/{storyId}/characters/` | GET | `getCharacterDetails(storyId)` | `/api/story-character-details?id={storyId}` |
| 非API関数 | `/stories/{storyId}/characters/{characterId}/` | GET | `getCharacterDetail(storyId, characterId)` | `/api/story-character-detail?story_id={storyId}&character_id={characterId}` |
| 非API関数 | `/stories/{storyId}/characters/` | POST | `createCharacterDetail(storyId, data)` | `/api/story-character-create?id={storyId}` |
| 非API関数 | `/stories/{storyId}/characters/{characterId}/` | PUT | `updateCharacterDetail(storyId, characterId, data)` | `/api/story-character-update?story_id={storyId}&character_id={characterId}` |
| 非API関数 | `/stories/{storyId}/characters/{characterId}/` | DELETE | `deleteCharacterDetail(storyId, characterId)` | `/api/story-character-delete?story_id={storyId}&character_id={characterId}` |
| 非API関数 | `/stories/{storyId}/character-details/generate/` | POST | `generateCharacterWithAI(storyId, data)` | `/api/story-character-generate?id={storyId}` |

### 5. プロット/あらすじ (Plot/Act)

| 機能 | バックエンドエンドポイント | HTTP メソッド | フロントエンド関数 | 推奨フロントエンドURL |
|------|--------------------------|--------------|------------------|----------------------|
| 幕一覧取得 | `/stories/{storyId}/acts/` | GET | `plotApi.getPlot(storyId)` | `/api/story-acts?id={storyId}` |
| 幕詳細取得 | `/stories/{storyId}/acts/{actId}/` | GET | - | `/api/story-act?story_id={storyId}&act_id={actId}` |
| プロット生成 | `/stories/{storyId}/create-plot-detail/` | POST | `plotApi.createPlot(storyId)` | `/api/story-create-plot?id={storyId}` |
| プロット更新 | `/stories/{storyId}/basic-setting/` | PATCH | `plotApi.updatePlotDetail(storyId, data)` | `/api/story-plot-update?id={storyId}` |

### 6. エピソード (Episode)

| 機能 | バックエンドエンドポイント | HTTP メソッド | フロントエンド関数 | 推奨フロントエンドURL |
|------|--------------------------|--------------|------------------|----------------------|
| エピソード一覧 | `/acts/{actId}/episodes/` | GET | `episodeApi.getEpisodes(storyId)` | `/api/act-episodes?id={actId}` |
| エピソード詳細 | `/acts/{actId}/episodes/{episodeId}/` | GET | `episodeApi.getEpisode(storyId, episodeId)` | `/api/act-episode?act_id={actId}&episode_id={episodeId}` |
| ストーリーのエピソード一覧 | `/stories/{storyId}/episodes/` | GET | - | `/api/story-episodes?id={storyId}` |
| エピソード生成 | `/stories/{storyId}/create-episode-details/` | POST | `episodeApi.createEpisodes(storyId)` | `/api/story-create-episodes?id={storyId}` |

### 7. エピソード本文 (EpisodeContent)

| 機能 | バックエンドエンドポイント | HTTP メソッド | フロントエンド関数 | 推奨フロントエンドURL |
|------|--------------------------|--------------|------------------|----------------------|
| 本文取得 | `/episodes/{episodeId}/content/` | GET | `episodeApi.getEpisodeContent(storyId, episodeId)` | `/api/episode-content?id={episodeId}` |
| 本文生成 | `/stories/{storyId}/create-episode-content/` | POST | `episodeApi.createEpisodeContent(storyId, episodeId)` | `/api/story-create-episode-content?id={storyId}&episode_id={episodeId}` |
| 本文更新 | `/episodes/{episodeId}/content/` | PATCH | `episodeApi.updateEpisodeContent(storyId, episodeId, data)` | `/api/episode-content-update?id={episodeId}` |

### 8. タイトル生成 (Title)

| 機能 | バックエンドエンドポイント | HTTP メソッド | フロントエンド関数 | 推奨フロントエンドURL |
|------|--------------------------|--------------|------------------|----------------------|
| タイトル生成 | `/stories/{storyId}/generate-title/` | POST | `titleApi.createTitle(storyId)` | `/api/story-generate-title?id={storyId}` |
| タイトル取得 | - | - | `titleApi.getTitle(storyId)` | `/api/story-title?id={storyId}` |

## データ構造の不整合

### BasicSettingData

**バックエンド（モデル）**:

```python
class BasicSettingData(TimeStampedModel):
    ai_story = models.ForeignKey(AIStory, on_delete=models.CASCADE, related_name='basic_setting_data')
    theme = models.CharField(_('主題'), max_length=100)
    time_and_place = models.CharField(_('時代と場所'), max_length=100)
    world_setting = models.CharField(_('作品世界と舞台設定'), max_length=100)
    plot_pattern = models.CharField(_('プロットパターン'), max_length=100)
    love_expressions = ArrayField(models.CharField(max_length=100), blank=True, verbose_name=_('愛情表現'))
    emotional_expressions = ArrayField(models.CharField(max_length=100), blank=True, verbose_name=_('感情表現'))
    atmosphere = ArrayField(models.CharField(max_length=100), blank=True, verbose_name=_('雰囲気演出'))
    sensual_expressions = ArrayField(models.CharField(max_length=100), blank=True, verbose_name=_('官能表現'))
    mental_elements = ArrayField(models.CharField(max_length=100), blank=True, verbose_name=_('精神的要素'))
    social_elements = ArrayField(models.CharField(max_length=100), blank=True, verbose_name=_('社会的要素'))
    past_mysteries = ArrayField(models.CharField(max_length=100), blank=True, verbose_name=_('過去の謎'))
    raw_content = models.JSONField(_('生データ'), blank=True, null=True)
    formatted_content = models.TextField(_('整形済みデータ'), blank=True)
```

**フロントエンド（推奨型定義）**:

```typescript
export interface BasicSettingData {
  id?: number;
  ai_story?: AIStory;
  theme: string;
  time_and_place: string;
  world_setting: string;
  plot_pattern: string;
  love_expressions: string[];
  emotional_expressions: string[];
  atmosphere: string[];
  sensual_expressions: string[];
  mental_elements: string[];
  social_elements: string[];
  past_mysteries: string[];
  raw_content?: any;
  formatted_content?: string;
  created_at?: string;
  updated_at?: string;
}
```

**現在のフロントエンド（型定義）**:

```typescript
export interface BasicSettingData {
  theme: string;
  era: string; // これはtime_and_placeに対応
  setting: string; // これはworld_settingに対応
  plot_type: string; // これはplot_patternに対応
  emotions: string | string[]; // 情緒的要素（複数のフィールドに分散）
  mystery: string; // past_mysteriesの単一要素
}
```

### Episode

**バックエンド（モデル）**:

```python
class EpisodeDetail(TimeStampedModel):
    act = models.ForeignKey(ActDetail, on_delete=models.CASCADE, related_name='episode_details')
    episode_number = models.IntegerField(_('エピソード番号'))
    title = models.CharField(_('タイトル'), max_length=255)
    content = models.TextField(_('内容'))
    raw_content = models.TextField(_('生データ'))
    is_edited = models.BooleanField(_('編集済み'), default=False)
```

**フロントエンド（推奨型定義）**:

```typescript
export interface Episode {
  id?: number;
  act_id: number;
  episode_number: number;
  title: string;
  content: string;
  raw_content: string;
  is_edited: boolean;
  created_at?: string;
  updated_at?: string;
}
```

**現在のフロントエンド（型定義）** - 推定:

```typescript
export interface Episode {
  id: number;
  actId: number; // act_id
  episodeNumber: number; // episode_number
  title: string;
  content: string;
  rawContent: string; // raw_content
  isEdited: boolean; // is_edited
  createdAt: string; // created_at
  updatedAt: string; // updated_at
}
```

## 修正方針

### 優先的に修正すべき項目

1. **新URL形式への移行**:
   - 全てのフロントエンドエンドポイントをクエリパラメータ形式に変更
   - `/api/story-resource?id={id}` パターンへの統一

2. **エピソード関連の不整合**:
   - `episodeApi.getEpisodes` の引数を `actId` に変更
   - `episodeApi.getEpisode` の引数を `actId` に変更
   - `episodeApi.getEpisodeContent` から不要な `storyId` を削除
   - `episodeApi.updateEpisodeContent` から不要な `storyId` を削除

3. **プロット詳細取得の不整合**:
   - `plotApi.getPlot` のエンドポイントを `/stories/{storyId}/acts/` に修正
   - 返却型を `PlotDetail` から `PlotDetail[]` に変更

4. **直接fetch使用の関数をfetchApiに統一**:
   - `getCharacterDetails`
   - `getCharacterDetail`
   - `createCharacterDetail`
   - `updateCharacterDetail`
   - `deleteCharacterDetail`
   - `generateCharacterWithAI`

5. **型定義の整合性確保**:
   - スネークケース形式を基本とする
   - フロントエンド⇔バックエンド間の変換ユーティリティを標準化

## ベストプラクティス例

次のコードは、新しいAPIルーティングパターンの実装例です：

```typescript
// フロントエンドAPI実装例
export async function GET(request: NextRequest) {
  try {
    // URLからクエリパラメータを取得
    const searchParams = request.nextUrl.searchParams;
    const storyId = searchParams.get('id');

    // バックエンドの対応するエンドポイントにリクエスト
    const backendUrl = `http://${backendHost}:${backendPort}/api/stories/${storyId}/is_live/`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    // エラー処理
  }
}
```

## 次のステップ

1. このマッピングを基に具体的な修正コードを作成
2. 各修正項目をレビューし、優先順位を決定
3. テスト計画を立案し、各修正の影響範囲を評価
4. 段階的に修正を適用し、その都度テストを実施
5. 新たに作成したAPIルートの動作を全て確認
