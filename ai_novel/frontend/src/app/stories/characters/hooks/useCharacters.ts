import { useState, useEffect } from 'react';
import { CharacterData } from '../lib/types';
import {
  fetchCharacters,
  fetchBasicSettingData,
  fetchBasicSetting,
  extractCharactersFromBasicSetting,
  saveCharacter,
  deleteCharacter,
  generateCharactersFromBasicSetting
} from '../lib/character-service';
import { toast } from '@/components/ui/use-toast';

export function useCharacters(storyId: string | null) {
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [basicSettingData, setBasicSettingData] = useState<any>(null);
  const [basicSetting, setBasicSetting] = useState<any>(null);
  const [basicSettingCharacters, setBasicSettingCharacters] = useState<CharacterData[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 初期データ取得
  useEffect(() => {
    if (!storyId) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 並行して基本設定データ、作品設定、キャラクターを取得
        const [charactersData, basicSettingData, basicSetting] = await Promise.all([
          fetchCharacters(storyId),
          fetchBasicSettingData(storyId),
          fetchBasicSetting(storyId)
        ]);

        console.log('BasicSetting データ構造:', basicSetting);

        setCharacters(charactersData);
        setBasicSettingData(basicSettingData);
        setBasicSetting(basicSetting);

        // 作品設定から登場人物情報を抽出
        if (basicSetting) {
          const extractedCharacters = extractCharactersFromBasicSetting(basicSetting);
          setBasicSettingCharacters(extractedCharacters);
        }
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError('データの取得に失敗しました。');
        toast({
          variant: "destructive",
          title: "エラー",
          description: "データの取得に失敗しました。",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [storyId]);

  // キャラクター保存
  const handleSaveCharacter = async (character: CharacterData) => {
    if (!storyId) return;

    setIsSaving(true);
    try {
      const savedCharacter = await saveCharacter(character);

      // 既存キャラクターの更新か新規作成かを判断
      if (character.id) {
        // 既存のキャラクターを更新
        setCharacters(prev =>
          prev.map(c => c.id === character.id ? savedCharacter : c)
        );
      } else {
        // 新しいキャラクターを追加
        setCharacters(prev => [...prev, savedCharacter]);
      }

      // 選択状態を更新
      setSelectedCharacter(savedCharacter);

      toast({
        title: "保存完了",
        description: "キャラクター情報を保存しました",
      });
    } catch (err) {
      console.error('キャラクター保存エラー:', err);
      toast({
        variant: "destructive",
        title: "エラー",
        description: "キャラクター情報の保存に失敗しました",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // キャラクター削除
  const handleDeleteCharacter = async (characterId: number) => {
    setIsSaving(true);
    try {
      const success = await deleteCharacter(characterId);
      if (success) {
        // キャラクターリストから削除
        setCharacters(prev => prev.filter(c => c.id !== characterId));

        // 選択中のキャラクターが削除された場合、選択状態をクリア
        if (selectedCharacter?.id === characterId) {
          setSelectedCharacter(null);
        }

        toast({
          title: "削除完了",
          description: "キャラクターを削除しました",
        });
      }
    } catch (err) {
      console.error('キャラクター削除エラー:', err);
      toast({
        variant: "destructive",
        title: "エラー",
        description: "キャラクターの削除に失敗しました",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 基本設定からキャラクターを生成
  const handleGenerateFromBasicSetting = async () => {
    if (!storyId || !basicSettingData) return;

    setIsGenerating(true);
    try {
      const generatedCharacters = await generateCharactersFromBasicSetting(
        storyId,
        basicSettingData
      );

      // 生成されたキャラクターを追加
      setCharacters(prev => {
        // 既存のキャラクター名をマップ
        const existingNames = new Set(prev.map(c => c.name));

        // 重複しないキャラクターだけ追加
        const newCharacters = generatedCharacters.filter(c => !existingNames.has(c.name));

        return [...prev, ...newCharacters];
      });

      toast({
        title: "生成完了",
        description: `${generatedCharacters.length}人のキャラクターを生成しました`,
      });
    } catch (err) {
      console.error('キャラクター生成エラー:', err);
      toast({
        variant: "destructive",
        title: "エラー",
        description: "キャラクターの生成に失敗しました",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 作品設定の登場人物からキャラクターを作成
  const createCharacterFromBasicSetting = (character: CharacterData) => {
    // 新規キャラクターとして保存するための処理
    const newCharacter: CharacterData = {
      ...character,
      id: undefined, // 新規作成のためIDを削除
      storyId: storyId as string,
    };

    handleSaveCharacter(newCharacter);
  };

  // 再読み込み
  const refreshCharacters = async () => {
    if (!storyId) return;

    setIsLoadingCharacters(true);
    try {
      const charactersData = await fetchCharacters(storyId);
      setCharacters(charactersData);

      toast({
        title: "更新完了",
        description: "キャラクター一覧を更新しました",
      });
    } catch (err) {
      console.error('キャラクター再読み込みエラー:', err);
      toast({
        variant: "destructive",
        title: "エラー",
        description: "キャラクターの再読み込みに失敗しました",
      });
    } finally {
      setIsLoadingCharacters(false);
    }
  };

  return {
    characters,
    basicSettingData,
    basicSetting,
    basicSettingCharacters,
    selectedCharacter,
    isLoading,
    isLoadingCharacters,
    isSaving,
    isGenerating,
    error,
    setSelectedCharacter,
    handleSaveCharacter,
    handleDeleteCharacter,
    handleGenerateFromBasicSetting,
    createCharacterFromBasicSetting,
    refreshCharacters
  };
}
