'use client';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { BookOpen } from 'lucide-react';
import { PlotData, BasicSetting } from '../lib/types';
import { PlotList } from './PlotList';
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
  handleDeletePlot: (plotId: number) => Promise<boolean>;
  handleGenerateDetailedPlot: (plot: PlotData) => Promise<PlotData | null>;
  handleCancelForm: () => void;
  refreshPlots: () => void;
}

export function DesktopView({
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
  refreshPlots
}: DesktopViewProps) {
  // 基本設定の幕を編集するための処理
  const handleEditAct = (act: number) => {
    // 該当する幕のプロットデータを探す
    const actPlot = plots.find(plot => plot.act === act);
    
    if (actPlot) {
      // 既存のプロットデータがある場合はそれを選択
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
        title: `第${act}幕`,
        status: 'draft'
      };
      setSelectedPlot(newPlot);
    }
  };

  return (
    <div className={styles.container}>
      {/* 左パネル：あらすじ一覧 */}
      <div className={styles.leftPanel}>
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
                  onSelect={(plot) => setSelectedPlot(plot)}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* 右パネル：あらすじフォーム */}
      <div className={styles.rightPanel}>
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
      </div>
    </div>
  );
}
