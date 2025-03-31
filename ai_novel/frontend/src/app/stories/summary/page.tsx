'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Blocks, Loader2, Captions } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
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
                <CardTitle>
                  <Blocks className="h-4 w-4 mr-2" />
                  小説の概要
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold y-m-10">
                  タイトル：「{storyDetail.title}」
                </div>
                {storyDetail.catchphrase ? (
                  <div className="text-sm font-medium text-primary/80 y-m-10">
                    キャッチフレーズ：{storyDetail.catchphrase.length > 60
                      ? `${storyDetail.catchphrase.substring(0, 60)}...`
                      : storyDetail.catchphrase}
                  </div>
                ) : (
                  <div className="text-sm font-medium text-primary/80 y-m-10">
                    キャッチフレーズ：未設定
                  </div>
                )}
                <div className="space-y-4 y-m-10 mt-4">
                  {storyDetail.summary ? (
                    <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap bg-muted/30 p-4 rounded-md">
                      サマリー：{storyDetail.summary}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      サマリー：未設定
                    </p>
                  )}
                </div>
                <div className="space-y-4 y-m-10 mt-4">
                  <div className="mr-6 flex items-center">
                    <span className="font-sm mr-2">作成:</span>
                    {new Date(storyDetail.created_at).toLocaleDateString('ja-JP')}
                    <span className="font-sm mr-2">&nbsp;|&nbsp;</span>
                    <span className="font-sm mr-2">更新:</span>
                    {new Date(storyDetail.updated_at).toLocaleDateString('ja-JP')}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end py-4 px-6 bg-muted/10 gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-sm font-medium x-r-5"
                  onClick={() => router.push(`/stories/${storyDetail.id}/edit`)}
                  data-testid="story-detail-edit-button"
                >
                  <Captions className="h-4 w-4 mr-2" />
                  タイトル、キャッチ、サマリー修正
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>
                  <Blocks className="h-4 w-4 mr-2" />
                  小説の組み立て方
                </CardTitle>
                <CardDescription>AIブロック小説エディタを使った小説の「組み立て方」の説明です。</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h4>積み木やブロックを組むように小説を書く</h4>
                  <p>「AIブロック小説エディタ」では、積み木やブロックのように、必要なブロックを組み合わせることで、誰でも小説を執筆できます。</p>
                  <p>書きたい小説の要素を組み合わせて「基本設定」を作成し、そこから必要な要素（ブロック）をエディタの手助けを借りて少しずつ組み上げていきます。</p>
                </div>
                <div className="space-y-4">
                  <h4>3幕構成</h4>
                  <p>「AIブロック小説エディタ」では、3幕構成で小説を書きます。3幕構成は、映画脚本などで一般的に使われる物語の構造を作る手法です。</p>
                  <p>3幕構成は、出会いと事件が起きる1幕、新たな展開で物語に変化と奥行きを与える2幕、クライマックを経て物語を締めくくる3幕の構造です。</p>
                </div>
                <div className="y-m-10 mt-4">
                  <h4>小説を組み立てる6つのステップ</h4>
                  <ol>
                    <li>基本設定</li>
                    <li>作品設定</li>
                    <li>人物設定</li>
                    <li>あらすじ詳細化</li>
                    <li>エピソードに分割</li>
                    <li>本文執筆</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Alert className="mt-4 border-none shadow-sm">
            <AlertTitle>小説が見つかりません</AlertTitle>
            <AlertDescription>指定された小説が見つかりませんでした。</AlertDescription>
          </Alert>
        )}
      </div>
    </StoryProvider >
  );
}
