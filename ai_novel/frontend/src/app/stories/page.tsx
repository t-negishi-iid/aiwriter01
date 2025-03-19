'use client';
// /stories
// 小説一覧ペーシ
// /stories?id={story_}
// 小説詳細ページ　概要タブ

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PlusCircle, Loader2, Edit, Eye, Trash } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { unifiedStoryApi } from '@/lib/unified-api-client';

interface Story {
  id: number;
  title: string;
  catchphrase?: string;
  summary?: string;
  created_at: string;
  updated_at: string;
  status?: string;
}

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingStoryId, setDeletingStoryId] = useState<number | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  useEffect(() => {
    // クエリパラメータ id がある場合は、新しいURL形式にリダイレクト
    if (id) {
      router.replace(`/stories/summary?id=${id}`);
      return;
    }

    const fetchStories = async () => {
      try {
        setIsLoading(true);
        // APIからのレスポンス型の定義
        interface StoryItem {
          id: number;
          title: string;
          catchphrase?: string;
          summary?: string;
          created_at: string;
          updated_at: string;
          status?: string;
        }
        
        interface ApiResponse {
          results: StoryItem[];
          count: number;
          next: string | null;
          previous: string | null;
        }
        
        // APIを呼び出してレスポンスを取得（unknownとして扱う）
        const response = await unifiedStoryApi.getStories() as unknown;
        console.log('小説一覧データ:', response);
        
        // レスポンスの型チェック
        const validateStoriesResponse = (data: unknown): data is ApiResponse => {
          if (data === null || typeof data !== 'object') return false;
          
          const obj = data as Record<string, unknown>;
          return 'results' in obj && Array.isArray(obj.results);
        };
        
        if (!validateStoriesResponse(response)) {
          throw new Error('APIレスポンスの形式が不正です');
        }
        
        // バリデーション済みのデータをセット
        setStories(response.results.map((item) => ({
          id: item.id,
          title: item.title,
          catchphrase: item.catchphrase,
          summary: item.summary,
          created_at: item.created_at,
          updated_at: item.updated_at,
          status: item.status
        })));
        
      } catch (err) {
        console.error('小説一覧の取得に失敗:', err);
        setError('小説一覧の取得に失敗しました');
        setStories([]); // エラー時は空配列を設定
      } finally {
        setIsLoading(false);
      }
    };
    
    // IDがない場合のみ小説一覧を取得
    if (!id) {
      fetchStories();
    }
  }, [id, router]);

  const handleCreateNewStory = () => {
    router.push('/stories/new');
  };

  const handleDeleteClick = (story: Story) => {
    console.log('Delete clicked for story:', story);

    // ここにダイアログの起動テストを実装
    // TODO: Dialogの起動テストを実装

    // 標準JSのconfirmを使用する
    const confirmDelete = window.confirm(`「${story.title}」を削除しますか？この操作は元に戻せません。`);

    if (confirmDelete) {
      // 削除を実行
      deleteStory(story);
    }
  };

  const deleteStory = async (story: Story) => {
    try {
      setDeletingStoryId(story.id);
      console.log('削除開始:', story.id);
      await unifiedStoryApi.deleteStory(story.id);
      console.log('削除API呼び出し完了');

      // 削除後、リストから該当の小説を除外
      setStories(prev => prev.filter(s => s.id !== story.id));

      // 成功メッセージを削除
    } catch (err) {
      console.error('Failed to delete story:', err);
      setError('小説の削除に失敗しました');
      alert('小説の削除に失敗しました: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setDeletingStoryId(null);
    }
  };

  // 詳細ページが表示されるべき場合
  if (id) {
    return null; // リダイレクト処理済み
  }

  // ローディング中の表示
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]" data-testid="loading-indicator">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">小説一覧を読み込み中...</p>
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className="container mx-auto p-4" data-testid="error-message">
        <Alert variant="destructive">
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex justify-center mt-4">
          <Button onClick={() => window.location.reload()} data-testid="reload-button">
            ページを再読み込み
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4" data-testid="stories-page">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">小説一覧</h1>
        <Button onClick={handleCreateNewStory} data-testid="create-story-button">
          <PlusCircle className="h-4 w-4 mr-2" />
          新規作成
        </Button>
      </div>

      {stories.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-muted/50" data-testid="empty-state">
          <p className="text-lg text-muted-foreground mb-4">小説がまだありません</p>
          <Button onClick={handleCreateNewStory} variant="secondary" data-testid="empty-create-button">
            <PlusCircle className="h-4 w-4 mr-2" />
            小説を作成する
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="stories-grid">
          {stories.map((story) => (
            <Card key={story.id} className="flex flex-col" data-testid={`story-card-${story.id}`}>
              <CardHeader>
                <CardTitle className="line-clamp-2">{story.title}</CardTitle>
                {story.catchphrase && (
                  <CardDescription className="line-clamp-2">
                    {story.catchphrase}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-grow">
                {story.summary && (
                  <p className="text-sm line-clamp-3 text-muted-foreground">
                    {story.summary}
                  </p>
                )}
                <div className="mt-2 text-xs text-muted-foreground">
                  作成: {new Date(story.created_at).toLocaleString('ja-JP')}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2 border-t">
                <div className="flex gap-2 w-full justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/stories/summary?id=${story.id}`)}
                    data-testid={`story-${story.id}-detail-button`}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    詳細
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/stories/${story.id}/edit`)}
                    data-testid={`edit-story-${story.id}`}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    編集
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(story)}
                    disabled={deletingStoryId === story.id}
                    data-testid="delete-button"
                  >
                    {deletingStoryId === story.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        削除中...
                      </>
                    ) : (
                      <>
                        <Trash className="h-4 w-4 mr-2" />
                        削除
                      </>
                    )}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
