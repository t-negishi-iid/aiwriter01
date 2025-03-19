import { storyApi as storyApiClient, basicSettingDataApi, basicSettingApi as basicSettingApiClient, characterApi as characterApiClient, plotApi as plotApiClient, episodeApi as episodeApiClient, titleApi as titleApiClient, integratedSettingCreatorApi as integratedSettingCreatorApiClient } from "./api-client"

// 小説関連のAPI
export const storyApi = {
  // 小説一覧を取得
  getStories: () => storyApiClient.getStories(),

  // 小説の詳細を取得
  getStory: (id: string) => storyApiClient.getStory(id),

  // 新しい小説を作成
  createStory: (data: any) => storyApiClient.createStory(data),

  // 小説を更新
  updateStory: (id: string, data: any) => storyApiClient.updateStory(id, data),

  // 小説を削除
  deleteStory: (id: string) => storyApiClient.deleteStory(id),
}

// 基本設定関連のAPI
export const basicSettingApi = {
  // 基本設定作成用データを生成
  createBasicSettingData: (storyId: string, data: any) => basicSettingDataApi.createBasicSettingData(storyId, data),

  // 基本設定作成用データの詳細を取得
  getBasicSettingData: (storyId: string) => basicSettingDataApi.getBasicSettingData(storyId),

  // 基本設定を生成
  generateBasicSetting: (storyId: string, basicSettingDataId: number) =>
    basicSettingApiClient.generateBasicSetting(storyId, basicSettingDataId),

  // 基本設定の詳細を取得
  getBasicSetting: (storyId: string) => basicSettingApiClient.getBasicSetting(storyId),
}

// キャラクター関連のAPI
export const characterApi = {
  // キャラクター一覧を取得
  getCharacters: (storyId: string) => characterApiClient.getCharacters(storyId),

  // キャラクターの詳細を取得
  getCharacter: (storyId: string, characterId: string) => characterApiClient.getCharacter(storyId, characterId),

  // キャラクターを生成
  createCharacters: (storyId: string) => characterApiClient.createCharacters(storyId),
}

// プロット関連のAPI
export const plotApi = {
  // プロットを生成
  createPlot: (storyId: string) => plotApiClient.createPlot(storyId),

  // プロットの詳細を取得
  getPlot: (storyId: string) => plotApiClient.getPlot(storyId),
}

// エピソード関連のAPI
export const episodeApi = {
  // エピソード一覧を取得
  getEpisodes: (storyId: string) => episodeApiClient.getEpisodes(storyId),

  // エピソードの詳細を取得
  getEpisode: (storyId: string, episodeId: string) => episodeApiClient.getEpisode(storyId, episodeId),

  // エピソードを生成
  createEpisodes: (storyId: string) => episodeApiClient.createEpisodes(storyId),

  // エピソードの内容を生成
  createEpisodeContent: (storyId: string, episodeId: string) => episodeApiClient.createEpisodeContent(storyId, episodeId),

  // エピソードの内容を取得
  getEpisodeContent: (episodeId: string) => episodeApiClient.getEpisodeContent(episodeId),
}

// タイトル関連のAPI
export const titleApi = {
  // タイトルを生成
  createTitle: (storyId: string) => titleApiClient.createTitle(storyId),

  // タイトルを取得
  getTitle: (storyId: string) => titleApiClient.getTitle(storyId),
}

// 統合設定クリエイター関連のAPI
export const integratedSettingCreatorApi = {
  // 統合設定クリエイターデータを保存
  saveIntegratedSettingData: (storyId: string, data: any): Promise<any> => {
    console.log(`[TRACE] api.ts: saveIntegratedSettingData 呼び出し - storyId: ${storyId} - ${new Date().toISOString()}`);
    return integratedSettingCreatorApiClient.saveIntegratedSettingData(storyId, data);
  },

  // 統合設定クリエイターデータを取得
  getIntegratedSettingData: (storyId: string): Promise<any> => {
    console.log(`[TRACE] api.ts: getIntegratedSettingData 呼び出し - storyId: ${storyId} - ${new Date().toISOString()}`);
    console.log('統合設定クリエイターデータを取得中... ストーリーID:', storyId);
    return integratedSettingCreatorApiClient.getIntegratedSettingData(storyId);
  }
}

// ログ関連のAPI
export const logApi = {
  // ログを取得
  getLogs: (storyId: string) => storyApiClient.getLogs(storyId),
}
