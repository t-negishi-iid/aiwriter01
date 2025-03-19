/**
 * 小説作成用のカスタムフック
 * 統一されたAPIクライアントを使用して小説の作成、更新、削除を行う
 */

import { useState } from 'react';
import { unifiedStoryApi } from '@/lib/unified-api-client';

/**
 * 小説データの型定義
 */
export interface StoryData {
  title: string;
  catchphrase?: string;
  summary?: string;
}

/**
 * APIから返される小説データの型
 */
export interface StoryResponseData {
  id: number;
  title: string;
  catchphrase?: string;
  summary?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * 小説作成・操作のレスポンス型
 */
interface StoryResponse {
  success: boolean;
  data?: StoryResponseData;
  error?: string;
}

/**
 * 小説作成・操作カスタムフック
 * @returns フック関数と状態
 */
export function useStoryCreation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storyData, setStoryData] = useState<StoryResponseData | null>(null);

  /**
   * エラーハンドリング
   */
  const handleError = (error: unknown): string => {
    console.error('小説操作エラー:', error);
    
    if (error && typeof error === 'object' && 'message' in error) {
      return String(error.message);
    }
    
    return '操作中にエラーが発生しました';
  };

  /**
   * 小説を作成する関数
   * @param data 小説データ（タイトル、キャッチコピー、概要）
   * @returns 作成結果
   */
  const createStory = async (data: StoryData): Promise<StoryResponse> => {
    if (!data.title || !data.title.trim()) {
      const errorMsg = 'タイトルが入力されていません';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    try {
      setIsLoading(true);
      setError(null);

      // 統一APIクライアントを使用
      const apiData = {
        title: data.title.trim(),
        ...(data.catchphrase && { catchphrase: data.catchphrase.trim() }),
        ...(data.summary && { summary: data.summary.trim() })
      };
      
      const response = await unifiedStoryApi.createStory(apiData);
      
      const storyResponseData: StoryResponseData = response as StoryResponseData;
      setStoryData(storyResponseData);
      return { success: true, data: storyResponseData };
    } catch (err) {
      const errorMsg = handleError(err);
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 小説を更新する関数
   * @param id 小説ID
   * @param data 更新データ
   * @returns 更新結果
   */
  const updateStory = async (id: string | number, data: Partial<StoryData>): Promise<StoryResponse> => {
    try {
      setIsLoading(true);
      setError(null);

      const apiData = {
        ...(data.title && { title: data.title.trim() }),
        ...(data.catchphrase && { catchphrase: data.catchphrase.trim() }),
        ...(data.summary && { summary: data.summary.trim() })
      };
      
      const response = await unifiedStoryApi.updateStory(id, apiData);
      
      const storyResponseData: StoryResponseData = response as StoryResponseData;
      setStoryData(storyResponseData);
      return { success: true, data: storyResponseData };
    } catch (err) {
      const errorMsg = handleError(err);
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 小説を削除する関数
   * @param id 小説ID
   * @returns 削除結果
   */
  const deleteStory = async (id: string | number): Promise<StoryResponse> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await unifiedStoryApi.deleteStory(id);
      
      setStoryData(null);
      return { success: true };
    } catch (err) {
      const errorMsg = handleError(err);
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createStory,
    updateStory,
    deleteStory,
    isLoading,
    error,
    storyData,
    // リセット用関数
    resetState: () => {
      setError(null);
      setStoryData(null);
    }
  };
}
