'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { StoryForm } from '@/components/forms/story-form';
import { unifiedStoryApi } from '@/lib/unified-api-client';
import { useStoryCreation } from '@/lib/hooks/useStoryCreation';
import { Button } from '@/components/ui/button';

interface StoryData {
  id: number;
  title: string;
  catchphrase?: string;
  summary?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export default function EditStoryPage() {
  const router = useRouter();
  const params = useParams();
  const storyId = params.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const { updateStory } = useStoryCreation();

  useEffect(() => {
    const fetchStory = async () => {
      if (!storyId) return;

      try {
        setIsLoading(true);
        const response = await unifiedStoryApi.getStory(storyId);

        if (response && typeof response === 'object') {
          // 正しい型に変換
          const story: StoryData = {
            id: Number(response.id),
            title: String(response.title || ''),
            catchphrase: response.catchphrase ? String(response.catchphrase) : undefined,
            summary: response.summary ? String(response.summary) : undefined,
            status: response.status ? String(response.status) : undefined,
            created_at: response.created_at ? String(response.created_at) : undefined,
            updated_at: response.updated_at ? String(response.updated_at) : undefined
          };

          setStoryData(story);
          setError(null);
        } else {
          setError('小説データの取得に失敗しました');
        }
      } catch (err) {
        console.error('Failed to fetch story:', err);
        setError('小説データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStory();
  }, [storyId]);

  const handleUpdateStory = async (data: { title: string; catchphrase?: string; summary?: string }) => {
    if (!storyId) return false;

    try {
      const result = await updateStory(storyId, data);

      if (result.success) {
        router.push(`/stories/${storyId}`);
        return true;
      } else {
        setError(result.error || '小説の更新に失敗しました');
        return false;
      }
    } catch (err) {
      console.error('Failed to update story:', err);
      setError('小説の更新に失敗しました');
      return false;
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]" data-testid="loading-indicator">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">小説データを読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4" data-testid="error-message">
        <Alert variant="destructive">
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex justify-center mt-4">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            data-testid="back-button"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4" data-testid="edit-story-page">
      <h1 className="text-2xl font-bold mb-6">小説の編集</h1>

      {storyData && (
        <StoryForm
          defaultValues={{
            id: storyData.id,
            title: storyData.title,
            catchphrase: storyData.catchphrase || '',
            summary: storyData.summary || ''
          }}
          onSubmit={handleUpdateStory}
          cancelButton={
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              data-testid="cancel-button"
            >
              キャンセル
            </Button>
          }
          submitButtonText="更新する"
          data-testid="story-form"
        />
      )}
    </div>
  );
}
