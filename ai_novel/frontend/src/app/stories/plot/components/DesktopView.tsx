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
  storyId: number; // Added storyId prop
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
  handleGenerateDetailedPlot,
  handleCancelForm,
  refreshPlots,
  storyId // Added storyId prop
}: DesktopViewProps) {
  // 基本設定の幕を編集するための処理
  const handleEditAct = async (act: number) => {
    console.log(`[handleEditAct] 第${act}幕の編集ボタンがクリックされました`);
    console.log('[handleEditAct] plots配列の内容:', plots);

    // 該当する幕のプロットデータを探す
    const actPlot = plots.find(plot => plot.act_number === act);
    console.log('[handleEditAct] 既存プロット検索結果:', actPlot);

    if (actPlot) {
      // 既存のプロットデータがある場合はそれを選択
      // プロットの詳細情報（raw_content）が存在しない場合は、APIから取得
      console.log('[handleEditAct] raw_content:', actPlot.raw_content ? '存在します' : 'なし');

      if (!actPlot.raw_content && actPlot.id) {
        console.log(`[handleEditAct] raw_contentがないため、API呼び出しを実行します: /api/stories/${storyId}/acts/${act}/`);
        try {
          // プロット詳細を取得
          const response = await fetch(`/api/stories/${storyId}/acts/${act}/`);
          console.log('[handleEditAct] API応答:', response.status, response.statusText);

          if (response.ok) {
            const detailedPlot = await response.json();
            console.log('[handleEditAct] 取得したプロット詳細:', detailedPlot);
            console.log('[handleEditAct] 取得したraw_content:', detailedPlot.raw_content ? '存在します' : 'なし');
            console.log('[handleEditAct] 取得したraw_contentの内容:', detailedPlot.raw_content);

            // 詳細情報を含むプロットデータを選択
            setSelectedPlot(detailedPlot);
            return;
          } else {
            console.error('[handleEditAct] APIエラー:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('[handleEditAct] プロット詳細取得エラー:', error);
        }
      }
      console.log('[handleEditAct] 既存プロットをそのまま選択します');
      setSelectedPlot(actPlot);
    } else if (basicSetting) {
      // 基本設定からプロットデータを作成
      console.log('[handleEditAct] 既存プロットがないため、基本設定から新規プロットを作成します');
      
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
      console.log('[handleEditAct] 作成した新規プロット:', newPlot);
      setSelectedPlot(newPlot);
    } else {
      console.log('[handleEditAct] 基本設定もプロットも見つかりませんでした');
    }
  };

  return (
    <div className={styles.container}>
      {/* 左パネル：基本設定 */}
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
