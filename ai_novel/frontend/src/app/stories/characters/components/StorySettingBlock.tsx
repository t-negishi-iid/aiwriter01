'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import styles from '../characters.module.css';
import { toast } from "@/components/ui/use-toast";
import { useCharacters } from '../hooks/useCharacters';
import { CharacterData } from '../lib/types';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [debugText, setDebugText] = useState(''); // デバッグ用テキスト

  // useCharactersフックから必要な関数を取得
  const {
    saveBasicSettingCharacters,
    resetBasicSettingCharacters,
    handleSaveCharacter,
    refreshCharacters
  } = useCharacters(storyId);

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

  // キャラクターを分割して一覧に反映する処理
  const handleCreateCharactersFromText = async () => {
    if (!storyId || !editedCharacters) return;

    setIsProcessing(true);
    try {
      // テキストからキャラクターを抽出
      const characters = parseCharactersFromText(editedCharacters);

      // デバッグ用に分割結果を表示
      const debugOutput = characters.map(char => {
        return `=== キャラクター: ${char.name} ===\n役割: ${char.role}\n説明:\n${char.background}\n\n元のテキスト:\n${char.raw_content}`;
      }).join('\n\n============================\n\n');

      setDebugText(debugOutput);

      if (characters.length === 0) {
        toast({
          title: "キャラクターが見つかりませんでした",
          description: "テキスト形式を確認してください。キャラクター名と役割が必要です。",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "キャラクターを分割しました",
        description: `${characters.length}人のキャラクターを抽出しました`,
      });

      // 各キャラクターを保存
      let successCount = 0;
      for (const character of characters) {
        try {
          await handleSaveCharacter({
            ...character,
            storyId
          });
          successCount++;
        } catch (err) {
          console.error(`キャラクター「${character.name}」の保存に失敗:`, err);
        }
      }

      // キャラクター一覧を更新
      await refreshCharacters();

      toast({
        title: "キャラクターを一覧に反映しました",
        description: `${successCount}人のキャラクターを保存しました`,
      });

    } catch (error) {
      console.error('キャラクター分割エラー:', error);
      toast({
        title: "処理に失敗しました",
        description: "エラーが発生しました。もう一度お試しください。",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // テキストからキャラクターを抽出する関数
  const parseCharactersFromText = (text: string): CharacterData[] => {
    const characters: CharacterData[] = [];

    // 前処理: 「---」を削除（改行は保持）
    const characterSection = text.replace(/---/g, '');

    console.log('前処理後のテキスト:', characterSection.substring(0, 500) + '...');

    const characterRegex = /(?:^|\n)### ([^#\n][^\n]*)/g;

    // マッチした結果をデバッグ表示
    const testMatches = characterSection.match(/(?:^|\n)### ([^#\n][^\n]*)/g);
    if (testMatches) {
      console.log('### で始まる行のマッチ結果:', testMatches.map(m => m.replace(/^\n/, '')));
    } else {
      console.log('### で始まる行のマッチ結果: なし');
    }

    // 各キャラクターの開始位置を検出
    const characterStartPositions = [];
    let characterMatch;

    // 正規表現をリセット
    characterRegex.lastIndex = 0;

    while ((characterMatch = characterRegex.exec(characterSection)) !== null) {
      // マッチした文字列の先頭に改行がある場合は、その分インデックスを調整
      const matchedString = characterMatch[0];
      const nameStartsAt = matchedString.startsWith('\n') ? 1 : 0;

      console.log('characterMatch', characterMatch);
      console.log('マッチした文字列:', matchedString);
      console.log('キャラクター名:', characterMatch[1].trim());

      characterStartPositions.push({
        name: characterMatch[1].trim(),
        position: characterMatch.index + nameStartsAt
      });
    }

    console.log('検出されたキャラクター数:', characterStartPositions.length);

    // 各キャラクターブロックを抽出
    for (let i = 0; i < characterStartPositions.length; i++) {
      const current = characterStartPositions[i];
      const next = i < characterStartPositions.length - 1 ? characterStartPositions[i + 1] : null;

      // 現在のキャラクターから次のキャラクターまで（または文字列の終わりまで）を抽出
      const blockEnd = next ? next.position : characterSection.length;
      const block = characterSection.substring(current.position, blockEnd);

      console.log(`キャラクター ${i + 1}:`, current.name);
      console.log(`ブロック内容:`, block.substring(0, 50) + '...');

      // 役割を抽出
      let role = '不明';
      const roleRegex = /#### 役割\s*\n([^\n]+)/;
      const roleMatch = block.match(roleRegex);

      if (roleMatch) {
        role = roleMatch[1].trim();
        console.log(`役割:`, role);
      } else {
        console.log(`役割が見つかりませんでした`);
      }

      // 説明を抽出
      const appearance = '';
      const personality = '';
      let background = '';

      const descriptionRegex = /#### 説明\s*\n([\s\S]+?)(?=####|$)/;
      const descriptionMatch = block.match(descriptionRegex);

      if (descriptionMatch) {
        const description = descriptionMatch[1].trim();
        console.log(`説明:`, description.substring(0, 30) + '...');
        background = description;
      } else {
        console.log(`説明が見つかりませんでした`);
      }

      // キャラクターを追加
      characters.push({
        name: current.name,
        role,
        appearance,
        personality,
        background,
        raw_content: block.trim(),
        storyId
      });

      console.log(`キャラクター "${current.name}" を追加しました`);
    }

    console.log('抽出されたキャラクター数:', characters.length);
    return characters;
  };

  return (
    <div className={styles.storySettingBlock}>
      <div className={styles.storySettingHeader}>
        <h2 className="text-lg font-semibold">登場人物設定</h2>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={handleResetCharacters}
            disabled={isSaving || isProcessing}
          >
            リセット
          </Button>
          <Button
            variant="outline"
            onClick={handleCreateCharactersFromText}
            disabled={isSaving || isProcessing}
          >
            {isProcessing ? '処理中...' : 'キャラを分割'}
          </Button>
          <Button
            onClick={handleSaveCharacters}
            disabled={isSaving || isProcessing}
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
        disabled={isSaving || isProcessing}
      />

      {/* デバッグ用テキストエリア */}
      <div className="mt-4">
        <h3 className="text-md font-semibold mb-2">分割結果（デバッグ用）</h3>
        <Textarea
          value={debugText}
          readOnly
          className="min-h-[300px]"
          style={{ width: '100%', height: '300px', minHeight: '200px', boxSizing: 'border-box', padding: '20px', margin: '0' }}
        />
      </div>
    </div >
  );
};
