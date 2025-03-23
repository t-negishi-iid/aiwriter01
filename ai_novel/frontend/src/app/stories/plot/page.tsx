'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from 'next/navigation';
import { usePlotDetail } from './hooks/usePlotDetail';
import { StoryProvider } from '@/components/story/StoryProvider';
import { StoryTabs } from '@/components/story/StoryTabs';
import { MobileView } from './components/MobileView';
import { DesktopView } from './components/DesktopView';

export default function PlotPage() {
  const searchParams = useSearchParams();
  const storyId = searchParams.get('id');
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  // カスタムフックを使用
  const {
    plots,
    basicSetting,
    selectedPlot,
    setSelectedPlot,
    isLoading,
    error,
    isSaving,
    isGenerating,
    handleSavePlot,
    handleGenerateDetailedPlot,
    handleEditAct,
    handleCancelForm,
    refreshPlots,
    refreshBasicSetting
  } = usePlotDetail(storyId);

  useEffect(() => {
    // 画面サイズを検出して、モバイルかどうかを判定
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // 初期チェック
    checkIfMobile();

    // リサイズイベントのリスナーを設定
    window.addEventListener('resize', checkIfMobile);

    // クリーンアップ関数
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // ストーリーIDがない場合は、ストーリー一覧に戻る
  useEffect(() => {
    if (!storyId) {
      router.push('/stories');
    }
  }, [storyId, router]);

  // ページ読み込み時に、あらすじが選択されていない場合は最初のあらすじを選択
  useEffect(() => {
    if (!isLoading && !selectedPlot && plots.length > 0 && basicSetting) {
      // 最初のプロットを選択する前に、基本設定のact_overviewを適用
      const firstPlot = {...plots[0]};
      
      // 幕に応じた基本あらすじを設定
      if (firstPlot.act_number === 1) {
        firstPlot.content = basicSetting.act1_overview || '';
      } else if (firstPlot.act_number === 2) {
        firstPlot.content = basicSetting.act2_overview || '';
      } else if (firstPlot.act_number === 3) {
        firstPlot.content = basicSetting.act3_overview || '';
      }
      
      setSelectedPlot(firstPlot);
    }
  }, [isLoading, plots, selectedPlot, setSelectedPlot, basicSetting]);

  if (!storyId) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-gray-500 text-center">ストーリーが選択されていません</p>
      </div>
    );
  }

  return (
    <StoryProvider storyId={storyId}>
      <div className="container mx-auto px-4 py-6">
        <StoryTabs activeTab="plot" storyId={storyId} />

        {isMobile ? (
          <MobileView
            plots={plots}
            basicSetting={basicSetting}
            selectedPlot={selectedPlot}
            isLoading={isLoading}
            isSaving={isSaving}
            isGenerating={isGenerating}
            error={error}
            setSelectedPlot={setSelectedPlot}
            handleSavePlot={handleSavePlot}
            handleGenerateDetailedPlot={handleGenerateDetailedPlot}
            handleCancelForm={handleCancelForm}
            refreshPlots={refreshPlots}
            refreshBasicSetting={refreshBasicSetting}
            storyId={Number(storyId)}
            handleEditAct={handleEditAct}
          />
        ) : (
          <DesktopView
            plots={plots}
            basicSetting={basicSetting}
            selectedPlot={selectedPlot}
            isLoading={isLoading}
            isSaving={isSaving}
            isGenerating={isGenerating}
            error={error}
            setSelectedPlot={setSelectedPlot}
            handleSavePlot={handleSavePlot}
            handleGenerateDetailedPlot={handleGenerateDetailedPlot}
            handleCancelForm={handleCancelForm}
            refreshPlots={refreshPlots}
            refreshBasicSetting={refreshBasicSetting}
            storyId={Number(storyId)}
            handleEditAct={handleEditAct}
          />
        )}
      </div>
    </StoryProvider>
  );
}
