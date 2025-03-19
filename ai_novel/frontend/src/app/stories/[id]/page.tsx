/**
 * 旧URLパターンから新しいクエリパラメータ形式へのリダイレクトページ
 * /stories/{id} → /stories?id={id} へリダイレクトします
 */
'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';


export default function StoryLegacyPage() {
  const router = useRouter();
  const params = useParams();
  const storyId = params.id;

  // マウント時に新しいURL形式にリダイレクト
  useEffect(() => {
    if (storyId) {
      console.log(`旧URLパターン(/stories/${storyId})が使用されました。新しいURLパターン(/stories?id=${storyId})にリダイレクトします。`);
      router.replace(`/stories?id=${storyId}`);
    }
  }, [storyId, router]);

  // リダイレクト中の表示
  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>リダイレクト中...</p>
        <p className="text-sm text-muted-foreground mt-2">
          新しいURL形式にリダイレクトしています
        </p>
      </div>
    </div>
  );
}
