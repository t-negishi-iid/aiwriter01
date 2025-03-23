/**
 * 統一されたバックエンドAPIとの通信を行うユーティリティ関数
 * 段階的にこのファイルの関数に置き換えていく
 */

/**
 * APIエラーの種類
 */
export enum ApiErrorType {
  // システムエラー（内部エラー、通信エラーなど）
  SYSTEM = 'system',
  // ユーザー通知（クレジット不足、設定不足など）
  USER_NOTIFICATION = 'user_notification',
  // 認証エラー（未ログイン、権限不足など）
  AUTH = 'auth',
}

/**
 * APIエラー情報
 */
export interface ApiError {
  type: ApiErrorType;
  message: string;
  details?: Record<string, unknown>;
  statusCode?: number;
}

/**
 * DRFのページネーションリスト形式
 */
export interface DRFPaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  // DRFの拡張メタデータ（オプション）
  status?: string;
  meta?: Record<string, unknown>;
}

/**
 * エラーを判別する
 * @param statusCode HTTPステータスコード
 * @param errorData エラーデータ
 */
const determineErrorType = (statusCode: number, errorData: Record<string, unknown>): ApiErrorType => {
  // 認証エラー
  if (statusCode === 401 || statusCode === 403) {
    return ApiErrorType.AUTH;
  }

  // バックエンドからのエラータイプを確認
  if (errorData && errorData.error_type) {
    if (errorData.error_type === 'user_notification') {
      return ApiErrorType.USER_NOTIFICATION;
    }
  }

  // ユーザー通知に分類されるエラーコード（例: クレジット不足など）
  if (statusCode === 400 && errorData && (
    errorData.code === 'insufficient_credits' ||
    errorData.code === 'insufficient_settings' ||
    errorData.code === 'validation_error'
  )) {
    return ApiErrorType.USER_NOTIFICATION;
  }

  // デフォルトはシステムエラー
  return ApiErrorType.SYSTEM;
};

/**
 * エピソード詳細の型定義
 */
export interface EpisodeDetail {
  id: number;
  act: number;
  episode_number: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  raw_content?: Record<string, unknown>;
}

/**
 * エピソード作成リクエストの型定義
 */
export interface EpisodeCreateRequest {
  title: string;
  content: string;
}

/**
 * エピソード数更新リクエストの型定義
 */
export interface EpisodeCountRequest {
  episode_count: number;
}

/**
 * エピソード番号更新リクエストの型定義
 */
export interface EpisodeNumberUpdateRequest {
  episode_number: number;
}

/**
 * 幕詳細情報の型定義
 */
export interface ActDetail {
  id: number;
  story: number;
  act_number: number;
  title: string;
  overview: string;
  detail: string;
  created_at: string;
  updated_at: string;
}

/**
 * 幕詳細更新リクエストの型定義
 */
export interface ActDetailUpdateRequest {
  title?: string;
  overview?: string;
  detail?: string;
}

/**
 * Dify APIで幕詳細生成リクエストの型定義
 */
export interface ActDetailDifyCreateRequest {
  basic_setting_id: number;
  plot_id: number;
}

/**
 * バックエンドAPIにリクエストを送信する統一関数
 * DRF標準のレスポンス形式に対応
 *
 * @param endpoint - APIエンドポイント
 * @param options - フェッチオプション
 * @returns レスポンス - DRF標準形式のレスポンス（成功時）またはnull（エラー時）
 * @throws ApiError - エラー情報
 */
