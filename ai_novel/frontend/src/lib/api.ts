import { storyApi as storyApiClient, basicSettingDataApi as basicSettingDataApiClient, basicSettingApi as basicSettingApiClient, characterApi as characterApiClient, plotApi as plotApiClient, episodeApi as episodeApiClient, titleApi as titleApiClient } from "./api-client"

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
  createBasicSettingData: (storyId: string, data: any) => basicSettingDataApiClient.createBasicSettingData(storyId, data),

  // 基本設定作成用データの詳細を取得
  getBasicSettingData: (storyId: string) => basicSettingDataApiClient.getBasicSettingData(storyId),

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

// 基本設定データ関連のAPI
export const basicSettingDataApi = {
  // 基本設定データを保存
  saveBasicSettingData: (storyId: string, data: any): Promise<any> => {
    console.log(`[TRACE] api.ts: saveBasicSettingData 呼び出し - storyId: ${storyId} - ${new Date().toISOString()}`);
    return basicSettingDataApiClient.saveBasicSettingData(storyId, data);
  },

  // 基本設定データを取得
  getBasicSettingData: (storyId: string): Promise<any> => {
    console.log(`[TRACE] api.ts: getBasicSettingData 呼び出し - storyId: ${storyId} - ${new Date().toISOString()}`);
    console.log('基本設定データを取得中... ストーリーID:', storyId);
    return basicSettingDataApiClient.getBasicSettingData(storyId);
  }
}

// ログ関連のAPI
export const logApi = {
  // ログを取得
  getLogs: (storyId: string) => storyApiClient.getLogs(storyId),
}
