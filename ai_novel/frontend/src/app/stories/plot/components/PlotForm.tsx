'use client';

import { useState, useEffect } from 'react';
import { PlotData, BasicSetting } from '../lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import styles from '../plot-detail.module.css';
import { toast } from '@/components/ui/use-toast';
import { fetchApi } from '@/lib/api-client';

interface PlotFormProps {
  plot: PlotData;
  basicSetting: BasicSetting;
  isSaving: boolean;
  isGenerating: boolean;
  onSave: (plot: PlotData) => Promise<boolean>;
  onGenerate: (plot: PlotData) => Promise<PlotData | null>;
  onCancel: () => void;
  refreshBasicSetting: (storyId: number) => Promise<void>;
  storyId: number | string;
}

export function PlotForm({
  plot,
  basicSetting,
  isSaving,
  isGenerating,
  onSave,
  onGenerate,
  onCancel,
  refreshBasicSetting,
  storyId
}: PlotFormProps) {
  const [formData, setFormData] = useState<PlotData>(plot);
  const [isSavingDetail, setIsSavingDetail] = useState(false);
  const [currentAct, setCurrentAct] = useState<number>(plot.act_number || 1);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    console.log(`handleChange: name=${name}, value=${value.substring(0, 30)}...`);
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let updateSuccess = true;
    console.log('handleSubmit:');
    console.log('story_id: ', storyId);
    console.log('current_act:', currentAct);

    // 基本設定の特定の幕のあらすじを更新する
    if (storyId && currentAct) {
      try {
        console.log(`基本設定の第${currentAct}幕あらすじを更新リクエスト:`, formData.content.substring(0, 200) + '...');
        console.log('basicSetting.id:', basicSetting.id);

        // 特定の幕のあらすじを更新するAPIを呼び出し
        const response = await fetchApi(`/stories/${storyId}/basic-setting/acts/${currentAct}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            basic_setting_id: basicSetting.id,
            content: formData.content
          }),
        });

        console.log(`基本設定の第${currentAct}幕あらすじを更新レスポンス:`, response);

        // エラーチェック - レスポンスにエラーフィールドがある場合
        if (response.error) {
          throw new Error(response.error);
        }

        // 更新成功の場合、基本設定データを再取得して最新情報に更新
        if (refreshBasicSetting && storyId) {
          await refreshBasicSetting(Number(storyId));
        }

        toast({
          title: "基本設定更新",
          description: `基本設定の第${currentAct}幕のあらすじを更新しました`,
        });
      } catch (error) {
        updateSuccess = false;
        console.error('基本設定更新エラー:', error);
        toast({
          title: "エラー",
          description: `基本設定の更新に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
          variant: "destructive",
        });
      }
    }

    // 基本設定の更新に成功した場合のみ、通常のプロット保存処理を実行
    if (updateSuccess) {
      await onSave(formData);
    }
  };

  const handleGenerateDetail = async () => {
    if (!formData.content) return;

    const generatedPlot = await onGenerate(formData);
    if (generatedPlot) {
      console.log('PlotForm - 生成後のPlot:', generatedPlot);
      console.log('PlotForm - 生成後のraw_content:', generatedPlot.raw_content ? '存在します' : 'なし');

      // 基本あらすじを保持したまま、詳細あらすじ（raw_content）だけを更新
      setFormData(prev => ({
        ...prev,
        raw_content: generatedPlot.raw_content,
        // contentは更新しない（現在の値を保持）
      }));
    }
  };

  const handleSaveDetailOnly = async () => {
    if (!formData.raw_content) return;

    setIsSavingDetail(true);
    try {
      await onSave(formData);
    } finally {
      setIsSavingDetail(false);
    }
  };

  useEffect(() => {
    if (plot) {
      // 初期値を設定
      setFormData(plot);
      // 現在の幕を設定
      setCurrentAct(plot.act_number || 1);
      console.log('PlotForm - フォームデータを更新しました:', plot);
    }
  }, [plot]);

  return (
    <form className={styles.formContainer}>
      <Card>
        {/* 詳細あらすじ生成ボタン - フォームの一番上に配置 */}
        <div className="flex justify-between mb-4">
          <Button type="button" variant="outline" onClick={onCancel} className="mr-2">
            キャンセル
          </Button>
          <Button
            type="button"
            onClick={handleGenerateDetail}
            disabled={isGenerating || !formData.content}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                詳細あらすじ生成中...
              </>
            ) : (
              '詳細あらすじを生成（3幕を一括生成します）'
            )}
          </Button>
        </div>
        <CardHeader>
          <CardTitle>{formData.title || `第${currentAct}幕`}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">

            <div className="block mb-10 y-m-10">
              <label className="block text-sm font-medium mb-3">
                基本あらすじ
              </label>
            </div>
            <div className="block mb-10 y-m-20">
              <div>
                <div className={styles.formButtonsRight}>
                  <Button type="button" onClick={handleSubmit} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        保存中...
                      </>
                    ) : (
                      '保存'
                    )}
                  </Button>
                </div>
                <Textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  rows={3}
                  className={styles.textareaStyle}
                />
              </div>
            </div>

            <div className={styles.detailFormContainer}>
              <label className="block text-sm font-medium mb-10">詳細あらすじ</label>
              <div className={styles.formButtons}>
                <Button
                  type="button"
                  onClick={handleSaveDetailOnly}
                  disabled={isSavingDetail || !formData.raw_content}
                >
                  {isSavingDetail ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    '保存'
                  )}
                </Button>
              </div>
              <Textarea
                name="raw_content"
                value={formData.raw_content || ''}
                onChange={handleChange}
                rows={10}
                placeholder="詳細あらすじはまだ生成されていません。「詳細あらすじを生成」ボタンをクリックして生成してください。"
                className={styles.textareaStyle}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
