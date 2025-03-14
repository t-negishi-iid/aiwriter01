/**
 * 小説一覧・詳細ページ
 * クエリパラメータでの表示に対応
 * - /stories - 一覧表示
 * - /stories?id=123 - ID指定の詳細表示
 */
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { storyApi } from '@/lib/api-client';
import { StoryContent } from './content';

interface Story {
  id: number;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function StoriesPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  // IDがある場合はストーリー詳細を表示
  if (id) {
    return <StoryContent storyId={id} />;
  }

  // 以下は小説一覧表示のコード
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 小説一覧の取得
  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await storyApi.getStories();

        if (response.success && response.data) {
          setStories(response.data as Story[]);
        } else {
          setError(response.message || '小説一覧の取得に失敗しました');
        }
      } catch (err) {
        setError('小説一覧の取得中にエラーが発生しました');
        console.error('Error fetching stories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  // 日付のフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">小説一覧</h1>
        <Link href="/stories/new">
          <Button>新しい小説を作成</Button>
        </Link>
      </div>

      {/* エラーメッセージ */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ローディング表示 */}
      {loading && (
        <div className="flex justify-center py-12" data-testid="loading-indicator">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">読み込み中...</span>
        </div>
      )}

      {/* 小説一覧 */}
      {!loading && !error && (
        <div data-testid="stories-list" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stories.length > 0 ? (
            stories.map((story) => (
              <Card key={story.id} className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="line-clamp-2">{story.title}</CardTitle>
                  <CardDescription>
                    作成日: {formatDate(story.created_at)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs ${story.status === 'published'
                      ? 'bg-green-200 text-green-800'
                      : 'bg-yellow-200 text-yellow-800'
                      }`}>
                      {story.status === 'published' ? '公開中' : '下書き'}
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/stories?id=${story.id}`} className="w-full">
                    <Button variant="outline" className="w-full">詳細を見る</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">まだ小説がありません。「新しい小説を作成」ボタンから作成してください。</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
