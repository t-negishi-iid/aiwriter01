'use client';

import { useState } from "react";
import { StoryProvider, useStoryContext } from '@/components/story/StoryProvider';
import { StoryTabs } from '@/components/story/StoryTabs';
import { ActDetail, EpisodeDetail } from '@/lib/unified-api-client';
import { useSearchParams } from 'next/navigation';
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

  // ここでコンテキストを使用（プロバイダの内側で）
  const { basicSetting } = useStoryContext();
  console.log("コンテキスト内の基本設定:", basicSetting);

  return (
    <div className="container mx-auto p-4">
      <StoryTabs activeTab="content" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* 左側: 幕とエピソード一覧 */}
        <div>
          <EpisodeDetailList 
            storyId={storyId}
            selectedAct={selectedAct}
            setSelectedAct={setSelectedAct}
            selectedEpisode={selectedEpisode}
            setSelectedEpisode={setSelectedEpisode}
            setEditedContent={setEditedContent}
          />
        </div>
        
        {/* 右側: エピソード本文とコンテンツ生成 */}
        <div>
          <EpisodeContentForm
            storyId={storyId}
            selectedEpisode={selectedEpisode}
            editedContent={editedContent}
            setEditedContent={setEditedContent}
          />
        </div>
      </div>
    </div>
  );
}
