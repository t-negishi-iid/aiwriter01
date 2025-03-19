/**
 * 小説作成用のカスタムフック
 * テストスクリプトtest_stories_new.tsと同様のロジックをReactで使用できるようにしたもの
 */

import { useState } from 'react';

/**
 * 小説作成のレスポンス型
 */
interface StoryCreationResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * 小説作成カスタムフック
 * @returns フック関数と状態
 */
export function useStoryCreation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdStory, setCreatedStory] = useState<any | null>(null);

  /**
   * 小説を作成する関数
   * @param title 小説のタイトル
   * @returns 作成結果
   */
  const createStory = async (title: string): Promise<StoryCreationResponse> => {
    if (!title.trim()) {
      setError('タイトルが入力されていません');
      return { success: false, error: 'タイトルが入力されていません' };
    }

    try {
      setIsLoading(true);
      setError(null);

      // APIリクエスト - クエリパラメータ形式に変更
      const response = await fetch('/api/stories?action=create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });

      // レスポンスをJSON形式で取得
      const data = await response.json();

      // APIの成功/失敗を確認
      if (response.ok) {
        setCreatedStory(data);
        return { success: true, data };
      } else {
        const errorMessage = data.error || data.detail || '不明なエラー';
        setError(errorMessage);
        return { success: false, error: errorMessage, data };
      }
    } catch (error) {
      // ネットワークエラーなどの例外処理
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createStory,
    isLoading,
    error,
    createdStory,
    // リセット用関数
    resetState: () => {
      setError(null);
      setCreatedStory(null);
    }
  };
}
