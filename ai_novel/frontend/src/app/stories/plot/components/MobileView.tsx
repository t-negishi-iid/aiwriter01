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
  handleGenerateDetailedPlot: (plot: PlotData) => Promise<PlotData | null>;
  handleCancelForm: () => void;
  refreshPlots: () => void;
  refreshBasicSetting: (storyId: number) => Promise<void>;
  storyId: number;
  handleEditAct: (act: number) => Promise<void>;
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
  handleGenerateDetailedPlot,
  handleCancelForm,
  refreshPlots,
  refreshBasicSetting,
  storyId,
  handleEditAct
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
                onEditAct={handleEditAct}
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
              basicSetting={basicSetting}
              isSaving={isSaving}
              isGenerating={isGenerating}
              onSave={handleSavePlot}
              onGenerate={handleGenerateDetailedPlot}
              onCancel={handleCancelForm}
              refreshBasicSetting={refreshBasicSetting}
              storyId={storyId}
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
