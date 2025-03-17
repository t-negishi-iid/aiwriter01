'use client';

import { useState, useEffect } from 'react';
import { PlotData, BasicSettingPlot, BasicSetting } from '../lib/types';
import { toast } from '@/components/ui/use-toast';

export function usePlotDetail(storyId: string | null) {
  const [plots, setPlots] = useState<PlotData[]>([]);
  const [basicSetting, setBasicSetting] = useState<BasicSetting | null>(null);
  const [basicSettingPlot, setBasicSettingPlot] = useState<BasicSettingPlot | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<PlotData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPlots, setIsLoadingPlots] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 基本設定とあらすじ一覧を取得
  useEffect(() => {
    if (!storyId) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 基本設定を取得
        const basicSettingResponse = await fetch(`/api/basic-settings/${storyId}`);
        if (basicSettingResponse.ok) {
          const basicSettingData = await basicSettingResponse.json();
          setBasicSetting(basicSettingData);
          
          // 基本設定からあらすじ情報を抽出
          if (basicSettingData && basicSettingData.basic_setting_data) {
            setBasicSettingPlot({
              act1: basicSettingData.basic_setting_data.act1 || '',
              act2: basicSettingData.basic_setting_data.act2 || '',
              act3: basicSettingData.basic_setting_data.act3 || ''
            });
          }
        }

        // プロット一覧を取得
        const plotsResponse = await fetch(`/api/plots/${storyId}`);
        if (plotsResponse.ok) {
          const plotsData = await plotsResponse.json();
          setPlots(plotsData);
        } else {
          throw new Error('プロットデータの取得に失敗しました');
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
    if (basicSettingPlot) {
      setPlots(prevPlots => 
        prevPlots.map(plot => {
          if (plot.act === 1) {
            return { ...plot, content: basicSettingPlot.act1 || '' };
          } else if (plot.act === 2) {
            return { ...plot, content: basicSettingPlot.act2 || '' };
          } else if (plot.act === 3) {
            return { ...plot, content: basicSettingPlot.act3 || '' };
          }
          return plot;
        })
      );
    }
  }, [basicSettingPlot]);

  // あらすじ一覧を再取得
  const refreshPlots = async () => {
    if (!storyId) return;

    setIsLoadingPlots(true);
    setError(null);
    try {
      // プロット一覧を取得
      const plotsResponse = await fetch(`/api/plots/${storyId}`);
      if (plotsResponse.ok) {
        const plotsData = await plotsResponse.json();
        setPlots(plotsData);
      } else {
        throw new Error('プロットデータの取得に失敗しました');
      }
    } catch (err) {
      console.error('あらすじ一覧取得エラー:', err);
      setError('あらすじ一覧の取得に失敗しました');
    } finally {
      setIsLoadingPlots(false);
    }
  };

  // あらすじを保存
  const handleSavePlot = async (plot: PlotData): Promise<boolean> => {
    if (!storyId) return false;

    setIsSaving(true);
    try {
      // APIを使用してプロットを保存
      const method = plot.id ? 'PUT' : 'POST';
      const url = plot.id ? `/api/plots/${storyId}/${plot.id}` : `/api/plots/${storyId}`;
      
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
      const response = await fetch(`/api/plots/${storyId}/${plotId}`, {
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
      const response = await fetch(`/api/plots/${storyId}/${plot.id}/generate-detail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plot }),
      });
      
      if (!response.ok) {
        throw new Error('詳細あらすじの生成に失敗しました');
      }
      
      const generatedPlot = await response.json();
      
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
    basicSettingPlot,
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
    refreshPlots
  };
}
