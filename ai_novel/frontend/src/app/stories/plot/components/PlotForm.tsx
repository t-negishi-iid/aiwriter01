'use client';

import { useState, useEffect } from 'react';
import { PlotData } from '../lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import styles from '../plot-detail.module.css';

interface PlotFormProps {
  plot: PlotData;
  isSaving: boolean;
  isGenerating: boolean;
  onSave: (plot: PlotData) => Promise<boolean>;
  onDelete: (plotId: number) => Promise<boolean>;
  onGenerate: (plot: PlotData) => Promise<PlotData | null>;
  onCancel: () => void;
}

export function PlotForm({
  plot,
  isSaving,
  isGenerating,
  onSave,
  onDelete,
  onGenerate,
  onCancel
}: PlotFormProps) {
  const [formData, setFormData] = useState<PlotData>(plot);
  const [isSavingDetail, setIsSavingDetail] = useState(false);

  // plotが変更されたらフォームデータを更新
  useEffect(() => {
    setFormData(plot);
  }, [plot]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  const handleDelete = async () => {
    if (!formData.id) return;

    if (window.confirm('このあらすじを削除してもよろしいですか？')) {
      const success = await onDelete(formData.id);
      if (success) {
        onCancel();
      }
    }
  };

  const handleGenerateDetail = async () => {
    if (!formData.content) return;

    const generatedPlot = await onGenerate(formData);
    if (generatedPlot) {
      setFormData(generatedPlot);
    }
  };

  const handleSaveDetailOnly = async () => {
    if (!formData.detailedContent) return;

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
              '詳細あらすじを生成'
            )}
          </Button>
        </div>
        <CardHeader>
          <CardTitle>{formData.title || '新規あらすじ'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">

            <div>
              <label className="block text-sm font-medium mb-10">基本あらすじ</label>
              <Textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                rows={5}
                placeholder="基本あらすじを入力してください"
                className={styles.textareaStyle}
              />
            </div>

            <div className={styles.formButtons}>
              <div className={styles.formButtonsLeft}>
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
                name="detailedContent"
                value={formData.detailedContent || ''}
                onChange={handleChange}
                rows={10}
                placeholder="詳細あらすじはまだ生成されていません。「詳細あらすじを生成」ボタンをクリックして生成してください。"
                className={styles.textareaStyle}
              />
              <div className={styles.detailFormButtons}>
                <Button
                  type="button"
                  onClick={handleSaveDetailOnly}
                  disabled={isSavingDetail || !formData.detailedContent}
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
