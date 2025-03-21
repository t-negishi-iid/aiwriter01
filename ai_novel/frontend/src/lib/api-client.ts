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
 * バックエンドAPIのホストとポート
 * 環境変数から取得するか、デフォルト値を使用
 */
const backendHost = process.env.NEXT_PUBLIC_BACKEND_HOST || 'localhost';
const backendPort = process.env.NEXT_PUBLIC_BACKEND_PORT || '8001';
const backendBaseUrl = `http://${backendHost}:${backendPort}/api`;

/**
 * APIクライアント関数
 */
export const fetchApi = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  // エンドポイントが/で始まっていない場合は追加
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // 末尾のスラッシュを追加（バックエンドAPIとの互換性のため）
  const finalEndpoint = normalizedEndpoint.endsWith('/') ? normalizedEndpoint : `${normalizedEndpoint}/`;

  const url = `${backendBaseUrl}${finalEndpoint}`;
  console.log(`[TRACE] fetchApi 開始 - URL: ${url} - ${new Date().toISOString()}`);

  try {
    console.log(`[TRACE] fetch 呼び出し前 - ${new Date().toISOString()}`);
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    console.log(`[TRACE] fetch 呼び出し後 - ステータス: ${response.status} - ${new Date().toISOString()}`);

    if (!response.ok) {
      // エラーレスポンスの処理
      const errorText = await response.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        errorJson = { detail: errorText };
      }

      throw {
        status: response.status,
        statusText: response.statusText,
        data: errorJson,
      };
    }

    // 成功レスポンスの処理
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  } catch (error) {
    console.error(`[ERROR] fetchApi エラー:`, error);
    throw error;
  }
};

/**
 * 統合設定データの型定義
 */
interface IntegratedSettingData {
  success?: string;
  results?: {
    basic_setting_data?: string;
    id?: number;
    user?: any;
    story?: any;
    created_at?: string;
  };
}

/**
 * ストーリーAPI
 */
export const storyApi = {
  getStories: () => fetchApi("/stories"),
  getStory: (id: string | number) => fetchApi(`/stories/${id}/`),
  createStory: (data: any) => fetchApi("/stories/", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  updateStory: (id: string | number, data: any) => fetchApi(`/stories/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),
  deleteStory: (id: string | number) => fetchApi(`/stories/${id}/`, {
    method: "DELETE",
  }),
  getLogs: (id: string | number) => fetchApi(`/stories/${id}/api-logs/`),
}

/**
 * 基本設定データAPI
 */
export const basicSettingDataApi = {
  getBasicSettingData: (storyId: string | number) =>
    fetchApi(`/stories/${storyId}/integrated-setting-creator/`),

  createBasicSettingData: (storyId: string | number, data: any) =>
    fetchApi(`/stories/${storyId}/integrated-setting-creator/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateBasicSettingData: (storyId: string | number, data: any) =>
    fetchApi(`/stories/${storyId}/integrated-setting-creator/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  /**
   * 基本設定データを取得する
   * @param storyId ストーリーID
   * @param apiBaseUrl APIベースURL
   * @returns APIレスポンス
   */
  async getBasicSettingData(storyId: string | number, apiBaseUrl: string = 'http://localhost:8001/api'): Promise<BasicSettingData> {
    console.log(`[TRACE] getBasicSettingData 開始 - storyId: ${storyId} - ${new Date().toISOString()}`);

    // バックエンドAPIに直接アクセス - 正しいエンドポイントを使用
    const endpoint = `stories/${storyId}/basic-setting/latest/`;
    console.log(`[TRACE] エンドポイント構築: ${endpoint} - ${new Date().toISOString()}`);

    try {
      // fetchApiではなく、直接fetchを使用
      const url = `${apiBaseUrl}/${endpoint}`;
      console.log(`[TRACE] 完全なURL: ${url} - ${new Date().toISOString()}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(`[TRACE] レスポンスステータス: ${response.status} - ${new Date().toISOString()}`);

      // 204 No Contentの場合は空のデータを返す
      if (response.status === 204) {
        console.log(`[TRACE] 204 No Content、データが存在しません - ${new Date().toISOString()}`);
        return {
          success: true,
          basic_setting_data: "",
          integrated_setting_data: "",
          message: 'データが存在しません'
        };
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API エラー: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`[TRACE] getBasicSettingData 完了 - レスポンス: ${JSON.stringify(data).substring(0, 200)}... - ${new Date().toISOString()}`);

      // バックエンドからのレスポンスをそのまま返す
      return data;
    } catch (error) {
      console.error(`[TRACE] getBasicSettingData エラー: ${error} - ${new Date().toISOString()}`);
      return {
        success: false,
        message: `データの取得に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`
      };
    }
  },

  // 基本設定データを保存
  saveBasicSettingData: async (storyId: string | number, data: any): Promise<ApiResponse<any>> => {
    console.log('基本設定データを保存中...');
    console.log(`ストーリーID: ${storyId}`);

    // リクエストデータを準備
    const requestData = {
      basic_setting_data: data.basic_setting_data
    };

    console.log(`送信データ (先頭100文字): ${JSON.stringify(requestData).substring(0, 100)}...`);

    // APIリクエストを送信
    const endpoint = `/stories/${storyId}/basic-setting/`;

    return fetchApi(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });
  },
}

