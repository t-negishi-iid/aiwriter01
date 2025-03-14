/**
 * 新規小説作成ページ
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useStoryCreation } from '@/lib/hooks/useStoryCreation';

export default function NewStoryPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const { createStory, isLoading, error, createdStory } = useStoryCreation();

  // 小説作成の処理
  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      return; // タイトルが空の場合は何もしない
    }

    const result = await createStory(title);

    if (result.success && result.data) {
      // 作成成功時、詳細ページへリダイレクト（クエリパラメータ形式）
      router.push(`/stories?id=${result.data.id}`);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">新規小説作成</h1>

      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>新しい小説を作成</CardTitle>
          <CardDescription>
            タイトルを入力して新しい小説プロジェクトを始めましょう
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleCreateStory}>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="title">小説タイトル</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="小説のタイトルを入力"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>エラー</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !title.trim()}
            >
              {isLoading ? '作成中...' : '小説を作成'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="mt-8 text-center text-gray-500 text-sm">
        作成した小説に基本設定、キャラクター、あらすじを追加して物語を発展させましょう
      </div>
    </div>
  );
}
