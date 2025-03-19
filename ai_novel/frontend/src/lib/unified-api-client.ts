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
 * エラータイプを判別する
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
    } catch (e) {
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

/**
 * 統一されたストーリーAPI関数群
 * 既存のstoryApiと同じインターフェースを維持しつつ、新しいfetch関数を使用
 */
export const unifiedStoryApi = {
  /**
   * 全ストーリー一覧を取得
   */
  getStories: () => unifiedFetchApi<DRFPaginatedResponse<Record<string, unknown>>>('/stories/'),

  /**
   * 特定のストーリーを取得
   */
  getStory: (id: string | number) => unifiedFetchApi<Record<string, unknown>>(`/stories/${id}/`),

  /**
   * 新しいストーリーを作成
   */
  createStory: (data: Record<string, unknown>) => unifiedFetchApi<Record<string, unknown>>('/stories/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  /**
   * ストーリーを更新
   */
  updateStory: (id: string | number, data: Record<string, unknown>) => unifiedFetchApi<Record<string, unknown>>(`/stories/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  /**
   * ストーリーを削除
   */
  deleteStory: (id: string | number) => unifiedFetchApi<null>(`/stories/${id}/`, {
    method: 'DELETE',
  }),
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
