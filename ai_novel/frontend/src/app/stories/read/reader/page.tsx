"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import ReaderContainer from '@/app/stories/read/components/ReaderContainer';

export default function ReaderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const storyId = searchParams.get('id');
  const actNumber = searchParams.get('act');
  const episodeNumber = searchParams.get('episode');

  const [isLoading, setIsLoading] = useState(true);

  // 小説IDがない場合は /stories へリダイレクト
  useEffect(() => {
    if (!storyId) {
      router.push('/stories');
      return;
    }
    setIsLoading(false);
  }, [storyId, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return storyId ? (
    <ReaderContainer
      storyId={parseInt(storyId)}
      initialAct={actNumber ? parseInt(actNumber) : undefined}
      initialEpisode={episodeNumber ? parseInt(episodeNumber) : undefined}
    />
  ) : null;
}
