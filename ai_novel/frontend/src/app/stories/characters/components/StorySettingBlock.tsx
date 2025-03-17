'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import styles from '../characters.module.css';
import { toast } from "@/components/ui/use-toast";
import { useCharacters } from '../hooks/useCharacters';

interface BasicSettingType {
  id?: number;
  story_setting?: string;
  content?: string;
  characters?: string;
  raw_content?: string;
  [key: string]: unknown;
}

interface StorySettingBlockProps {
  storyId: string;
  basicSetting?: BasicSettingType;
}

export const StorySettingBlock = ({
  storyId,
  basicSetting
}: StorySettingBlockProps) => {
  const [editedCharacters, setEditedCharacters] = useState(basicSetting?.characters || '');
  const [isSaving, setIsSaving] = useState(false);

  // useCharactersフックから必要な関数を取得
  const { saveBasicSettingCharacters, resetBasicSettingCharacters } = useCharacters(storyId);

  // basicSettingが変更されたら編集内容も更新
  useEffect(() => {
    if (basicSetting?.characters) {
      setEditedCharacters(basicSetting.characters);
    }
  }, [basicSetting]);

  // 登場人物を保存する処理
  const handleSaveCharacters = async () => {
    if (!basicSetting) return;

    setIsSaving(true);
    try {
      await saveBasicSettingCharacters(editedCharacters);
      toast({
        title: "登場人物を保存しました",
        description: "登場人物情報が正常に保存されました",
      });
    } catch (error) {
      console.error('登場人物保存エラー:', error);
      toast({
        title: "保存に失敗しました",
        description: "エラーが発生しました。もう一度お試しください。",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 登場人物をリセットする処理
  const handleResetCharacters = () => {
    if (!basicSetting || !basicSetting.raw_content) return;

    try {
      // 引数なしでresetBasicSettingCharactersを呼び出す
      const resetText = resetBasicSettingCharacters();
      if (resetText) {
        setEditedCharacters(resetText);
        toast({
          title: "登場人物をリセットしました",
          description: "編集内容が元に戻されました",
        });
      }
    } catch (error) {
      console.error('登場人物リセットエラー:', error);
      toast({
        title: "リセットに失敗しました",
        description: "エラーが発生しました。もう一度お試しください。",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={styles.storySettingBlock}>
      <div className={styles.storySettingHeader}>
        <h2 className="text-lg font-semibold">登場人物設定</h2>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={handleResetCharacters}
            disabled={isSaving}
          >
            リセット
          </Button>
          <Button
            onClick={handleSaveCharacters}
            disabled={isSaving}
          >
            {isSaving ? '保存中...' : '登場人物を保存'}
          </Button>
        </div>
      </div>
      <Textarea
        value={editedCharacters}
        onChange={(e) => setEditedCharacters(e.target.value)}
        placeholder="登場人物情報を入力してください..."
        className="min-h-[300px]"
        style={{ width: '100%', height: '170px', minHeight: '100px', boxSizing: 'border-box', padding: '20px', margin: '0' }}
        disabled={isSaving}
      />
    </div>
  );
};
