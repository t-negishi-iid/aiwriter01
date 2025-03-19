/**
 * 新規小説作成ページ
 */
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { StoryForm } from '@/components/forms/story-form';
import { useStoryCreation, StoryData } from '@/lib/hooks/useStoryCreation';

export default function NewStoryPage() {
  const router = useRouter();
  const { createStory, isLoading, error } = useStoryCreation();

  // 小説作成の処理
  const handleCreateStory = async (data: StoryData) => {
    if (!data.title.trim()) {
      return false;
    }

    const result = await createStory(data);

    if (result.success && result.data) {
      // 作成成功時、詳細ページへリダイレクト
      router.push(`/stories/${result.data.id}`);
      return true;
    }
    
    return false;
  };

  return (
    <div className="container mx-auto py-8" data-testid="new-story-page">
      <h1 className="text-3xl font-bold mb-6">新規小説作成</h1>

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>新しい小説を作成</CardTitle>
          <CardDescription>
            タイトル、キャッチコピー、概要を入力して新しい小説プロジェクトを始めましょう
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6" data-testid="error-alert">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>エラー</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <StoryForm 
            onSubmit={handleCreateStory}
            isSubmitting={isLoading}
            submitButtonText="小説を作成"
            cancelButton={
              <button
                type="button"
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                onClick={() => router.back()}
                disabled={isLoading}
                data-testid="cancel-button"
              >
                キャンセル
              </button>
            }
            data-testid="create-story-form"
          />
        </CardContent>
      </Card>

      <div className="mt-8 text-center text-gray-500 text-sm">
        作成した小説に基本設定、キャラクター、あらすじを追加して物語を発展させましょう
      </div>
    </div>
  );
}
