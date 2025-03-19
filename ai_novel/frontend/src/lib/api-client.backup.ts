/**
 * シンプルで堅牢なAPIクライアントライブラリ
 * バックエンドAPIとの通信を担当
 */

import { ApiResponse } from "@/lib/types"

/**
 * API呼び出しの再試行オプション
 */
const RETRY_OPTIONS = {
  retries: 2,         // 最大再試行回数
  retryDelay: 1000,   // 再試行間の遅延（ミリ秒）
  retryStatusCodes: [408, 429, 500, 502, 503, 504]  // 再試行するHTTPステータスコード
};

/**
 * 基本的なAPI呼び出し関数（再試行機能付き）
 * @param endpoint エンドポイント
 * @param options リクエストオプション
 * @returns API レスポンス
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `/api${normalizedEndpoint}`;

  // AbortControllerの設定（タイムアウト用）
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20秒タイムアウト

  const fetchOptions = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...options.headers,
    },
    signal: controller.signal
  };

  let lastError: Error | null = null;
  let retryCount = 0;

  while (retryCount <= RETRY_OPTIONS.retries) {
    try {
      const response = await fetch(url, fetchOptions);

      // タイムアウトタイマーをクリア
      clearTimeout(timeoutId);

      // レスポンスのテキストを取得
      const text = await response.text();

      // JSONパース (空文字列の場合は空オブジェクトを返す)
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        return {
          success: false,
          message: "JSONパースエラー",
        };
      }

      // 成功レスポンス
      if (response.ok) {
        return { success: true, data };
      }

      // 再試行可能なステータスコードの場合
      if (RETRY_OPTIONS.retryStatusCodes.includes(response.status) && retryCount < RETRY_OPTIONS.retries) {
        lastError = new Error(`HTTP error ${response.status}`);
        retryCount++;

        // 再試行前に少し待機
        await new Promise(resolve => setTimeout(resolve, RETRY_OPTIONS.retryDelay));
        continue;
      }

      // 再試行しないエラーレスポンス
      return {
        success: false,
        message: data.detail || `エラー: ${response.status}`,
        errors: data.errors,
      };
    } catch (error) {
      // タイムアウトタイマーをクリア
      clearTimeout(timeoutId);

      // AbortControllerによるタイムアウトの場合
      if (error instanceof DOMException && error.name === 'AbortError') {
        return {
          success: false,
          message: "リクエストがタイムアウトしました",
        };
      }

      lastError = error instanceof Error ? error : new Error(String(error));

      // 最大再試行回数に達していない場合は再試行
      if (retryCount < RETRY_OPTIONS.retries) {
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, RETRY_OPTIONS.retryDelay));
        continue;
      }

      return {
        success: false,
        message: lastError.message || "ネットワークエラー",
      };
    }
  }

  // ここに到達することはないはずだが、TypeScriptのために戻り値を用意
  return {
    success: false,
    message: lastError?.message || "予期せぬエラー",
  };
}

/**
 * ストーリーAPI
 */