export const unifiedFetchApi = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  // 開発環境と本番環境で適切なAPIのベースURLを選択
  const apiBaseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8001/api';

  // エンドポイントはそのまま使用（変換せず）
  const url = `${apiBaseUrl}${endpoint}`;

  // リクエスト情報の詳細ログ出力
  console.log(`[UNIFIED-API] リクエスト開始: ${url} - ${new Date().toISOString()}`);
  console.log(`[UNIFIED-API] リクエスト方法: ${options.method || 'GET'}`);

  // ヘッダー情報をログ出力
  if (options.headers) {
    console.log(`[UNIFIED-API] リクエストヘッダー:`, options.headers);
  }

  // ボディ情報をログ出力（POSTやPUTの場合）
  if (options.body) {
    console.log(`[UNIFIED-API] リクエストボディ:`,
      typeof options.body === 'string' ? options.body.substring(0, 500) : options.body);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    console.log(`[UNIFIED-API] レスポンス受信: ステータス ${response.status} - ${new Date().toISOString()}`);

    // 正常なレスポンス
    if (response.ok) {
      // 204 No Contentの場合はnullを返す（特にDELETEリクエスト）
      if (response.status === 204) {
        console.log(`[UNIFIED-API] レスポンス: 204 No Content - ${new Date().toISOString()}`);
        return null as T;
      }

      const data = await response.json();
      console.log(`[UNIFIED-API] レスポンス: ${JSON.stringify(data).substring(0, 200)}... - ${new Date().toISOString()}`);
      // DRF標準形式をそのまま返す
      return data as T;
    }

    // エラーレスポンスの処理
    let errorData: Record<string, unknown> = {};
    let errorMessage = response.statusText;

    try {
      // JSONとしてパースを試みる
      errorData = await response.json();

      // DRF標準のエラーメッセージ形式を処理
      if (errorData.detail) {
        errorMessage = errorData.detail as string;
      } else if (errorData.message) {
        errorMessage = errorData.message as string;
      } else if (errorData.error) {
        errorMessage = errorData.error as string;
      } else if (typeof errorData === 'object' && Object.keys(errorData).length > 0) {
        // バリデーションエラーの場合は最初のフィールドのエラーを表示
        const firstField = Object.keys(errorData)[0];
        const firstError = Array.isArray(errorData[firstField])
          ? (errorData[firstField] as string[])[0]
          : String(errorData[firstField]);
        errorMessage = `${firstField}: ${firstError}`;
      }
    } catch (jsonError) {
      // JSONではない場合はテキストとして読み込む
      try {
        errorMessage = await response.text();
      } catch {
        errorMessage = response.statusText;
      }
    }

    // エラータイプの判別
    const errorType = determineErrorType(response.status, errorData);

    console.error(`[UNIFIED-API] エラー: ${response.status} ${response.statusText}`, errorData || errorMessage);

    // 構造化されたエラーを例外としてスロー
    const apiError: ApiError = {
      type: errorType,
      message: errorMessage,
      details: errorData,
      statusCode: response.status
    };

    throw apiError;

  } catch (error) {
    // すでにApiErrorの場合はそのままスロー
    if (error && typeof error === 'object' && 'type' in error) {
      throw error;
    }

    // ネットワークエラーなどの例外
    console.error(`[UNIFIED-API] 例外発生:`, error);

    // 構造化されたエラーとしてスロー
    throw {
      type: ApiErrorType.SYSTEM,
      message: error instanceof Error ? error.message : '通信エラーが発生しました',
      details: error
    } as ApiError;
  }
};

/**
 * 統一されたエピソードAPI関数群
 * エピソードの作成・取得・更新・削除などの操作を行うAPI関数を提供
 */
