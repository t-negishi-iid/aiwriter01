'use client';

import { useState, useEffect } from 'react';
import { PlotData, BasicSetting } from '../lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import styles from '../plot-detail.module.css';

interface PlotFormProps {
  plot: PlotData;
  basicSetting?: BasicSetting | null;
  isSaving: boolean;
  isGenerating: boolean;
  onSave: (plot: PlotData) => Promise<boolean>;
  onGenerate: (plot: PlotData) => Promise<PlotData | null>;
  onCancel: () => void;
}

export function PlotForm({
  plot,
  basicSetting,
  isSaving,
  isGenerating,
  onSave,
  onGenerate,
  onCancel
}: PlotFormProps) {
  const [formData, setFormData] = useState<PlotData>(plot);
  const [isSavingDetail, setIsSavingDetail] = useState(false);

  // plotが変更されたらフォームデータを更新
  useEffect(() => {
    console.log('PlotForm - plot変更検知:', plot);
    console.log('PlotForm - raw_content:', plot.raw_content ? '存在します' : 'なし');
    setFormData(plot);
  }, [plot]);

  // コンポーネントマウント時にフォームデータの状態をログ出力
  useEffect(() => {
    console.log('PlotForm - マウント時のformData:', formData);
    console.log('PlotForm - マウント時のraw_content:', formData.raw_content ? '存在します' : 'なし');
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  const handleGenerateDetail = async () => {
    if (!formData.content) return;

    const generatedPlot = await onGenerate(formData);
    if (generatedPlot) {
      console.log('PlotForm - 生成後のPlot:', generatedPlot);
      console.log('PlotForm - 生成後のraw_content:', generatedPlot.raw_content ? '存在します' : 'なし');
      setFormData(generatedPlot);
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

  return (
    <form onSubmit={handleSubmit} className={styles.formContainer}>
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
          <CardTitle>{formData.title || '新規あらすじ'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">

            <div>
              <label className="block text-sm font-medium mb-3">基本あらすじ</label>
              {basicSetting ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">第1幕</label>
                    <Textarea
                      readOnly
                      value={basicSetting.act1_overview || ''}
                      rows={3}
                      className={styles.textareaStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">第2幕</label>
                    <Textarea
                      readOnly
                      value={basicSetting.act2_overview || ''}
                      rows={3}
                      className={styles.textareaStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">第3幕</label>
                    <Textarea
                      readOnly
                      value={basicSetting.act3_overview || ''}
                      rows={3}
                      className={styles.textareaStyle}
                    />
                  </div>
                </div>
              ) : (
                <Textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  rows={5}
                  placeholder="基本あらすじを入力してください"
                  className={styles.textareaStyle}
                />
              )}
            </div>

            <div className={styles.formButtons}>
              <div className={styles.formButtonsLeft}>
                {/* 削除ボタンを削除 */}
              </div>
              <div className={styles.formButtonsRight}>
                <Button type="submit" disabled={isSaving}>
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
            </div>

            <div className={styles.detailFormContainer}>
              <label className="block text-sm font-medium mb-10">詳細あらすじ</label>
              <Textarea
                name="raw_content"
                value={formData.raw_content || ''}
                onChange={handleChange}
                rows={10}
                placeholder="詳細あらすじはまだ生成されていません。「詳細あらすじを生成」ボタンをクリックして生成してください。"
                className={styles.textareaStyle}
              />
              <div className={styles.detailFormButtons}>
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
                    '詳細を保存'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
