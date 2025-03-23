'use client';

import { useState, useEffect } from "react";
import { StoryProvider, useStoryContext } from '@/components/story/StoryProvider';
import { StoryTabs } from '@/components/story/StoryTabs';
import { ActDetail, EpisodeDetail } from '@/lib/unified-api-client';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import EpisodeDetailList from './components/EpisodeDetailList';
import EpisodeContentForm from './components/EpisodeContentForm';

// 外側のコンポーネント：StoryProviderを提供する
export default function ContentPage() {
  const searchParams = useSearchParams();
  const storyId = searchParams.get('id');

  if (!storyId) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-10">
          <p className="text-red-500 font-medium">小説IDが指定されていません。</p>
        </div>
      </div>
    );
  }

  return (
    <StoryProvider storyId={storyId}>
      <ContentPageInner storyId={storyId} />
    </StoryProvider>
  );
}

// 内側のコンポーネント：コンテキストを使用する
function ContentPageInner({ storyId }: { storyId: string }) {
  const [selectedAct, setSelectedAct] = useState<ActDetail | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<EpisodeDetail | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);

  // ここでコンテキストを使用（プロバイダの内側で）
  const { basicSetting } = useStoryContext();
  console.log("コンテキスト内の基本設定:", basicSetting);

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

  return (
    <div className="container mx-auto p-4">
      <StoryTabs storyId={storyId} activeTab="content" />
      
      {isMobile ? (
        // モバイル表示：タブで切り替え
        <Tabs defaultValue="left-panel" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="left-panel">幕とエピソード</TabsTrigger>
            <TabsTrigger value="right-panel">エピソード本文</TabsTrigger>
          </TabsList>

          <TabsContent value="left-panel" className="mt-4">
            <EpisodeDetailList 
              storyId={storyId}
              selectedAct={selectedAct}
              setSelectedAct={setSelectedAct}
              selectedEpisode={selectedEpisode}
              setSelectedEpisode={setSelectedEpisode}
              setEditedContent={setEditedContent}
            />
          </TabsContent>

          <TabsContent value="right-panel" className="mt-4">
            <EpisodeContentForm
              storyId={storyId}
              selectedEpisode={selectedEpisode}
              editedContent={editedContent}
              setEditedContent={setEditedContent}
            />
          </TabsContent>
        </Tabs>
      ) : (
        // デスクトップ表示：左右分割
        <div className="panel-container mt-6">
          <div className="panel-row">
            {/* 左側：幕とエピソード一覧 */}
            <div className="panel-half panel-scroll">
              <EpisodeDetailList 
                storyId={storyId}
                selectedAct={selectedAct}
                setSelectedAct={setSelectedAct}
                selectedEpisode={selectedEpisode}
                setSelectedEpisode={setSelectedEpisode}
                setEditedContent={setEditedContent}
              />
            </div>
            
            {/* 右側：エピソード本文とコンテンツ生成 */}
            <div className="panel-half panel-scroll">
              <EpisodeContentForm
                storyId={storyId}
                selectedEpisode={selectedEpisode}
                editedContent={editedContent}
                setEditedContent={setEditedContent}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