export const episodeApi = {
  /**
   * 幕に属する全エピソードの一覧を取得
   *
   * @param storyId - 小説ID
   * @param actId - 幕番号
   * @returns ページネーション形式のエピソード一覧
   * - GET /stories/{story_id}/acts/{act_number}/episodes/
   * - 戻り値: {count, next, previous, results}
   */
  getActEpisodes: (storyId: string | number, actId: string | number): Promise<DRFPaginatedResponse<EpisodeDetail>> =>
    unifiedFetchApi<DRFPaginatedResponse<EpisodeDetail>>(`/stories/${storyId}/acts/${actId}/episodes/`),

  /**
   * ActDetailからエピソード群を生成
   *
   * @param storyId - 小説ID
   * @param actId - 幕番号
   * @param episodeCount - 分割するエピソードの数
   * @returns 生成されたエピソードの一覧
   * - POST /stories/{story_id}/acts/{act_number}/episodes/create/
   * - 戻り値: {count, next, previous, results, status}
   */
  createEpisodes: (
    storyId: string | number,
    actId: string | number,
    episodeCount: number
  ): Promise<DRFPaginatedResponse<EpisodeDetail>> =>
    unifiedFetchApi<DRFPaginatedResponse<EpisodeDetail>>(
      `/stories/${storyId}/acts/${actId}/episodes/create/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ episode_count: episodeCount }),
      }
    ),

  /**
   * 特定のエピソードを取得
   *
   * @param storyId - 小説ID
   * @param actId - 幕番号
   * @param episodeId - エピソードID
   * @returns エピソードの詳細情報
   * - GET /stories/{story_id}/acts/{act_number}/episodes/{pk}/
   * - 戻り値: エピソード情報
   */
  getEpisode: (
    storyId: string | number,
    actId: string | number,
    episodeId: string | number
  ): Promise<EpisodeDetail> =>
    unifiedFetchApi<EpisodeDetail>(`/stories/${storyId}/acts/${actId}/episodes/${episodeId}/`),

  /**
   * エピソードの内容を更新
   *
   * @param storyId - 小説ID
   * @param actId - 幕番号
   * @param episodeId - エピソードID
   * @param data - 更新するデータ（タイトルと内容）
   * @returns 更新されたエピソード情報
   * - PUT /stories/{story_id}/acts/{act_number}/episodes/{pk}/
   * - 戻り値: 更新されたエピソード情報
   */
  updateEpisodeContent: (
    storyId: string | number,
    actId: string | number,
    episodeId: string | number,
    data: EpisodeCreateRequest
  ): Promise<EpisodeDetail> =>
    unifiedFetchApi<EpisodeDetail>(
      `/stories/${storyId}/acts/${actId}/episodes/${episodeId}/`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    ),

  /**
   * エピソードの並び順を変更
   *
   * @param storyId - 小説ID
   * @param actId - 幕番号
   * @param episodeId - エピソードID
   * @param episodeNumber - 新しいエピソード番号
   * @returns 更新後の全エピソード一覧
   * - PUT /stories/{story_id}/acts/{act_number}/episodes/{pk}/
   * - 戻り値: {count, next, previous, results, status}
   */
  updateEpisodeNumber: (
    storyId: string | number,
    actId: string | number,
    episodeId: string | number,
    episodeNumber: number
  ): Promise<DRFPaginatedResponse<EpisodeDetail>> =>
    unifiedFetchApi<DRFPaginatedResponse<EpisodeDetail>>(
      `/stories/${storyId}/acts/${actId}/episodes/${episodeId}/`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ episode_number: episodeNumber }),
      }
    ),

  /**
   * エピソードを削除
   *
   * @param storyId - 小説ID
   * @param actId - 幕番号
   * @param episodeId - エピソードID
   * @returns 削除結果
   * - DELETE /stories/{story_id}/acts/{act_number}/episodes/{pk}/
   * - 戻り値: null
   */
  deleteEpisode: (
    storyId: string | number,
    actId: string | number,
    episodeId: string | number
  ): Promise<null> =>
    unifiedFetchApi<null>(
      `/stories/${storyId}/acts/${actId}/episodes/${episodeId}/`,
      {
        method: 'DELETE',
      }
    ),

  /**
   * 新しいエピソードを作成
   *
   * @param storyId - 小説ID
   * @param actId - 幕番号
   * @param data - 作成するエピソードデータ
   * @returns 作成されたエピソード情報
   * - POST /stories/{story_id}/acts/{act_number}/episodes/
   * - 戻り値: 作成されたエピソード情報
   */
  createNewEpisode: (
    storyId: string | number,
    actId: string | number,
    data: EpisodeCreateRequest
  ): Promise<EpisodeDetail> =>
    unifiedFetchApi<EpisodeDetail>(
      `/stories/${storyId}/acts/${actId}/episodes/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    ),
};

/**
 * 統一されたあらすじ詳細API関数群
 * あらすじ詳細の作成・取得・更新・削除などの操作を行うAPI関数を提供
 */
