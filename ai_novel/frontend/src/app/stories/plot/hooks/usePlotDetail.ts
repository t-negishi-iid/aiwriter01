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

        // あらすじ一覧を取得（実際のAPIが実装されたら置き換える）
        // 現時点ではモックデータを使用
        const mockPlots: PlotData[] = [
          { id: 1, storyId, act: 1, title: '第1幕', content: '', detailedContent: '' },
          { id: 2, storyId, act: 2, title: '第2幕', content: '', detailedContent: '' },
          { id: 3, storyId, act: 3, title: '第3幕', content: '', detailedContent: '' }
        ];
        setPlots(mockPlots);
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
      // 実際のAPIが実装されたら置き換える
      // 現時点ではモックデータを使用
      const mockPlots: PlotData[] = [
        { id: 1, storyId, act: 1, title: '第1幕', content: basicSettingPlot?.act1 || '', detailedContent: '' },
        { id: 2, storyId, act: 2, title: '第2幕', content: basicSettingPlot?.act2 || '', detailedContent: '' },
        { id: 3, storyId, act: 3, title: '第3幕', content: basicSettingPlot?.act3 || '', detailedContent: '' }
      ];
      setPlots(mockPlots);
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
      // 実際のAPIが実装されたら置き換える
      console.log('保存するあらすじ:', plot);
      
      // モックの保存処理
      if (plot.id) {
        // 既存のあらすじを更新
        setPlots(prevPlots => 
          prevPlots.map(p => p.id === plot.id ? plot : p)
        );
      } else {
        // 新規あらすじを作成
        const newPlot = { ...plot, id: Date.now() };
        setPlots(prevPlots => [...prevPlots, newPlot]);
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
      // 実際のAPIが実装されたら置き換える
      console.log('削除するあらすじID:', plotId);
      
      // モックの削除処理
      setPlots(prevPlots => prevPlots.filter(p => p.id !== plotId));
      
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
      // 実際のAPIが実装されたら置き換える
      console.log('詳細あらすじを生成:', plot);
      
      // モックの生成処理
      const generatedDetail = `${plot.content}\n\nここに生成された詳細なあらすじが表示されます。このテキストはモックデータです。実際のAPIが実装されたら、AIによって生成された詳細なあらすじが表示されます。`;
      
      const updatedPlot = { ...plot, detailedContent: generatedDetail };
      
      // 生成結果を反映
      setPlots(prevPlots => 
        prevPlots.map(p => p.id === plot.id ? updatedPlot : p)
      );
      
      // 選択中のあらすじも更新
      if (selectedPlot && selectedPlot.id === plot.id) {
        setSelectedPlot(updatedPlot);
      }
      
      toast({
        title: "生成完了",
        description: "詳細あらすじが生成されました",
      });
      
      return updatedPlot;
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
