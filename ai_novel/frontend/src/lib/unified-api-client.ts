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

  /**
   * 小説全体のタイトルを生成
   *
   * @param storyId - 小説ID
   * @returns 生成されたタイトル情報
   * - POST /stories/{story_id}/generate-novel-title/
   * - 戻り値: {title: string, credit_cost: number}
   */
  generateNovelTitle: (storyId: string | number) => unifiedFetchApi<{title: string, credit_cost: number}>(`/stories/${storyId}/generate-novel-title/`, {
    method: 'POST',
    body: JSON.stringify({ story_id: storyId }),
  }),

  /**
   * タイトルまたはキャッチコピーを生成
   *
   * @param storyId - 小説ID
   * @param data - 生成パラメータ
   * @param data.basic_setting - 基本設定
   * @param data.target_content - 対象コンテンツ
   * @param data.title_type - タイプ（"タイトル" または "キャッチコピー"）
   * @returns 生成されたタイトル/キャッチコピーの候補リスト
   * - POST /stories/{story_id}/generate-title/
   * - 戻り値: {titles: string, credit_cost: number}
   */
  generateTitleOrCatchphrase: (
    storyId: string | number,
    data: {
      basic_setting: string,
      target_content: string,
      title_type: "タイトル" | "キャッチコピー"
    }
  ) => unifiedFetchApi<Record<string, unknown>>(`/stories/${storyId}/generate-title/`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  /**
   * コンテンツのサマリーを生成
   *
   * @param storyId - 小説ID
   * @param data - 生成パラメータ
   * @param data.target_content - 要約対象のコンテンツ
   * @param data.word_count - 要約の単語数
   * @returns 生成されたサマリー
   * - POST /stories/{story_id}/generate-summary/
   * - 戻り値: {summary: string, credit_cost: number}
   */
  generateSummary: (
    storyId: string | number,
    data: {
      target_content: string,
      word_count: number
    }
  ) => unifiedFetchApi<Record<string, unknown>>(`/stories/${storyId}/generate-summary/`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};
