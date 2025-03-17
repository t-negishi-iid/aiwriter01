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
  const handleSavePlot = async (plot: PlotData): Promise<boolean> => {
    if (!storyId) return false;

    setIsSaving(true);
    try {
      // 新規作成か更新かを判断
      const method = plot.id ? 'PUT' : 'POST';
      const url = plot.id ? `/stories/${storyId}/acts/${plot.id}/` : `/stories/${storyId}/acts/`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(plot),
      });

      if (!response.ok) {
        throw new Error('プロットの保存に失敗しました');
      }

      const savedPlot = await response.json();
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
        description: "あらすじの保存に失敗しました",
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
      const response = await fetch(`/stories/${storyId}/acts/${plotId}/`, {
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

  // 詳細あらすじを生成
  const handleGenerateDetailedPlot = async (plot: PlotData): Promise<PlotData | null> => {
    if (!storyId) return null;

    setIsGenerating(true);
    try {
      // APIを使用して詳細あらすじを生成
      const response = await fetch(`/stories/${storyId}/create-plot-detail/`, {
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
    handleCancelForm: () => setSelectedPlot(null),
    refreshPlots
  };
}