export const ActDetailApi = {
  /**
   * 幕詳細一覧を取得
   *
   * @param storyId - 小説ID
   * @returns ページネーション形式の幕詳細一覧
   * - GET /stories/{story_id}/acts/
   * - 戻り値: {count, next, previous, results}
   */
  getActDetails: (storyId: string | number): Promise<DRFPaginatedResponse<ActDetail>> =>
    unifiedFetchApi<DRFPaginatedResponse<ActDetail>>(`/stories/${storyId}/acts/`),

  /**
   * 特定の幕詳細を取得
   *
   * @param storyId - 小説ID
   * @param actId - 幕ID
   * @returns 幕詳細情報
   * - GET /stories/{story_id}/acts/{pk}/
   * - 戻り値: 幕詳細情報
   */
  getActDetail: (storyId: string | number, actId: string | number): Promise<ActDetail> =>
    unifiedFetchApi<ActDetail>(`/stories/${storyId}/acts/${actId}/`),

  /**
   * Dify APIを使用して新しい幕詳細を生成
   *
   * @param storyId - 小説ID
   * @param data - 生成に必要なデータ
   * @returns 生成された幕詳細情報
   * - POST /stories/{story_id}/acts/create/
   * - 戻り値: 生成された幕詳細情報
   */
  createActDetailWithDify: (
    storyId: string | number,
    data: ActDetailDifyCreateRequest
  ): Promise<ActDetail> =>
    unifiedFetchApi<ActDetail>(
      `/stories/${storyId}/acts/create/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    ),

  /**
   * 幕詳細を更新
   *
   * @param storyId - 小説ID
   * @param actId - 幕ID
   * @param data - 更新するデータ
   * @returns 更新された幕詳細情報
   * - PUT /stories/{story_id}/acts/{pk}/
   * - 戻り値: 更新された幕詳細情報
   */
  updateActDetail: (
    storyId: string | number,
    actId: string | number,
    data: ActDetailUpdateRequest
  ): Promise<ActDetail> =>
    unifiedFetchApi<ActDetail>(
      `/stories/${storyId}/acts/${actId}/`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    ),
};

/**
 * 統一されたストーリーAPI関数群
 * 小説の作成・取得・更新・削除などの操作を行うAPI関数を提供
 *
 * @remarks
 * バックエンドAPI：/stories/ エンドポイントとその関連操作
 *
 * @param StoryData - APIに送信する小説データの型
 * {
 *   title: string;       // 小説のタイトル（必須）
 *   catchphrase?: string; // キャッチコピー（オプション）
 *   summary?: string;    // 概要（オプション）
 * }
 *
 * @param StoryResponse - APIから返される小説データの型
 * {
 *   id: number;          // 小説ID
 *   title: string;       // タイトル
 *   catchphrase?: string; // キャッチコピー
 *   summary?: string;    // 概要
 *   status: string;      // ステータス（'draft'、'published'など）
 *   created_at: string;  // 作成日時（ISO 8601形式）
 *   updated_at: string;  // 更新日時（ISO 8601形式）
 * }
 */
export const unifiedStoryApi = {
  /**
   * 全ストーリー一覧を取得
   *
   * @returns ページネーション形式の小説一覧
   * - GET /stories/
   * - 戻り値: {count, next, previous, results}
   */
  getStories: () => unifiedFetchApi<DRFPaginatedResponse<Record<string, unknown>>>('/stories/'),

  /**
   * 特定のストーリーを取得
   *
   * @param id - 取得する小説のID
   * @returns 小説の詳細情報
   * - GET /stories/{id}/
   * - 戻り値: StoryResponse
   */
  getStory: (id: string | number) => unifiedFetchApi<Record<string, unknown>>(`/stories/${id}/`),

  /**
   * 新しいストーリーを作成
   *
   * @param data - 作成する小説データ
   * @param data.title - 小説のタイトル（必須）
   * @param data.catchphrase - キャッチコピー（オプション）
   * @param data.summary - 概要（オプション）
   * @returns 作成された小説の情報
   * - POST /stories/
   * - 戻り値: StoryResponse
   */
  createStory: (data: Record<string, unknown>) => unifiedFetchApi<Record<string, unknown>>('/stories/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  /**
   * ストーリーを更新
   *
   * @param id - 更新する小説のID
   * @param data - 更新する小説データ
   * @param data.title - 小説のタイトル（オプション）
   * @param data.catchphrase - キャッチコピー（オプション）
   * @param data.summary - 概要（オプション）
   * @returns 更新された小説の情報
   * - PUT /stories/{id}/
   * - 戻り値: StoryResponse
   */
  updateStory: (id: string | number, data: Record<string, unknown>) => unifiedFetchApi<Record<string, unknown>>(`/stories/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  /**
   * ストーリーを削除
   *
   * @param id - 削除する小説のID
   * @returns 削除結果（通常はnull）
   * - DELETE /stories/{id}/
   * - 戻り値: null
   */
  deleteStory: (id: string | number) => unifiedFetchApi<null>(`/stories/${id}/`, {
    method: 'DELETE',
  }),

  /**
   * 統合設定クリエイターデータを保存
   *
   * @param storyId - 小説ID
   * @param data - 保存するデータ
   * @param data.basic_setting_data - 基本設定データ（必須）
   * @param data.integrated_data - 選択状態データ（オプション）
   * @returns 保存された統合設定クリエイターデータ
   * - POST /stories/{story_id}/integrated-setting-creator/
   * - 戻り値: {success: true, message: string, data: Record<string, unknown>}
   */
  saveIntegratedSettingCreatorData: (storyId: string | number, data: Record<string, unknown>) =>
    unifiedFetchApi<Record<string, unknown>>(`/stories/${storyId}/integrated-setting-creator/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * 統合設定クリエイターデータを取得
   *
   * @param storyId - 小説ID
   * @returns 統合設定クリエイターデータ
   * - GET /stories/{story_id}/integrated-setting-creator/detail/
   * - 戻り値: {success: true, message: string, data: Record<string, unknown>}
   */
  getIntegratedSettingCreatorData: (storyId: string | number) =>
    unifiedFetchApi<Record<string, unknown>>(`/stories/${storyId}/integrated-setting-creator/detail/`, {
      method: 'GET',
    }),

  /**
   * キャラクター詳細を生成
   *
   * @param storyId - 小説ID
   * @param characterId - キャラクターID
   * @returns 生成されたキャラクター詳細情報
   * - POST /stories/{story_id}/characters/create
   * - 戻り値: キャラクター詳細情報
   */
  createCharacterDetail: (storyId: string | number, characterId: number) =>
    unifiedFetchApi<Record<string, unknown>>(`/stories/${storyId}/characters/create/`, {
      method: 'POST',
      body: JSON.stringify({ character_id: characterId }),
    }),

  /**
   * あらすじ詳細を生成
   *
   * @param storyId - 小説ID
   * @param basicSettingId - 基本設定ID
   * @returns 生成されたあらすじ詳細情報（3幕構成）
   * - POST /stories/{story_id}/plot/create
   * - 戻り値: 3幕のあらすじ詳細情報
   */
  createPlotDetail: (storyId: string | number, basicSettingId: number) =>
    unifiedFetchApi<Record<string, unknown>>(`/stories/${storyId}/create-plot-detail/`, {
      method: 'POST',
      body: JSON.stringify({ basic_setting_id: basicSettingId }),
    }),
};

/**
 * エラーを処理する関数
 * コンポーネントから呼び出して適切なUIを表示する
 *
 * @param error APIエラー
 * @param options エラー処理オプション
 */
export const handleApiError = (error: ApiError, options?: {
  onSystemError?: (error: ApiError) => void;
  onUserNotification?: (error: ApiError) => void;
  onAuthError?: (error: ApiError) => void;
}) => {
  if (!error) return;

  switch (error.type) {
    case ApiErrorType.USER_NOTIFICATION:
      // ユーザー通知
      console.log(`[ユーザー通知] ${error.message}`);
      if (options?.onUserNotification) {
        options.onUserNotification(error);
      }
      // ここでToast通知などのUI表示を行う
      break;

    case ApiErrorType.AUTH:
      // 認証エラー
      console.log(`[認証エラー] ${error.message}`);
      if (options?.onAuthError) {
        options.onAuthError(error);
      }
      // ログイン画面へのリダイレクトなど
      break;

    case ApiErrorType.SYSTEM:
    default:
      // システムエラー
      console.error(`[システムエラー] ${error.message}`, error.details);
      if (options?.onSystemError) {
        options.onSystemError(error);
      }
      // エラー画面表示など
      break;
  }
};

// APIクライアント使用例
/*
// コンポーネント内での使用例
const fetchData = async () => {
  try {
    // DRF標準のページネーションレスポンス
    const response = await unifiedStoryApi.getStories();

    // DRF標準形式のデータを直接使用
    const { count, results } = response;
    console.log(`全${count}件のストーリー`);

    // データ処理
    results.forEach(story => {
      console.log(story.title);
    });
  } catch (error) {
    // エラー処理
    handleApiError(error as ApiError, {
      onUserNotification: (error) => {
        // ユーザー通知の表示（例: トースト表示）
        showToast(error.message);
      },
      onSystemError: (error) => {
        // システムエラーの表示
        showErrorModal(error.message);
      }
    });
  }
};
*/

// 以降のAPIクライアント関数は、移行計画に合わせて段階的に実装していきます
