'use client';
// /stories
// 小説一覧ペーシ
// /stories?id={story_}
// 小説詳細ページ　概要タブ

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PlusCircle, Loader2, Edit, Trash } from 'lucide-react';

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
import { Card as StoryCard, CardHeader as StoryCardHeader, CardTitle as StoryCardTitle, CardDescription as StoryCardDescription, CardContent as StoryCardContent } from '@/components/ui/card';
import { StoryTabs } from '@/components/story/StoryTabs';

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
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  useEffect(() => {
    const fetchStories = async () => {
      try {
        setIsLoading(true);
        const response = await unifiedStoryApi.getStories();

        // APIレスポンスの形式に応じて処理
        if (response && typeof response === 'object') {
          // DRFの標準ページネーション形式の場合
          if (Array.isArray(response.results)) {
            // 型変換して設定
            setStories(response.results.map(item => ({
              id: Number(item.id),
              title: String(item.title || ''),
              catchphrase: item.catchphrase ? String(item.catchphrase) : undefined,
              summary: item.summary ? String(item.summary) : undefined,
              created_at: String(item.created_at || new Date().toISOString()),
              updated_at: String(item.updated_at || new Date().toISOString()),
              status: item.status ? String(item.status) : undefined
            })));
          } else {
            // 予期しない形式の場合は空配列を設定
            console.error('Unexpected response format:', response);
            setStories([]);
          }
        } else {
          // レスポンスが無効な場合
          console.error('Invalid response:', response);
          setStories([]);
        }

        setError(null);
      } catch (err) {
        console.error('Failed to fetch stories:', err);
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
  }, [id]);

  const handleCreateNewStory = () => {
    router.push('/stories/new');
  };

  const handleDeleteClick = (story: Story) => {
    console.log('Delete clicked for story:', story);
    
    // 標準JSのconfirmを使用する
    const confirmDelete = window.confirm(`「${story.title}」を削除しますか？この操作は元に戻せません。`);
    
    if (confirmDelete) {
      // 削除を実行
      deleteStory(story);
    }
  };

  const deleteStory = async (story: Story) => {
    try {
      setIsDeleting(true);
      await unifiedStoryApi.deleteStory(story.id);
      
      // 削除後、リストから該当の小説を除外
      setStories(prev => prev.filter(s => s.id !== story.id));
      
      // 成功メッセージ
      alert('小説を削除しました');
    } catch (err) {
      console.error('Failed to delete story:', err);
      setError('小説の削除に失敗しました');
      alert('小説の削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  // 詳細ページが表示されるべき場合
  if (id) {
    return (
      <div>
        <StoryTabs storyId={id} activeTab="overview" />
      </div>
    );
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
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  data-testid={`view-story-${story.id}`}
                >
                  <Link href={`/stories/${story.id}`}>詳細</Link>
                </Button>
                <div className="flex gap-2">
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
                    onClick={() => handleDeleteClick(story)}
                    disabled={isDeleting}
                    data-testid="delete-button"
                  >
                    {isDeleting ? (
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
