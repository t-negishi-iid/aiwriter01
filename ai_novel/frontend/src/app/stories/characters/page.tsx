'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Book, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StoryProvider } from '@/components/story/StoryProvider';
import { StoryTabs } from '@/components/story/StoryTabs';
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import styles from './characters.module.css';

// インポートを追加
import { CharacterData } from './lib/types';
import { useCharacters } from './hooks/useCharacters';
import { CharacterList } from './components/CharacterList';
import { CharacterForm } from './components/CharacterForm';
import { BasicSettingCharacterList } from './components/BasicSettingCharacterList';

export default function CharactersPage() {
  const searchParams = useSearchParams();
  const storyId = searchParams.get('id');
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  // カスタムフックを使用
  const {
    characters,
    basicSettingData,
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
    refreshCharacters,
    createCharacterFromBasicSetting
  } = useCharacters(storyId);

  // 新規キャラクター作成ボタンのハンドラー
  const handleAddNewCharacter = () => {
    setSelectedCharacter({
      id: undefined,
      storyId,
      name: '',
      role: '',
      age: '',
      gender: '',
      appearance: '',
      personality: '',
      background: '',
      motivation: '',
      relationship: '',
      development: ''
    });
  };

  useEffect(() => {
    // 画面サイズを検出して、モバイルかどうかを判定
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // 初期チェック
    checkIfMobile();

    // リサイズイベントのリスナーを設定
    window.addEventListener('resize', checkIfMobile);

    // クリーンアップ関数
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // フォームキャンセルハンドラー
  const handleCancelForm = () => {
    setSelectedCharacter(null);
  };

  // ストーリーIDがない場合は、ストーリー一覧に戻る
  useEffect(() => {
    if (!storyId) {
      router.push('/stories');
    }
  }, [storyId, router]);

  if (!storyId) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-gray-500 text-center">ストーリーが選択されていません</p>
      </div>
    );
  }

  return (
    <StoryProvider storyId={storyId}>
      <div className="container mx-auto px-4 py-6">
        <StoryTabs activeTab="characters" storyId={storyId} />

        {isMobile ? (
          // モバイル表示：タブで切り替え
          <div className="mt-6">
            <Tabs defaultValue="character-list">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="character-list" className="flex-1">キャラクター一覧</TabsTrigger>
                <TabsTrigger value="character-edit" className="flex-1">キャラクター編集</TabsTrigger>
              </TabsList>

              <TabsContent value="character-list">
                {isLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-500">読み込み中...</span>
                  </div>
                ) : error ? (
                  <div className="text-center py-10">
                    <p className="text-red-500">{error}</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={refreshCharacters}
                    >
                      再読み込み
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* 作品設定の登場人物 */}
                    {basicSettingCharacters.length > 0 && (
                      <BasicSettingCharacterList
                        basicSettingCharacters={basicSettingCharacters}
                        isLoading={isSaving}
                        onCreateCharacter={createCharacterFromBasicSetting}
                      />
                    )}

                    {/* キャラクターリスト */}
                    <div className="bg-white p-4 rounded-md border border-gray-200">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">キャラクター一覧</h2>
                        <Button onClick={handleAddNewCharacter}>
                          新規作成
                        </Button>
                      </div>

                      {characters.length === 0 ? (
                        <div className="text-center py-6">
                          <User className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500">キャラクターがまだ登録されていません</p>
                        </div>
                      ) : (
                        <CharacterList
                          characters={characters}
                          selectedCharacterId={selectedCharacter?.id}
                          onSelect={(character) => {
                            setSelectedCharacter(character);
                            // モバイル表示の場合は、キャラクターを選択したらキャラクター編集タブに切り替え
                            if (isMobile) {
                              const tabsElement = document.querySelector('[data-value="character-edit"]');
                              if (tabsElement) {
                                (tabsElement as HTMLElement).click();
                              }
                            }
                          }}
                          isMobile={isMobile}
                        />
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="character-edit">
                {selectedCharacter ? (
                  <div className="bg-white p-4 rounded-md border border-gray-200">
                    <h2 className="text-xl font-semibold mb-4">
                      {selectedCharacter.id ? 'キャラクター編集' : '新規キャラクター作成'}
                    </h2>
                    <CharacterForm
                      character={selectedCharacter}
                      onSave={handleSaveCharacter}
                      onCancel={handleCancelForm}
                      onDelete={handleDeleteCharacter}
                      storyId={storyId}
                      isSaving={isSaving}
                    />
                  </div>
                ) : (
                  <div className="bg-gray-50 p-8 rounded-md border border-gray-200 flex flex-col items-center justify-center">
                    <User className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-center mb-4">
                      キャラクター一覧タブからキャラクターを選択するか、新規作成ボタンをクリックしてください。
                    </p>
                    <Button
                      onClick={() => {
                        handleAddNewCharacter();
                      }}
                      className="w-full md:w-auto"
                    >
                      新規キャラクター作成
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          // PC表示：左右に並べる
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px' }}>
            <div className="flex space-x-4">
              <Button
                onClick={handleAddNewCharacter}
                className="w-full md:w-auto"
              >
                新規キャラクター作成
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'row', gap: '24px' }}>
              {/* 左側: キャラクターリスト */}
              <div style={{ width: '50%', position: 'relative' }}>
                {isLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-500">読み込み中...</span>
                  </div>
                ) : error ? (
                  <div className="text-center py-10">
                    <p className="text-red-500">{error}</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={refreshCharacters}
                    >
                      再読み込み
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* 作品設定の登場人物 */}
                    {basicSettingCharacters.length > 0 && (
                      <BasicSettingCharacterList
                        basicSettingCharacters={basicSettingCharacters}
                        isLoading={isSaving}
                        onCreateCharacter={createCharacterFromBasicSetting}
                      />
                    )}

                    {/* キャラクターリスト */}
                    <div className="bg-white p-4 rounded-md border border-gray-200">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">キャラクター一覧</h2>
                        <Button onClick={handleAddNewCharacter}>
                          新規作成
                        </Button>
                      </div>

                      {characters.length === 0 ? (
                        <div className="text-center py-6">
                          <User className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500">キャラクターがまだ登録されていません</p>
                        </div>
                      ) : (
                        <CharacterList
                          characters={characters}
                          selectedCharacterId={selectedCharacter?.id}
                          onSelect={setSelectedCharacter}
                          isMobile={isMobile}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 右側: キャラクター編集フォーム */}
              <div style={{ width: '50%', position: 'relative' }}>
                {selectedCharacter ? (
                  <div className="bg-white p-4 rounded-md border border-gray-200 h-full overflow-y-auto">
                    <h2 className="text-xl font-semibold mb-4">
                      {selectedCharacter.id ? 'キャラクター編集' : '新規キャラクター作成'}
                    </h2>
                    <CharacterForm
                      character={selectedCharacter}
                      onSave={handleSaveCharacter}
                      onCancel={handleCancelForm}
                      onDelete={handleDeleteCharacter}
                      storyId={storyId}
                      isSaving={isSaving}
                    />
                  </div>
                ) : (
                  <div className="bg-gray-50 p-8 rounded-md border border-gray-200 flex flex-col items-center justify-center h-full">
                    <User className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-center mb-4">
                      左側のリストからキャラクターを選択するか、新規作成ボタンをクリックしてください。
                    </p>
                    <Button
                      onClick={handleAddNewCharacter}
                      className="w-full md:w-auto"
                    >
                      新規キャラクター作成
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </StoryProvider>
  );
}
