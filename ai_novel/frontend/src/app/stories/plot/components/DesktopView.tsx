'use client';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { PlotData, BasicSetting } from '../lib/types';
import { PlotForm } from './PlotForm';
import { BasicSettingBlock } from './BasicSettingBlock';
import styles from '../plot-detail.module.css';

interface DesktopViewProps {
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

export function DesktopView({
  // plots, 
  basicSetting,
  selectedPlot,
  isLoading,
  isSaving,
  isGenerating,
  error,
  // setSelectedPlot, 
  handleSavePlot,
  handleGenerateDetailedPlot,
  handleCancelForm,
  refreshPlots,
  refreshBasicSetting,
  storyId, 
  handleEditAct
}: DesktopViewProps) {
  return (
    <div className="panel-container">
      <div className="panel-row">
        {/* 左パネル：基本設定 */}
        <div className="panel-half panel-scroll">
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
            </div>
          )}
        </div>

        {/* 右パネル：あらすじフォーム */}
        <div className="panel-half panel-scroll">
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
        </div>
      </div>
    </div>
  );
}