/**
 * 基本設定API
 */
export const basicSettingApi = {
  getBasicSetting: (storyId: string | number) =>
    fetchApi(`/stories/${storyId}/latest-basic-setting/`),

  generateBasicSetting: (storyId: string | number, basicSettingDataId: number) =>
    fetchApi(`/stories/${storyId}/basic-setting/`, {
      method: "POST",
      body: JSON.stringify({ basic_setting_data_id: basicSettingDataId }),
    }),

  updateBasicSetting: (storyId: string | number, data: any) =>
    fetchApi(`/stories/${storyId}/basic-setting/${data.id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
}

/**
 * キャラクターAPI
 */
export const characterApi = {
  getCharacters: (storyId: string | number) =>
    fetchApi(`/stories/${storyId}/characters/`),

  getCharacter: (storyId: string | number, characterId: string | number) =>
    fetchApi(`/stories/${storyId}/characters/${characterId}/`),

  createCharacter: (storyId: string | number, data: any) =>
    fetchApi(`/stories/${storyId}/characters/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  createCharacters: (storyId: string | number) =>
    fetchApi(`/stories/${storyId}/create-characters/`, {
      method: "POST",
    }),

  updateCharacter: (storyId: string | number, characterId: string | number, data: any) =>
    fetchApi(`/stories/${storyId}/characters/${characterId}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
    
  deleteCharacter: (storyId: string | number, characterId: string | number) =>
    fetchApi(`/stories/${storyId}/characters/${characterId}/`, {
      method: "DELETE",
    }),
}

/**
 * あらすじAPI
 */
export const plotApi = {
  getPlot: (storyId: string | number) =>
    fetchApi(`/stories/${storyId}/acts/`),

  getAct: (storyId: string | number, actId: string | number) =>
    fetchApi(`/stories/${storyId}/acts/${actId}/`),

  createPlot: (storyId: string | number) =>
    fetchApi(`/stories/${storyId}/create-plot-detail/`, {
      method: "POST",
    }),

  updateAct: (storyId: string | number, actId: string | number, data: any) =>
    fetchApi(`/stories/${storyId}/acts/${actId}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
}

/**
 * エピソードAPI
 */
export const episodeApi = {
  getEpisodes: (storyId: string | number) =>
    fetchApi(`/stories/${storyId}/episodes/`),

  getActEpisodes: (actId: string | number) =>
    fetchApi(`/acts/${actId}/episodes/`),

  getEpisode: (actId: string | number, episodeId: string | number) =>
    fetchApi(`/acts/${actId}/episodes/${episodeId}/`),

  getEpisodeContent: (episodeId: string | number) =>
    fetchApi(`/episodes/${episodeId}/content/`),

  createEpisodes: (storyId: string | number) =>
    fetchApi(`/stories/${storyId}/create-episode-details/`, {
      method: "POST",
    }),

  createEpisodeContent: (storyId: string | number, episodeId: string | number) =>
    fetchApi(`/stories/${storyId}/create-episode-content/`, {
      method: "POST",
      body: JSON.stringify({ episode_id: episodeId }),
    }),

  updateEpisode: (actId: string | number, episodeId: string | number, data: any) =>
    fetchApi(`/acts/${actId}/episodes/${episodeId}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  updateEpisodeContent: (episodeId: string | number, data: any) =>
    fetchApi(`/episodes/${episodeId}/content/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
}

/**
 * タスクAPI
 */
export const taskApi = {
  getTaskStatus: (taskId: string) =>
    fetchApi(`/tasks/${taskId}/`),
}

/**
 * 疎通確認API
 */
export const connectivityApi = {
  isLive: () => fetchApi('/is_live/'),
}

/**
 * キャラクター詳細API
 */
export const characterDetailApi = {
  getCharacterDetails: (storyId: string | number) =>
    fetchApi(`/stories/${storyId}/character-details/`),

  getCharacterDetail: (storyId: string | number, characterId: string | number) =>
    fetchApi(`/stories/${storyId}/character-details/${characterId}/`),

  createCharacterDetail: (storyId: string | number, data: any) =>
    fetchApi(`/stories/${storyId}/character-details/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateCharacterDetail: (storyId: string | number, characterId: string | number, data: any) =>
    fetchApi(`/stories/${storyId}/character-details/${characterId}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteCharacterDetail: (storyId: string | number, characterId: string | number) =>
    fetchApi(`/stories/${storyId}/character-details/${characterId}/`, {
      method: "DELETE",
    }),

  generateCharacterWithAI: (storyId: string | number, data: { name: string; role: string }) =>
    fetchApi(`/stories/${storyId}/character-details/generate/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

/**
 * タイトルAPI
 */
export const titleApi = {
  createTitle: (storyId: string | number) =>
    fetchApi(`/stories?id=${storyId}&action=create-title`, {
      method: "POST",
    }),

  getTitle: (storyId: string | number) =>
    fetchApi(`/stories?id=${storyId}&action=title`),
}

/**
 * 統合設定クリエイターAPI
 */
export const integratedSettingCreatorApi = {
  /**
   * 統合設定データを取得する
   * @param storyId ストーリーID
   * @param apiBaseUrl APIベースURL
   * @returns APIレスポンス
   */
  async getIntegratedSettingData(storyId: string | number, apiBaseUrl: string = 'http://localhost:8001/api'): Promise<IntegratedSettingData> {
    console.log(`[TRACE] getIntegratedSettingData 開始 - storyId: ${storyId} - ${new Date().toISOString()}`);

    // バックエンドAPIに直接アクセス - 正しいエンドポイントを使用
    const endpoint = `stories/${storyId}/integrated-setting-creator/detail/`;
    console.log(`[TRACE] エンドポイント構築: ${endpoint} - ${new Date().toISOString()}`);

    try {
      // fetchApiではなく、直接fetchを使用
      const url = `${apiBaseUrl}/${endpoint}`;
      console.log(`[TRACE] 完全なURL: ${url} - ${new Date().toISOString()}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(`[TRACE] レスポンスステータス: ${response.status} - ${new Date().toISOString()}`);

      // 204 No Contentの場合は空のデータを返す
      if (response.status === 204) {
        console.log(`[TRACE] 204 No Content、データが存在しません - ${new Date().toISOString()}`);
        return {
          success: true,
          basic_setting_data: "",
          integrated_setting_data: "",
          message: 'データが存在しません'
        };
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API エラー: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`[TRACE] getIntegratedSettingData 完了 - レスポンス: ${JSON.stringify(data).substring(0, 200)}... - ${new Date().toISOString()}`);

      // バックエンドからのレスポンスをそのまま返す
      return data;
    } catch (error) {
      console.error(`[TRACE] getIntegratedSettingData エラー: ${error} - ${new Date().toISOString()}`);
      return {
        success: false,
        message: `データの取得に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`
      };
    }
  },

  // 統合設定クリエイターデータを保存
  saveIntegratedSettingData: async (storyId: string | number, data: any): Promise<ApiResponse<any>> => {
    console.log('統合設定クリエイターデータを保存中...');
    console.log(`ストーリーID: ${storyId}`);

    // リクエストデータを準備
    const requestData = {
      basic_setting_data: data.basic_setting_data
    };

    console.log(`送信データ (先頭100文字): ${JSON.stringify(requestData).substring(0, 100)}...`);

    // APIリクエストを送信
    const endpoint = `/stories/${storyId}/integrated-setting-creator/`;

    return fetchApi(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });
  },
}

// 後方互換性のためのエクスポート
export const {
  getCharacterDetails,
  getCharacterDetail,
  createCharacterDetail,
  updateCharacterDetail,
  deleteCharacterDetail,
  generateCharacterWithAI
} = characterDetailApi;
