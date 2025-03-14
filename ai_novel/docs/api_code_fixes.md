# API不整合修正コード例

このドキュメントでは、フロントエンドとバックエンドのAPI不整合を解消するための具体的なコード修正例を提示します。

## 1. エピソード関連の不整合修正

### 1.1 エピソード取得関数の修正

**現状のコード(lib/api-client.ts):**

```typescript
// 問題: フロントエンドがstoryIdを誤ってact_idとして使用
getEpisode: async (storyId: string | number, episodeId: string | number): Promise<ApiResponse<Episode>> => {
  // バックエンドのエンドポイント構造に合わせて修正
  return fetchApi<Episode>(`/acts/${storyId}/episodes/${episodeId}/`)
},
```

**修正コード:**

```typescript
// 修正: 正しくactIdパラメータを使用
getEpisode: async (actId: string | number, episodeId: string | number): Promise<ApiResponse<Episode>> => {
  return fetchApi<Episode>(`/acts/${actId}/episodes/${episodeId}/`)
},
```

### 1.2 エピソード一覧取得関数の修正

**現状のコード:**

```typescript
// 問題: フロントエンドがstoryIdを誤ってact_idとして使用
getEpisodes: async (storyId: string | number): Promise<ApiResponse<Episode[]>> => {
  return fetchApi<Episode[]>(`/acts/${storyId}/episodes/`)
},
```

**修正コード:**

```typescript
// 修正: 正しくactIdパラメータを使用
getEpisodes: async (actId: string | number): Promise<ApiResponse<Episode[]>> => {
  return fetchApi<Episode[]>(`/acts/${actId}/episodes/`)
},
```

### 1.3 エピソードコンテンツ取得関数の修正

**現状のコード:**

```typescript
// 問題: 不要なstoryIdパラメータが存在
getEpisodeContent: async (storyId: string | number, episodeId: string | number): Promise<ApiResponse<EpisodeContent>> => {
  return fetchApi<EpisodeContent>(`/episodes/${episodeId}/content/`)
},
```

**修正コード:**

```typescript
// 修正: 不要なstoryIdパラメータを削除
getEpisodeContent: async (episodeId: string | number): Promise<ApiResponse<EpisodeContent>> => {
  return fetchApi<EpisodeContent>(`/episodes/${episodeId}/content/`)
},
```

### 1.4 エピソードコンテンツ更新関数の修正

**現状のコード:**

```typescript
// 問題: 不要なstoryIdパラメータが存在
updateEpisodeContent: async (storyId: string | number, episodeId: string | number, data: Partial<EpisodeContent>): Promise<ApiResponse<EpisodeContent>> => {
  return fetchApi<EpisodeContent>(`/episodes/${episodeId}/content/`, {
    method: "PATCH",
    body: JSON.stringify(removeEmptyValues(data)),
  })
},
```

**修正コード:**

```typescript
// 修正: 不要なstoryIdパラメータを削除
updateEpisodeContent: async (episodeId: string | number, data: Partial<EpisodeContent>): Promise<ApiResponse<EpisodeContent>> => {
  return fetchApi<EpisodeContent>(`/episodes/${episodeId}/content/`, {
    method: "PATCH",
    body: JSON.stringify(removeEmptyValues(data)),
  })
},
```

## 2. プロット詳細取得の不整合修正

### 2.1 プロット取得関数の修正

**現状のコード:**

```typescript
// 問題: フロントエンドが誤ったエンドポイントを使用
getPlot: async (storyId: string | number): Promise<ApiResponse<PlotDetail>> => {
  // バックエンドにはplot/エンドポイントがないため、基本設定から情報を取得
  return fetchApi<PlotDetail>(`/stories/${storyId}/basic-setting/`)
},
```

**修正コード:**

```typescript
// 修正: 正しいエンドポイントを使用し、返却型も配列に変更
getPlot: async (storyId: string | number): Promise<ApiResponse<PlotDetail[]>> => {
  return fetchApi<PlotDetail[]>(`/stories/${storyId}/acts/`)
},
```

### 2.2 プロット更新関数の修正

**現状のコード:**

```typescript
// 問題: 誤ったエンドポイントを使用
updatePlotDetail: async (storyId: string | number, data: Partial<PlotDetail>): Promise<ApiResponse<PlotDetail>> => {
  return fetchApi<PlotDetail>(`/stories/${storyId}/basic-setting/`, {
    method: "PATCH",
    body: JSON.stringify(removeEmptyValues(data)),
  })
},
```

**修正コード:**

```typescript
// 修正: 正しいエンドポイントを使用、指定された幕IDが必要
updatePlotDetail: async (storyId: string | number, actId: string | number, data: Partial<PlotDetail>): Promise<ApiResponse<PlotDetail>> => {
  return fetchApi<PlotDetail>(`/stories/${storyId}/acts/${actId}/`, {
    method: "PATCH",
    body: JSON.stringify(removeEmptyValues(data)),
  })
},
```

## 3. API呼び出し手法の統一

### 3.1 CharacterDetails関数の修正

**現状のコード:**

