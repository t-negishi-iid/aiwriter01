'use client';
// /stories
// 小説一覧ペーシ
// /stories?id={story_}
// 小説詳細ページ　概要タブ

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PlusCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

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
import { storyApi } from '@/lib/api-client';
import { Card as StoryCard, CardHeader as StoryCardHeader, CardTitle as StoryCardTitle, CardDescription as StoryCardDescription, CardContent as StoryCardContent } from '@/components/ui/card';
import { StoryTabs } from '@/components/story/StoryTabs';

interface Story {
  id: number;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  useEffect(() => {
    const fetchStories = async () => {
      try {
        setIsLoading(true);
        const response = await storyApi.getStories();

        // APIレスポンスの形式に応じて処理
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

  const handleCreateStory = async () => {
    try {
      setIsLoading(true);
      // 現在の日時を取得して「小説:YYYY/MM/DD HH:MM」形式のタイトルを生成
      const now = new Date();
      const formattedDate = format(now, 'yyyy/MM/dd HH:mm', { locale: ja });
      const storyTitle = `小説:${formattedDate}`;
      
      const newStory = await storyApi.createStory({
        title: storyTitle,
        description: '説明を入力してください',
      });
      router.push(`/stories/new`);
    } catch (err) {
      console.error('Failed to create story:', err);
      setError('小説の作成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // IDがある場合は概要ページを表示
  if (id) {
    return (
      <div className="container mx-auto py-10">
        <div className="mb-8">
          <Link
            href="/stories"
            className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            小説一覧に戻る
          </Link>
          <h1 className="text-3xl font-bold">小説詳細</h1>
        </div>

        <StoryTabs storyId={id} activeTab="overview" />

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>概要</CardTitle>
            <CardDescription>小説の概要情報</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 概要の内容はここに追加予定 */}
          </CardContent>
        </Card>
      </div>
    );
  }

  // 以下は小説一覧表示のコード
  return (
    <div className="container mx-auto py-10" onKeyDown={(e) => {
      // Enterキーが押された時にデフォルトの送信動作を防止
      if (e.key === 'Enter') {
        e.preventDefault();
      }
    }}>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">小説一覧</h1>
        <Button 
          type="button" 
          onClick={handleCreateStory} 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              作成中...
            </>
          ) : (
            <>
              <PlusCircle className="mr-2 h-4 w-4" />
              新しい小説を作成
            </>
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>エラーが発生しました</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">読み込み中...</span>
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">小説がありません</p>
          <Button onClick={handleCreateStory}>
            <PlusCircle className="mr-2 h-4 w-4" />
            新しい小説を作成
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <Card key={story.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">{story.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {story.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  作成日:{' '}
                  {format(new Date(story.created_at), 'yyyy年MM月dd日', {
                    locale: ja,
                  })}
                </p>
              </CardContent>
              <CardFooter className="bg-muted/50 pt-4">
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => router.push(getStoryUrl(story.id.toString()))}
                >
                  詳細を見る
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// URLパターンは新しいクエリパラメータ形式に変更
const getStoryUrl = (id: string) => `/stories?id=${id}`;
