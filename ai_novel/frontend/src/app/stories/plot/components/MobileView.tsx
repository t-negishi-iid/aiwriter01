'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { BookOpen } from 'lucide-react';
import { PlotData, BasicSetting } from '../lib/types';
import { PlotList } from './PlotList';
import { PlotForm } from './PlotForm';
import { BasicSettingBlock } from './BasicSettingBlock';
import styles from '../plot-detail.module.css';

interface MobileViewProps {
  plots: PlotData[];
  basicSetting: BasicSetting | null;
  selectedPlot: PlotData | null;
  isLoading: boolean;
  isSaving: boolean;
  isGenerating: boolean;
  error: string | null;
  setSelectedPlot: (plot: PlotData | null) => void;
  handleSavePlot: (plot: PlotData) => Promise<boolean>;
  handleDeletePlot: (plotId: number) => Promise<boolean>;
  handleGenerateDetailedPlot: (plot: PlotData) => Promise<PlotData | null>;
  handleCancelForm: () => void;
  refreshPlots: () => void;
  storyId: number;
}

export function MobileView({
  plots,
  basicSetting,
  selectedPlot,
  isLoading,
  isSaving,
  isGenerating,
  error,
  setSelectedPlot,
  handleSavePlot,
  handleDeletePlot,
  handleGenerateDetailedPlot,
  handleCancelForm,
  refreshPlots,
  storyId
}: MobileViewProps) {
  return (
    <div className={styles.mobileContainer}>
      <Tabs defaultValue="plot-list">
        <TabsList className={styles.tabsList}>
          <TabsTrigger value="plot-list" className={styles.tabsTrigger}>あらすじ一覧</TabsTrigger>
          <TabsTrigger value="plot-edit" className={styles.tabsTrigger}>あらすじ編集</TabsTrigger>
        </TabsList>

        <TabsContent value="plot-list">
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">読み込み中...</span>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <p className="text-red-500">{error}</p>
              <Button
                variant="outline"
                className={styles.refreshButton}
                onClick={refreshPlots}
              >
                再読み込み
              </Button>
            </div>
          ) : (
            <div className={styles.plotListContainer}>
              {/* 作品設定ブロック */}
              <BasicSettingBlock 
                basicSetting={basicSetting}
                onEditAct={async (act) => {
                  // 該当する幕のプロットデータを探す
                  const actPlot = plots.find(plot => plot.act === act);
                  
                  if (actPlot) {
                    // 既存のプロットデータがある場合はそれを選択
                    // プロットの詳細情報（raw_content）が存在しない場合は、APIから取得
                    if (!actPlot.raw_content && actPlot.id) {
                      try {
                        // プロット詳細を取得
                        const response = await fetch(`/stories/${storyId}/acts/${actPlot.id}/`);
                        if (response.ok) {
                          const detailedPlot = await response.json();
                          // 詳細情報を含むプロットデータを選択
                          setSelectedPlot(detailedPlot);
                          return;
                        }
                      } catch (error) {
                        console.error('プロット詳細取得エラー:', error);
                      }
                    }
                    setSelectedPlot(actPlot);
                  } else if (basicSetting) {
                    // 基本設定からプロットデータを作成
                    const newPlot = {
                      id: 0, // 新規プロットとして扱う
                      act: act,
                      act_number: act,
                      content: act === 1 
                        ? basicSetting.act1_overview || ''
                        : act === 2
                          ? basicSetting.act2_overview || ''
                          : basicSetting.act3_overview || '',
                      raw_content: '', // 初期値は空文字列
                      title: `第${act}幕`,
                      status: 'draft'
                    };
                    setSelectedPlot(newPlot);
                  }
                }}
              />

              {/* あらすじリスト */}
              <div className={styles.plotList}>
                <div className={styles.plotListHeader}>
                  <h2 className="text-xl font-semibold">あらすじ一覧</h2>
                </div>

                {plots.length === 0 ? (
                  <div className={styles.noPlotContainer}>
                    <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">あらすじがまだ登録されていません</p>
                  </div>
                ) : (
                  <PlotList
                    plots={plots}
                    selectedPlotId={selectedPlot?.id}
                    onSelect={(plot) => {
                      setSelectedPlot(plot);
                      // モバイル表示の場合は、あらすじを選択したらあらすじ編集タブに切り替え
                      const tabsElement = document.querySelector('[data-value="plot-edit"]');
                      if (tabsElement) {
                        (tabsElement as HTMLElement).click();
                      }
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="plot-edit">
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">読み込み中...</span>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <p className="text-red-500">{error}</p>
            </div>
          ) : selectedPlot ? (
            <PlotForm
              plot={selectedPlot}
              isSaving={isSaving}
              isGenerating={isGenerating}
              onSave={handleSavePlot}
              onDelete={handleDeletePlot}
              onGenerate={handleGenerateDetailedPlot}
              onCancel={handleCancelForm}
            />
          ) : (
            <div className="text-center p-4">
              <p className="text-gray-500">あらすじを選択してください</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