```typescript
// 問題: 直接fetchを使用
export async function getCharacterDetails(storyId: number) {
  try {
    // 現在のブラウザのURLからホスト部分を取得
    const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const apiUrl = `${currentUrl}${API_BASE_URL}`;

    const response = await fetch(`${apiUrl}/stories/${storyId}/character-details/`);
    if (!response.ok) {
      throw new Error('キャラクター詳細の取得に失敗しました');
    }
    return await response.json();
  } catch (error) {
    console.error('API error:', error);
    throw new Error('キャラクター詳細の取得に失敗しました');
  }
}
```

**修正コード:**

```typescript
// 修正: fetchApiヘルパー関数を使用
export const characterApi = {
  // 既存のAPI関数...

  // 修正: fetchApi関数を使用して一貫性を確保
  getCharacterDetails: async (storyId: string | number): Promise<ApiResponse<Character[]>> => {
    return fetchApi<Character[]>(`/stories/${storyId}/characters/`);
  },
}
```

### 3.2 その他の直接fetch関数の修正

**現状のコード:**

```typescript
// 問題: 直接fetchを使用
export async function getCharacterDetail(storyId: string, characterId: string) {
  try {
    // 現在のブラウザのURLからホスト部分を取得
    const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const apiUrl = `${currentUrl}${API_BASE_URL}`;

    const response = await fetch(`${apiUrl}/stories/${storyId}/character-details/${characterId}/`);
    if (!response.ok) {
      throw new Error('キャラクター詳細の取得に失敗しました');
    }
    return await response.json();
  } catch (error) {
    console.error('API error:', error);
    throw new Error('キャラクター詳細の取得に失敗しました');
  }
}
```

**修正コード:**

```typescript
// 修正: characterApiオブジェクトに統合
export const characterApi = {
  // 既存のAPI関数...

  getCharacterDetail: async (storyId: string | number, characterId: string | number): Promise<ApiResponse<Character>> => {
    return fetchApi<Character>(`/stories/${storyId}/characters/${characterId}/`);
  },
}
```

### 3.3 他の直接fetch関数も同様に修正

```typescript
// 同様の方法で他の直接fetch関数も修正
export const characterApi = {
  // 既存/修正済みのAPI関数...

  createCharacterDetail: async (storyId: string | number, data: any): Promise<ApiResponse<Character>> => {
    return fetchApi<Character>(`/stories/${storyId}/characters/`, {
      method: "POST",
      body: JSON.stringify(removeEmptyValues(data)),
    });
  },

  updateCharacterDetail: async (storyId: string | number, characterId: string | number, data: any): Promise<ApiResponse<Character>> => {
    return fetchApi<Character>(`/stories/${storyId}/characters/${characterId}/`, {
      method: "PATCH",
      body: JSON.stringify(removeEmptyValues(data)),
    });
  },

  deleteCharacterDetail: async (storyId: string | number, characterId: string | number): Promise<ApiResponse<null>> => {
    return fetchApi<null>(`/stories/${storyId}/characters/${characterId}/`, {
      method: "DELETE",
    });
  },

  generateCharacterWithAI: async (storyId: string | number, data: { name: string; role: string }): Promise<ApiResponse<any>> => {
    return fetchApi<any>(`/stories/${storyId}/create-character-detail/`, {
      method: "POST",
      body: JSON.stringify(removeEmptyValues(data)),
    });
  },
}
```

## 4. 型定義の整合性確保

### 4.1 BasicSettingData型の修正

**現状のコード:**

```typescript
// 問題: バックエンドモデルと不一致
export interface BasicSettingData {
  theme: string;
  era: string; // これはtime_and_placeに対応
  setting: string; // これはworld_settingに対応
  plot_type: string; // これはplot_patternに対応
  emotions: string | string[]; // 情緒的要素（複数のフィールドに分散）
  mystery: string; // past_mysteriesの単一要素
}
```

**修正コード:**

```typescript
// 修正: バックエンドモデルと一致させる
export interface BasicSettingData {
  id?: number;
  storyId?: number; // ai_story_id
  theme: string;
  timeAndPlace: string; // time_and_place
  worldSetting: string; // world_setting
  plotPattern: string; // plot_pattern
  loveExpressions: string[]; // love_expressions
  emotionalExpressions: string[]; // emotional_expressions
  atmosphere: string[]; // atmosphere
  sensualExpressions: string[]; // sensual_expressions
  mentalElements: string[]; // mental_elements
  socialElements: string[]; // social_elements
  pastMysteries: string[]; // past_mysteries
  rawContent?: any; // raw_content
  formattedContent?: string; // formatted_content
  createdAt?: string; // created_at
  updatedAt?: string; // updated_at
}

// UIとの互換性のために、既存のインターフェースをエイリアスとして維持
export interface BasicSettingDataInput {
  theme: string;
  era: string;
  setting: string;
  plot_type: string;
  emotions: string | string[];
  mystery: string;
}

// 変換関数
export function convertToBackendFormat(input: BasicSettingDataInput): Partial<BasicSettingData> {
  const result: Partial<BasicSettingData> = {
    theme: input.theme,
    timeAndPlace: input.era,
    worldSetting: input.setting,
    plotPattern: input.plot_type,
    loveExpressions: [],
    emotionalExpressions: [],
    atmosphere: [],
    sensualExpressions: [],
    mentalElements: [],
    socialElements: [],
    pastMysteries: [input.mystery],
    rawContent: input
  };

  // emotionsの処理
  const emotions = Array.isArray(input.emotions) ? input.emotions : [input.emotions];

  emotions.forEach(emotion => {
    if (emotion === 'love_expression') {
      result.loveExpressions!.push(emotion);
    } else if (emotion === 'emotional_expression') {
      result.emotionalExpressions!.push(emotion);
    } else if (emotion === 'atmosphere') {
      result.atmosphere!.push(emotion);
    } else if (emotion === 'sensual_expression') {
      result.sensualExpressions!.push(emotion);
    } else if (emotion === 'spiritual_elements') {
      result.mentalElements!.push(emotion);
    } else if (emotion === 'social_elements') {
      result.socialElements!.push(emotion);
    }
  });

  return result;
}
```

