'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { StoryContent } from './content';

/**
 * クエリパラメータベースのストーリー詳細ページ
 * /stories?id=123 のURLパターンに対応する
 */
export default function StoriesPageWithParams() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  // IDがない場合は一覧ページのコンテンツを表示
  if (!id) {
    // ここでは一覧ページのコンポーネントを呼び出すことも可能
    return null;
  }

  // IDがある場合はストーリー詳細を表示
  return <StoryContent storyId={id} />;
}
