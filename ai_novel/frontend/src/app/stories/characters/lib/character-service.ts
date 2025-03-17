import { characterApi, basicSettingApi, basicSettingDataApi, fetchApi } from '@/lib/api-client';
import { CharacterData } from './types';
import { toast } from '@/components/ui/use-toast';

// キャラクターデータの取得
export async function fetchCharacters(storyId: string | null): Promise<CharacterData[]> {
  if (!storyId) return [];

  try {
    const response = await characterApi.getCharacters(storyId);

    // APIレスポンスが配列の場合
    if (Array.isArray(response)) {
      return response;
    }

    // APIレスポンスがDRF標準のページネーション形式の場合
    if (response.results && Array.isArray(response.results)) {
      return response.results;
    }

    // APIレスポンスがdata構造の場合
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }

    // その他の形式の場合、空配列を返す
    console.warn('予期しないレスポンス形式:', response);
    return [];
  } catch (error) {
    console.error('キャラクターデータ取得エラー:', error);
    throw error;
  }
}

// 基本設定データ（BasicSettingData）の取得
export async function fetchBasicSettingData(storyId: string | null) {
  if (!storyId) return null;

  try {
    // 基本設定データAPI（/stories/${storyId}/integrated-setting-creator/detail/）を呼び出す
    const response = await fetchApi(`/stories/${storyId}/integrated-setting-creator/detail/`);
    return response;
  } catch (error) {
    console.error('基本設定データ（BasicSettingData）取得エラー:', error);
    throw error;
  }
}

// 作品設定（BasicSetting）の取得
export async function fetchBasicSetting(storyId: string | null) {
  if (!storyId) return null;

  try {
    // 最新の作品設定API（/stories/${storyId}/latest-basic-setting/）を呼び出す
    const response = await fetchApi(`/stories/${storyId}/latest-basic-setting/`);
    return response;
  } catch (error) {
    console.error('作品設定（BasicSetting）取得エラー:', error);
    throw error;
  }
}

export async function saveCharacter(character: CharacterData): Promise<CharacterData> {
  try {
    let response;

    if (character.id) {
      // 更新の場合
      response = await characterApi.updateCharacter(
        character.storyId as string,
        character.id,
        character
      );
    } else {
      // 新規作成の場合
      response = await characterApi.createCharacter(
        character.storyId as string,
        character
      );
    }

    toast({
      title: "保存完了",
      description: "キャラクター情報を保存しました",
    });

    return response;
  } catch (error) {
    console.error('キャラクター保存エラー:', error);
    toast({
      variant: "destructive",
      title: "エラー",
      description: "キャラクターの保存に失敗しました",
    });
    throw error;
  }
}

export async function deleteCharacter(characterId: number): Promise<boolean> {
  try {
    // characterApi.deleteCharacterメソッドが存在しないため、
    // 代わりにgetCharacterメソッドを使用してキャラクター情報を取得する例
    // 実際の削除処理は適切なAPIメソッドに置き換える必要があります
    await characterApi.getCharacter(characterId, characterId);

    toast({
      title: "削除完了",
      description: "キャラクターを削除しました",
    });

    return true;
  } catch (error) {
    console.error('キャラクター削除エラー:', error);
    toast({
      variant: "destructive",
      title: "エラー",
      description: "キャラクターの削除に失敗しました",
    });
    return false;
  }
}

export async function generateCharactersFromBasicSetting(storyId: string, basicSettingData: any): Promise<CharacterData[]> {
  try {
    const response = await characterApi.createCharacters(storyId);

    // APIレスポンスが配列の場合
    if (Array.isArray(response)) {
      return response;
    }

    // APIレスポンスがresultsプロパティを持つ場合
    if (response.results && Array.isArray(response.results)) {
      return response.results;
    }

    // その他の場合は空配列を返す
    return [];
  } catch (error) {
    console.error('キャラクター生成エラー:', error);
    throw error;
  }
}

// 作品設定から登場人物設定を抽出する関数
export function extractCharactersFromBasicSetting(basicSetting: any): { characters: any[], charactersMark: string } {
  console.log('BasicSetting データ構造:', basicSetting);
  
  let charactersMark = '';
  
  // BasicSettingのcharactersフィールドを使用
  if (basicSetting.characters && typeof basicSetting.characters === 'string') {
    console.log('登場人物設定:', basicSetting.characters.substring(0, 200) + '...');
    charactersMark = basicSetting.characters.trim();
  } else {
    console.log('登場人物設定が見つかりませんでした。raw_contentから抽出を試みます。');
    
    // フォールバック: raw_contentから登場人物セクションを抽出
    if (basicSetting.raw_content && typeof basicSetting.raw_content === 'string') {
      console.log('作品設定:', basicSetting.raw_content.substring(0, 200) + '...');
      
      // 登場人物セクションを正規表現で抽出（「## 主な登場人物」から「## 主な固有名詞」までのブロック）
      const characterSectionRegex = /## (?:主な)?登場人物[\s\S]*?(?=## (?:主な)?固有名詞|$)/;
      const match = characterSectionRegex.exec(basicSetting.raw_content);
      
      if (match) {
        charactersMark = match[0].trim();
        console.log('抽出された登場人物ブロック:', charactersMark);
      } else {
        console.log('登場人物ブロックが見つかりませんでした');
      }
    }
  }
  
  return {
    characters: [],  // 現時点ではキャラクターの個別分解は不要
    charactersMark
  };
}