### 4.2 Episode型の修正

**修正コード:**

```typescript
// 修正: バックエンドモデルと一致させる
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

// スネークケース変換ユーティリティ
export function camelToSnakeCase(obj: any): any {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => camelToSnakeCase(item));
  }

  const result: any = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = camelToSnakeCase(obj[key]);
    }
  }

  return result;
}

// キャメルケース変換ユーティリティ
export function snakeToCamelCase(obj: any): any {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => snakeToCamelCase(item));
  }

  const result: any = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = snakeToCamelCase(obj[key]);
    }
  }

  return result;
}
```

## 5. コンポーネント修正例

既存のコンポーネントでAPI呼び出しを行っている箇所も修正が必要です：

### 5.1 エピソード一覧コンポーネントの修正例

**現状のコード:**

```tsx
// 問題: storyIdを誤ってactIdとして使用
const fetchEpisodes = async () => {
  try {
    setLoading(true);
    const response = await episodeApi.getEpisodes(storyId);
    if (response.success && response.data) {
      setEpisodes(response.data);
    } else {
      toast({
        title: "エピソード取得エラー",
        description: response.message || "エピソードの取得に失敗しました",
        variant: "destructive",
      });
    }
  } catch (error) {
    console.error("エピソード取得エラー:", error);
    toast({
      title: "エラー",
      description: "エピソードの取得中にエラーが発生しました",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};
```

**修正コード:**

```tsx
// 修正: 正しくactIdを使用
const fetchEpisodes = async () => {
  try {
    setLoading(true);
    // 修正: storyIdではなくactIdを使用
    const response = await episodeApi.getEpisodes(actId);
    if (response.success && response.data) {
      setEpisodes(response.data);
    } else {
      toast({
        title: "エピソード取得エラー",
        description: response.message || "エピソードの取得に失敗しました",
        variant: "destructive",
      });
    }
  } catch (error) {
    console.error("エピソード取得エラー:", error);
    toast({
      title: "エラー",
      description: "エピソードの取得中にエラーが発生しました",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};
```

### 5.2 エピソードコンテンツ取得の修正例

**現状のコード:**

```tsx
// 問題: 不要なstoryIdを渡している
const fetchEpisodeContent = async () => {
  try {
    setLoading(true);
    const response = await episodeApi.getEpisodeContent(storyId, episodeId);
    if (response.success && response.data) {
      setContent(response.data);
    } else {
      toast({
        title: "本文取得エラー",
        description: response.message || "エピソード本文の取得に失敗しました",
        variant: "destructive",
      });
    }
  } catch (error) {
    console.error("本文取得エラー:", error);
    toast({
      title: "エラー",
      description: "エピソード本文の取得中にエラーが発生しました",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};
```

**修正コード:**

```tsx
// 修正: 不要なstoryIdを削除
const fetchEpisodeContent = async () => {
  try {
    setLoading(true);
    // 修正: storyIdパラメータを削除
    const response = await episodeApi.getEpisodeContent(episodeId);
    if (response.success && response.data) {
      setContent(response.data);
    } else {
      toast({
        title: "本文取得エラー",
        description: response.message || "エピソード本文の取得に失敗しました",
        variant: "destructive",
      });
    }
  } catch (error) {
    console.error("本文取得エラー:", error);
    toast({
      title: "エラー",
      description: "エピソード本文の取得中にエラーが発生しました",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};
```

## まとめ

上記の修正例は、フロントエンドとバックエンドのAPI不整合を解消するための具体的なコード修正例です。これらの修正を適用することで、以下の改善が期待できます：

1. エンドポイントのURL構造とパラメータの一致
2. API呼び出し方法の統一化
3. 型定義とバックエンドモデルの整合性確保
4. エラーハンドリングの一貫性

これらの修正は段階的に適用し、各修正後に十分なテストを行うことが重要です。また、修正に伴う変更がユーザーエクスペリエンスに与える影響を最小限に抑えるために、一時的な互換性レイヤーの実装も検討するとよいでしょう。
