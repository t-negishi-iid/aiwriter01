import { unifiedStoryApi, contentApi, episodeApi, ActDetailApi } from '@/lib/unified-api-client';

// 小説一覧を取得する
export async function getStories() {
  try {
    const response = await unifiedStoryApi.getStories();
    return response;
  } catch (error) {
    console.error('小説一覧の取得に失敗しました:', error);
    throw error;
  }
}

// 小説の詳細を取得する
export async function getStoryDetail(storyId: number) {
  try {
    const response = await unifiedStoryApi.getStory(storyId);
    return response;
  } catch (error) {
    console.error(`小説の詳細取得に失敗しました (ID: ${storyId}):`, error);
    throw error;
  }
}

// 小説の各幕（Act）の一覧を取得する
export async function getActs(storyId: number) {
  try {
    const response = await ActDetailApi.getActDetails(storyId);
    return response;
  } catch (error) {
    console.error(`幕の一覧取得に失敗しました (Story ID: ${storyId}):`, error);
    throw error;
  }
}

// 幕のエピソード一覧を取得する
export async function getEpisodes(storyId: number, actNumber: number) {
  try {
    const response = await episodeApi.getActEpisodes(storyId, actNumber);
    return response;
  } catch (error) {
    console.error(`エピソード一覧の取得に失敗しました (Story ID: ${storyId}, Act: ${actNumber}):`, error);
    throw error;
  }
}

// エピソード本文を取得する
export async function getEpisodeContent(storyId: number, actNumber: number, episodeNumber: number) {
  try {
    const response = await contentApi.getEpisodeContent(storyId, actNumber, episodeNumber);
    return response;
  } catch (error) {
    console.error(`エピソード本文の取得に失敗しました (Story ID: ${storyId}, Act: ${actNumber}, Episode: ${episodeNumber}):`, error);
    throw error;
  }
}
