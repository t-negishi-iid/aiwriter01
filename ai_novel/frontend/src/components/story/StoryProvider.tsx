'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { storyApi, integratedSettingCreatorApi } from '@/lib/api';
import { Story } from '@/types/story';

interface StoryProviderProps {
  children: ReactNode;
  storyId: string;
}

export function StoryProvider({ children, storyId }: StoryProviderProps) {
  const [story, setStory] = useState<Story | null>(null);
  const [basicSettingData, setBasicSettingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 小説情報の取得
        const storyData = await storyApi.getStory(storyId);
        setStory(storyData);
      } catch (err) {
        setError('小説情報の取得に失敗しました');
        console.error("小説情報取得エラー:", err);
      }

      // 統合設定クリエイターデータ（基本設定）の取得
      try {
        const integratedData = await integratedSettingCreatorApi.getIntegratedSettingData(storyId);
        console.log("統合設定クリエイターデータの取得結果:", JSON.stringify(integratedData, null, 2));
        
        if (integratedData.success) {
          if (integratedData && integratedData.results && integratedData.results.basic_setting_data) {
            setBasicSettingData(integratedData.results.basic_setting_data);
          }
        }
      } catch (err) {
        console.error("統合設定クリエイターデータ取得エラー:", err);
      }

      setIsLoading(false);
    };

    if (storyId) {
      fetchData();
    } else {
      setIsLoading(false);
      setError('小説IDが指定されていません');
    }
  }, [storyId]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">読み込み中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <Link
          href="/stories"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          小説一覧に戻る
        </Link>
        <h1 className="text-3xl font-bold">{story?.title || "無題の小説"}</h1>
        <p className="text-muted-foreground mt-2">
          {story?.description || "説明はありません"}
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>エラーが発生しました</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {children}
    </div>
  );
}

export function useStoryContext() {
  return {
    story: null,
    basicSettingData: null,
    isLoading: false,
    error: null
  };
}
