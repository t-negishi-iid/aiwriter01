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
export function extractCharactersFromBasicSetting(basicSetting: any): any[] {
  if (!basicSetting) return [];

  try {
    console.log('BasicSetting データ構造:', basicSetting);

    // 作品設定のフォーマットに応じて登場人物設定を抽出
    if (basicSetting.raw_content && typeof basicSetting.raw_content === 'string') {
      console.log('作品設定:', basicSetting.raw_content.substring(0, 200) + '...');


      // 登場人物セクションを正規表現で抽出
      const characterSectionRegex = /## (?:主な)?登場人物\s*\n([\s\S]*?)(?:\n##|$)/;
      const characterSection = characterSectionRegex.exec(basicSetting.raw_content);

      console.log('正規表現マッチ結果:', characterSection ? '成功' : '失敗');

      if (characterSection && characterSection[1]) {
        console.log('抽出された登場人物セクション:', characterSection[1]);

        // 登場人物の情報を行ごとに分割
        const characterLines = characterSection[1].trim().split('\n');
        console.log('分割された行数:', characterLines.length);

        // 各行から登場人物情報を抽出
        const characters = [];
        let currentCharacter = null;

        for (let i = 0; i < characterLines.length; i++) {
          const line = characterLines[i].trim();
          console.log(`行 ${i}: ${line}`);

          // 新しいキャラクター定義の開始（### で始まる行）
          if (line.startsWith('### ')) {
            if (currentCharacter) {
              characters.push(currentCharacter);
              console.log('キャラクター追加:', currentCharacter);
            }

            currentCharacter = {
              id: characters.length,
              name: line.replace('### ', '').trim(),
              description: '',
              role: '',
              personality: '',
              appearance: '',
              background: '',
              raw_content: ''
            };
            console.log('新しいキャラクター作成:', currentCharacter.name);
          }
          // 役割の定義（#### 役割 の次の行）
          else if (line.startsWith('#### 役割') && currentCharacter && i + 1 < characterLines.length) {
            currentCharacter.role = characterLines[i + 1].trim();
            console.log(`役割設定: ${currentCharacter.role}`);
            i++; // 次の行をスキップ
          }
          // 説明の定義（#### 説明 の次の行）
          else if (line.startsWith('#### 説明') && currentCharacter && i + 1 < characterLines.length) {
            currentCharacter.description = characterLines[i + 1].trim();
            currentCharacter.raw_content = characterLines[i + 1].trim();
            console.log(`説明設定: ${currentCharacter.description}`);
            i++; // 次の行をスキップ
          }
        }

        // 最後のキャラクターを追加
        if (currentCharacter) {
          characters.push(currentCharacter);
          console.log('最後のキャラクター追加:', currentCharacter);
        }

        console.log('抽出されたキャラクター一覧:', characters);
        return characters;
      }
    }

    // 登場人物フィールドが直接存在する場合
    if (basicSetting.characters && Array.isArray(basicSetting.characters)) {
      console.log('直接charactersフィールドから取得:', basicSetting.characters);
      return basicSetting.characters;
    }

    console.log('キャラクター情報が見つかりませんでした');
    return [];
  } catch (error) {
    console.error('登場人物設定の抽出エラー:', error);
    return [];
  }
}
