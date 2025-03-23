'use client';

import { useEffect, useState } from "react";
import { useSearchParams } from 'next/navigation';
import { StoryProvider } from '@/components/story/StoryProvider';
import { StoryTabs } from '@/components/story/StoryTabs';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ActDetailList } from './components/ActDetailList';
import { ActDetail } from '@/lib/unified-api-client';
import EpisodesForm from './components/EpisodesForm';

export default function EpisodesPage() {
  const searchParams = useSearchParams();
  const storyId = searchParams.get('id');
  const [isMobile, setIsMobile] = useState(false);
  const [selectedAct, setSelectedAct] = useState<ActDetail | null>(null);

  useEffect(() => {
    // 画面サイズを検出して、モバイルかどうかを判定
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // 初期チェック
    checkIfMobile();

    // リサイズイベントのリスナーを追加
    window.addEventListener('resize', checkIfMobile);

    // クリーンアップ
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  if (!storyId) {
    return <div>小説IDが指定されていません</div>;
  }

  // storyIdを数値に変換
  const storyIdNum = parseInt(storyId, 10);

  // storyIdが有効な数値でない場合のエラーハンドリング
  if (isNaN(storyIdNum)) {
    return <div>無効な小説IDです</div>;
  }

  return (
    <StoryProvider storyId={storyId}>
      <StoryTabs storyId={storyId} activeTab="episodes" />

      {isMobile ? (
        // モバイル表示：タブで切り替え
        <Tabs defaultValue="left-panel" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="left-panel">幕一覧</TabsTrigger>
            <TabsTrigger value="right-panel">エピソード詳細</TabsTrigger>
          </TabsList>

          <TabsContent value="left-panel" className="mt-4">
            <ActDetailList storyId={storyIdNum} />
          </TabsContent>

          <TabsContent value="right-panel" className="mt-4">
            <EpisodesForm />
          </TabsContent>
        </Tabs>
      ) : (
        // デスクトップ表示：左右分割
        <div className="panel-container">
          <div className="panel-row">
            {/* 左側：幕一覧 */}
            <div className="panel-half panel-scroll">
              <ActDetailList storyId={storyIdNum} />
            </div>

            {/* 右側：エピソード詳細 */}
            <div className="panel-half panel-scroll">
              <EpisodesForm />
            </div>
          </div>
        </div>
      )}
    </StoryProvider>
  );
}
