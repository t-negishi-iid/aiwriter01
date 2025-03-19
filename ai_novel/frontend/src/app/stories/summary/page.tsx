'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Edit, Trash, Book } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { unifiedStoryApi } from '@/lib/unified-api-client';
import { StoryTabs } from '@/components/story/StoryTabs';
import { StoryProvider } from '@/components/story/StoryProvider';

interface Story {
  id: number;
  title: string;
  catchphrase?: string;
  summary?: string;
  created_at: string;
  updated_at: string;
  status?: string;
}

export default function StorySummaryPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [storyDetail, setStoryDetail] = useState<Story | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [deletingStoryId, setDeletingStoryId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    // idがない場合は一覧ページに戻る
    if (!id) {
      router.push('/stories');
      return;
    }

    const fetchStoryDetail = async () => {
      try {
        setDetailLoading(true);
        // APIからのレスポンス型の定義
        interface ApiResponse {
          id: number;
          title: string;
          catchphrase?: string;
          summary?: string;
          created_at: string;
          updated_at: string;
          status?: string;
        }

        // APIを呼び出してレスポンスを取得（unknownとして扱う）
        const response = await unifiedStoryApi.getStory(id) as unknown;
        console.log('小説詳細データ:', response);

        // レスポンスの型チェック
        const validateStoryResponse = (data: unknown): data is ApiResponse => {
          if (data === null || typeof data !== 'object') return false;

          const obj = data as Record<string, unknown>;
          return 'id' in obj && typeof obj.id === 'number' &&
            'title' in obj && typeof obj.title === 'string' &&
            'created_at' in obj && typeof obj.created_at === 'string' &&
            'updated_at' in obj && typeof obj.updated_at === 'string';
        };

        if (!validateStoryResponse(response)) {
          throw new Error('APIレスポンスの形式が不正です');
        }

        // バリデーション済みのデータをセット
        setStoryDetail({
          id: response.id,
          title: response.title,
          catchphrase: response.catchphrase,
          summary: response.summary,
          created_at: response.created_at,
          updated_at: response.updated_at,
          status: response.status
        });
      } catch (err) {
        console.error('小説詳細の取得に失敗:', err);
        setDetailError('小説詳細の取得に失敗しました');
      } finally {
        setDetailLoading(false);
      }
    };

    fetchStoryDetail();
  }, [id, router]);

  const handleDetailDeleteClick = async () => {
    if (!storyDetail) return;

    // 削除確認
    const confirmDelete = window.confirm(`「${storyDetail.title}」を削除しますか？この操作は元に戻せません。`);
    if (!confirmDelete) return;

    try {
      setDeletingStoryId(storyDetail.id);
      await unifiedStoryApi.deleteStory(storyDetail.id);
      // 削除後、一覧ページに戻る
      router.push('/stories');
    } catch (err) {
      console.error('小説の削除に失敗:', err);
      alert('小説の削除に失敗しました: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setDeletingStoryId(null);
    }
  };

  // idがない場合は何も表示しない（useEffectでリダイレクト処理済み）
  if (!id) {
    return null;
  }

  return (
    <StoryProvider storyId={id}>
      <div className="container mx-auto py-6">
        <StoryTabs storyId={id} activeTab="overview" />

        {detailLoading ? (
          <div className="flex flex-col items-center justify-center h-[30vh]" data-testid="detail-loading-indicator">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">小説情報を読み込み中...</p>
          </div>
        ) : detailError ? (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>エラー</AlertTitle>
            <AlertDescription>{detailError}</AlertDescription>
          </Alert>
        ) : storyDetail ? (
          <div className="mt-6">
            <Card className="overflow-hidden border-none shadow-md">
              <CardHeader className="pb-2">
                {storyDetail.catchphrase && (
                  <CardDescription className="text-sm font-medium text-primary/80 mb-1">
                    {storyDetail.catchphrase.length > 60
                      ? `${storyDetail.catchphrase.substring(0, 60)}...`
                      : storyDetail.catchphrase}
                  </CardDescription>
                )}
                <CardTitle className="text-2xl font-bold mb-3">{storyDetail.title}</CardTitle>
                <div className="space-y-4">
                  {storyDetail.summary ? (
                    <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap bg-muted/30 p-4 rounded-md">
                      {storyDetail.summary}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">概要はありません</p>
                  )}
                </div>
                <div className="flex text-xs text-muted-foreground mt-4 border-t pt-3">
                  <div className="mr-6 flex items-center">
                    <span className="font-medium mr-1">作成:</span>
                    {new Date(storyDetail.created_at).toLocaleDateString('ja-JP')}
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium mr-1">更新:</span>
                    {new Date(storyDetail.updated_at).toLocaleDateString('ja-JP')}
                  </div>
                </div>
              </CardHeader>
              <CardFooter className="flex justify-end py-4 px-6 bg-muted/10 gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-sm font-medium"
                  onClick={() => router.push(`/stories/${storyDetail.id}/edit`)}
                  data-testid="story-detail-edit-button"
                >
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  編集
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="text-sm font-medium"
                  onClick={handleDetailDeleteClick}
                  disabled={deletingStoryId === storyDetail.id}
                  data-testid="story-detail-delete-button"
                >
                  {deletingStoryId === storyDetail.id ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      削除中...
                    </>
                  ) : (
                    <>
                      <Trash className="h-3.5 w-3.5 mr-1.5" />
                      削除
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        ) : (
          <Alert className="mt-4 border-none shadow-sm">
            <AlertTitle>小説が見つかりません</AlertTitle>
            <AlertDescription>指定された小説が見つかりませんでした。</AlertDescription>
          </Alert>
        )}
      </div>
    </StoryProvider>
  );
}
