'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api-client';
import { PlotData, BasicSetting } from '../lib/types';
import { toast } from '@/components/ui/use-toast';

export function usePlotDetail(storyId: string | null) {
  const [plots, setPlots] = useState<PlotData[]>([]);
  const [basicSetting, setBasicSetting] = useState<BasicSetting | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<PlotData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPlots, setIsLoadingPlots] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 作品設定とあらすじ一覧を取得
  useEffect(() => {
    if (!storyId) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 作品設定を取得 stories/<int:story_id>/latest-basic-setting/
        try {
          const basicSettingData = await fetchApi(`/stories/${storyId}/latest-basic-setting/`);
          console.log('usePlotDetail basicSetting:', basicSettingData);
          setBasicSetting(basicSettingData);
        } catch (basicSettingErr) {
          console.error('作品設定取得エラー:', basicSettingErr);
          // 作品設定の取得に失敗しても、プロット一覧の取得は続行する
        }

        // プロット一覧を取得
        try {
          // バックエンドサーバーに直接アクセス - fetchApiを使用
          const plotsData = await fetchApi(`/stories/${storyId}/acts/`);
          console.log('usePlotDetail プロット一覧:', plotsData);
          
          // 結果が空の配列でも正常に処理
          const plotResults = plotsData.results || [];
          
          // 各プロットのraw_contentをログ出力（デバッグ用）
          plotResults.forEach((plot: PlotData, index: number) => {
            console.log(`プロット[${index}] id=${plot.id}, act=${plot.act_number}, raw_content=${plot.raw_content ? '存在します' : 'なし'}`);
          });
          
          setPlots(plotResults);
        } catch (plotsErr) {
          console.error('プロット一覧取得エラー:', plotsErr);
          // エラー時は空の配列を設定
          setPlots([]);
        }
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError('データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [storyId]);

  // 基本設定のあらすじが更新されたらプロットのコンテンツも更新
  useEffect(() => {
    // プロットが存在する場合のみ処理を実行
    if (basicSetting) {
      setPlots(prevPlots => {
        // 空の配列の場合は何もしない
        if (prevPlots.length === 0) return prevPlots;
        
        // プロットを更新
        return prevPlots.map(plot => {
          if (plot.act_number === 1) {
            return { ...plot, content: basicSetting.act1_overview || '' };
          } else if (plot.act_number === 2) {
            return { ...plot, content: basicSetting.act2_overview || '' };
          } else if (plot.act_number === 3) {
            return { ...plot, content: basicSetting.act3_overview || '' };
          }
          return plot;
        });
      });
    }
  }, [basicSetting]); // 依存配列から plots を削除

  // 基本設定のリフレッシュ
  const refreshBasicSetting = async (storyId: number): Promise<void> => {
    try {
      const basicSettingData = await fetchApi(`/stories/${storyId}/latest-basic-setting/`);
      console.log('基本設定を再取得しました:', basicSettingData);
      setBasicSetting(basicSettingData);
    } catch (error) {
      console.error('基本設定再取得エラー:', error);
      toast({
        title: "エラー",
        description: "基本設定の再取得に失敗しました",
        variant: "destructive",
      });
    }
  };

  // あらすじ一覧を再取得
  const refreshPlots = async () => {
    if (!storyId) return;

    setIsLoadingPlots(true);
    setError(null);
    try {
      // プロット一覧を取得
      const plotsResponse = await fetchApi(`/stories/${storyId}/acts/`);
      console.log('refreshPlots プロット一覧:', plotsResponse);
      
      // 結果が空の配列でも正常に処理
      const plotResults = plotsResponse.results || [];
      setPlots(plotResults);
    } catch (err) {
      console.error('プロット再取得エラー:', err);
      setError('プロットデータの再取得に失敗しました');
    } finally {
      setIsLoadingPlots(false);
    }
  };

  // あらすじを保存
  const handleSavePlot = async (plot: Partial<PlotData>): Promise<boolean> => {
    if (!storyId) return false;

    setIsSaving(true);
    try {
      const method = plot.id ? 'PUT' : 'POST';
      const endpoint = plot.id
        ? `/stories/${storyId}/acts/${plot.id}/`
        : `/stories/${storyId}/acts/`;
      
      console.log(`プロット${plot.id ? '更新' : '作成'}リクエスト:`, endpoint, plot);
      
      const response = await fetchApi(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(plot),
      });
      
      const savedPlot = await response;
      console.log('保存されたプロット:', savedPlot);

      // 保存したプロットで状態を更新
      if (plot.id) {
        // 既存のプロットを更新
        setPlots(prevPlots =>
          prevPlots.map(p => p.id === plot.id ? savedPlot : p)
        );
      } else {
        // 新規プロットを追加
        setPlots(prevPlots => [...prevPlots, savedPlot]);
      }

      toast({
        title: "保存完了",
        description: "あらすじが保存されました",
      });

      return true;
    } catch (err) {
      console.error('あらすじ保存エラー:', err);
      toast({
        title: "エラー",
        description: `あらすじの保存に失敗しました: ${err instanceof Error ? err.message : String(err)}`,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // あらすじを削除
  const handleDeletePlot = async (plotId: number): Promise<boolean> => {
    if (!storyId) return false;

    setIsSaving(true);
    try {
      // APIを使用してプロットを削除
      const response = await fetchApi(`/stories/${storyId}/acts/${plotId}/`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('プロットの削除に失敗しました');
      }

      // 削除したプロットを状態から除外
      setPlots(prevPlots => prevPlots.filter(p => p.id !== plotId));

      // 削除したプロットが選択中だった場合、選択を解除
      if (selectedPlot?.id === plotId) {
        setSelectedPlot(null);
      }

      toast({
        title: "削除完了",
        description: "あらすじが削除されました",
      });

      return true;
    } catch (err) {
      console.error('あらすじ削除エラー:', err);
      toast({
        title: "エラー",
        description: "あらすじの削除に失敗しました",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // 基本設定の幕を編集するための処理（DesktopViewとMobileViewで共通利用）
  const handleEditAct = async (act: number) => {
    console.log(`[handleEditAct] 第${act}幕の編集ボタンがクリックされました`);
    if (!storyId) return;

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
          const response = await fetchApi(`/stories/${storyId}/acts/${act}/`);
          console.log('[handleEditAct] API応答:', response.status, response.statusText);

          if (response) {
            const detailedPlot = response;
            console.log('[handleEditAct] 取得したプロット詳細:', detailedPlot);
            console.log('[handleEditAct] 取得したraw_content:', detailedPlot.raw_content ? '存在します' : 'なし');

            // 基本あらすじを設定
            if (basicSetting) {
              const actOverview = act === 1 
                ? basicSetting.act1_overview 
                : act === 2 
                  ? basicSetting.act2_overview 
                  : basicSetting.act3_overview;
              
              // 基本あらすじを適用
              detailedPlot.content = actOverview || '';
            }

            // storyIdを明示的に設定
            detailedPlot.storyId = storyId;

            // 詳細情報を含むプロットデータを選択
            setSelectedPlot(detailedPlot);
            return;
          }
        } catch (error) {
          console.error('[handleEditAct] プロット詳細取得エラー:', error);
        }
      }
      
      console.log('[handleEditAct] 既存プロットをそのまま選択します');
      
      // 基本あらすじを適用
      if (basicSetting) {
        const updatedPlot = { ...actPlot };
        updatedPlot.content = act === 1 
          ? basicSetting.act1_overview || ''
          : act === 2
            ? basicSetting.act2_overview || ''
            : basicSetting.act3_overview || '';
        
        // storyIdを明示的に設定
        updatedPlot.storyId = storyId;
        
        setSelectedPlot(updatedPlot);
      } else {
        // storyIdを明示的に設定
        const plotWithStoryId = { ...actPlot, storyId };
        setSelectedPlot(plotWithStoryId);
      }
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
        status: 'draft',
        storyId: storyId // storyIdを明示的に設定
      };
      
      console.log('[handleEditAct] 作成した新規プロット:', newPlot);
      setSelectedPlot(newPlot);
    } else {
      console.log('[handleEditAct] 基本設定もプロットも見つかりませんでした');
    }
  };

  // 詳細あらすじを生成
  const handleGenerateDetailedPlot = async (plot: PlotData): Promise<PlotData | null> => {
    if (!storyId) return null;

    setIsGenerating(true);
    try {
      // APIを使用して詳細あらすじを生成
      const response = await fetch(`/api/stories/${storyId}/create-plot-detail/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          basic_setting_id: plot.storyId,
          plot_id: plot.id 
        }),
      });

      if (!response.ok) {
        throw new Error('詳細あらすじの生成に失敗しました');
      }

      const generatedPlot = await response.json();
      console.log('生成された詳細あらすじ:', generatedPlot);
      console.log('生成された詳細あらすじのraw_content:', generatedPlot.raw_content ? '存在します' : 'なし');

      // 生成された詳細あらすじで状態を更新
      setPlots(prevPlots =>
        prevPlots.map(p => p.id === plot.id ? generatedPlot : p)
      );

      toast({
        title: "生成完了",
        description: "詳細あらすじが生成されました",
      });

      return generatedPlot;
    } catch (err) {
      console.error('詳細あらすじ生成エラー:', err);
      toast({
        title: "エラー",
        description: "詳細あらすじの生成に失敗しました",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  // フォームをキャンセル
  const handleCancelForm = () => {
    setSelectedPlot(null);
  };

  return {
    plots,
    basicSetting,
    selectedPlot,
    isLoading,
    isLoadingPlots,
    isSaving,
    isGenerating,
    error,
    setSelectedPlot,
    handleSavePlot,
    handleDeletePlot,
    handleGenerateDetailedPlot,
    handleEditAct,
    handleCancelForm,
    refreshPlots,
    refreshBasicSetting
  };
}
