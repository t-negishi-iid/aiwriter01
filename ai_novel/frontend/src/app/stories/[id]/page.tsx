/**
 * 旧URLパターンから新しいクエリパラメータ形式へのリダイレクトページ
 * /stories/{id} → /stories?id={id} へリダイレクトします
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface StoryLegacyPageProps {
  params: {
    id: string;
  };
}

export default function StoryLegacyPage({ params }: StoryLegacyPageProps) {
  const router = useRouter();
  const { id } = params;

  // マウント時に新しいURL形式にリダイレクト
  useEffect(() => {
    if (id) {
      console.log(`旧URLパターン(/stories/${id})が使用されました。新しいURLパターン(/stories?id=${id})にリダイレクトします。`);
      router.replace(`/stories?id=${id}`);
    }
  }, [id, router]);

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