export const storyApi = {
  getStories: () => fetchApi<any[]>("/stories"),
  getStory: (id: string | number) => fetchApi<any>(`/stories?id=${id}`),
  createStory: (data: any) => fetchApi<any>("/stories?action=create", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  updateStory: (id: string | number, data: any) => fetchApi<any>(`/stories?id=${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),
  deleteStory: (id: string | number) => fetchApi<null>(`/stories?id=${id}`, {
    method: "DELETE",
  }),
  getLogs: (id: string | number) => fetchApi<any[]>(`/stories?id=${id}&action=logs`),
}

/**
 * 基本設定作成用データAPI
 */
export const basicSettingDataApi = {
  getBasicSettingData: (storyId: string | number) =>
    fetchApi<any>(`/stories?id=${storyId}&action=basic-setting-data`),

  createBasicSettingData: (storyId: string | number, data: any) =>
    fetchApi<any>(`/stories?id=${storyId}&action=basic-setting-data`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateBasicSettingData: (storyId: string | number, data: any) =>
    fetchApi<any>(`/stories?id=${storyId}&action=basic-setting-data`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
}

/**
 * 基本設定API
 */
export const basicSettingApi = {
  getBasicSetting: (storyId: string | number) =>
    fetchApi<any>(`/stories/${storyId}/basic-setting/`),

  generateBasicSetting: (storyId: string | number, basicSettingDataId: number) =>
    fetchApi<any>(`/stories/${storyId}/basic-setting/`, {
      method: "POST",
      body: JSON.stringify({ basic_setting_data_id: basicSettingDataId }),
    }),

  updateBasicSetting: (storyId: string | number, data: any) =>
    fetchApi<any>(`/stories/${storyId}/basic-setting/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
}

/**
 * キャラクターAPI
 */
export const characterApi = {
  getCharacters: (storyId: string | number) =>
    fetchApi<any[]>(`/stories/${storyId}/characters/`),

  getCharacter: (storyId: string | number, characterId: string | number) =>
    fetchApi<any>(`/stories/${storyId}/characters/${characterId}/`),

  createCharacters: (storyId: string | number) =>
    fetchApi<any>(`/stories/${storyId}/create-characters/`, {
      method: "POST",
    }),

  updateCharacter: (storyId: string | number, characterId: string | number, data: any) =>
    fetchApi<any>(`/stories/${storyId}/characters/${characterId}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
}

/**
 * あらすじAPI
 */
export const plotApi = {
  getPlot: (storyId: string | number) =>
    fetchApi<any[]>(`/stories/${storyId}/acts/`),

  getAct: (storyId: string | number, actId: string | number) =>
    fetchApi<any>(`/stories/${storyId}/acts/${actId}/`),

  createPlot: (storyId: string | number) =>
    fetchApi<any>(`/stories/${storyId}/create-plot-detail/`, {
      method: "POST",
    }),

  updateAct: (storyId: string | number, actId: string | number, data: any) =>
    fetchApi<any>(`/stories/${storyId}/acts/${actId}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
}

/**
 * エピソードAPI
 */
export const episodeApi = {
  getEpisodes: (storyId: string | number) =>
    fetchApi<any[]>(`/stories/${storyId}/episodes/`),

  getActEpisodes: (actId: string | number) =>
    fetchApi<any[]>(`/acts/${actId}/episodes/`),

  getEpisode: (actId: string | number, episodeId: string | number) =>
    fetchApi<any>(`/acts/${actId}/episodes/${episodeId}/`),

  getEpisodeContent: (episodeId: string | number) =>
    fetchApi<any>(`/episodes/${episodeId}/content/`),

  createEpisodes: (storyId: string | number) =>
    fetchApi<any>(`/stories/${storyId}/create-episode-details/`, {
      method: "POST",
    }),

  createEpisodeContent: (storyId: string | number, episodeId: string | number) =>
    fetchApi<any>(`/stories/${storyId}/create-episode-content/`, {
      method: "POST",
      body: JSON.stringify({ episode_id: episodeId }),
    }),

  updateEpisode: (actId: string | number, episodeId: string | number, data: any) =>
    fetchApi<any>(`/acts/${actId}/episodes/${episodeId}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  updateEpisodeContent: (episodeId: string | number, data: any) =>
    fetchApi<any>(`/episodes/${episodeId}/content/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
}

/**
 * タスクAPI
 */
export const taskApi = {
  getTaskStatus: (taskId: string) =>
    fetchApi<any>(`/tasks/${taskId}/`),
}

/**
 * 疎通確認API
 */
export const connectivityApi = {
  isLive: () => fetchApi<{ results: string }>('/is_live/'),
}

/**
 * キャラクター詳細API
 */
export const characterDetailApi = {
  getCharacterDetails: (storyId: string | number) =>
    fetchApi<any[]>(`/stories/${storyId}/character-details/`),

  getCharacterDetail: (storyId: string | number, characterId: string | number) =>
    fetchApi<any>(`/stories/${storyId}/character-details/${characterId}/`),

  createCharacterDetail: (storyId: string | number, data: any) =>
    fetchApi<any>(`/stories/${storyId}/character-details/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateCharacterDetail: (storyId: string | number, characterId: string | number, data: any) =>
    fetchApi<any>(`/stories/${storyId}/character-details/${characterId}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteCharacterDetail: (storyId: string | number, characterId: string | number) =>
    fetchApi<boolean>(`/stories/${storyId}/character-details/${characterId}/`, {
      method: "DELETE",
    }),

  generateCharacterWithAI: (storyId: string | number, data: { name: string; role: string }) =>
    fetchApi<any>(`/stories/${storyId}/character-details/generate/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

/**
 * タイトルAPI
 */
export const titleApi = {
  createTitle: (storyId: string | number) =>
    fetchApi<any>(`/stories?id=${storyId}&action=create-title`, {
      method: "POST",
    }),

  getTitle: (storyId: string | number) =>
    fetchApi<any>(`/stories?id=${storyId}&action=title`),
}

/**
 * 統合設定クリエイターAPI
 */
export const integratedSettingCreatorApi = {
  // 統合設定クリエイターデータを保存
  saveIntegratedSettingData(storyId: string | number, data: any) {
    return fetchApi<any>(`/stories/${storyId}/integrated-setting-creator/`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },

  // 統合設定クリエイターデータを取得
  getIntegratedSettingData(storyId: string | number) {
    return fetchApi<any>(`/stories/${storyId}/integrated-setting-creator/detail/`);
  },
};

// 後方互換性のためのエクスポート
export const {
  getCharacterDetails,
  getCharacterDetail,
  createCharacterDetail,
  updateCharacterDetail,
  deleteCharacterDetail,
  generateCharacterWithAI
} = characterDetailApi;
