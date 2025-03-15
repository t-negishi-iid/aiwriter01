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
  // すべてのHooksを最初に宣言
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 小説一覧の取得
  useEffect(() => {
    // IDがある場合は一覧を取得しない
    if (id) return;

    const fetchStories = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await storyApi.getStories();
        console.log('API Response:', response); // レスポンスの形式を確認
        
        // レスポンスの形式に応じて処理
        if (Array.isArray(response)) {
          // レスポンスが直接配列の場合
          setStories(response);
        } else if (response && typeof response === 'object') {
          // DRFの標準ページネーション形式の場合
          if (Array.isArray(response.results)) {
            setStories(response.results);
          } else if (response.data && Array.isArray(response.data)) {
            // 以前の形式（{success: true, data: [...]）の場合
            setStories(response.data);
          } else {
            // その他の形式の場合は空配列を設定
            console.error('Unexpected response format:', response);
            setStories([]);
          }
        } else {
          // レスポンスが無効な場合
          console.error('Invalid response:', response);
          setStories([]);
        }
      } catch (err) {
        setError('小説一覧の取得中にエラーが発生しました');
        console.error('Error fetching stories:', err);
        setStories([]); // エラー時は空配列を設定
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, [id]); // idが変更されたときにも再実行

  // 日付のフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // IDがある場合はストーリー詳細を表示
  if (id) {
    return <StoryContent storyId={id} />;
  }

  // 以下は小説一覧表示のコード
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">小説一覧</h1>
        <Link href="/stories/new">
          <Button>新規作成</Button>
        </Link>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">読み込み中...</span>
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-500">小説がまだありません。新しく作成してみましょう。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <Link href={`/stories?id=${story.id}`} key={story.id}>
              <Card className="h-full cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>{story.title || '無題の小説'}</CardTitle>
                  <CardDescription>
                    ステータス: {story.status || '未設定'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    作成日: {formatDate(story.created_at)}
                  </p>
                  {story.updated_at && (
                    <p className="text-sm text-gray-500">
                      更新日: {formatDate(story.updated_at)}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
