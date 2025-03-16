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

  // ページ読み込み時に、キャラクターが選択されていない場合は新規キャラクター作成フォームを表示
  useEffect(() => {
    if (!isLoading && !selectedCharacter && characters.length === 0) {
      handleAddNewCharacter();
    } else if (!isLoading && !selectedCharacter && characters.length > 0) {
      // 既存のキャラクターがある場合は、最初のキャラクターを選択
      setSelectedCharacter(characters[0]);
    }
  }, [isLoading, characters]);

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
          <div className={styles.mobileContainer}>
            <Tabs defaultValue="character-list">
              <TabsList className={styles.tabsList}>
                <TabsTrigger value="character-list" className={styles.tabsTrigger}>キャラクター一覧</TabsTrigger>
                <TabsTrigger value="character-edit" className={styles.tabsTrigger}>キャラクター編集</TabsTrigger>
              </TabsList>

              <TabsContent value="character-list">
                {isLoading ? (
                  <div className={styles.loadingContainer}>
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-500">読み込み中...</span>
                  </div>
                ) : error ? (
                  <div className={styles.errorContainer}>
                    <p className="text-red-500">{error}</p>
                    <Button
                      variant="outline"
                      className={styles.refreshButton}
                      onClick={refreshCharacters}
                    >
                      再読み込み
                    </Button>
                  </div>
                ) : (
                  <div className={styles.characterListContainer}>
                    {/* 作品設定ブロック */}
                    <div className={styles.settingBlock}>
                      <div className={styles.settingBlockHeader}>
                        <h2 className="text-xl font-semibold">作品設定</h2>
                      </div>
                      <div className={styles.settingBlockContent}>
                        <p className="text-gray-600 mb-2">作品設定からキャラクターを作成できます。</p>
                        <Button 
                          variant="outline" 
                          onClick={() => router.push(`/stories/${storyId}/settings`)}
                          className="w-full"
                        >
                          作品設定を編集
                        </Button>
                      </div>
                    </div>

                    {/* 作品設定の登場人物 */}
                    {basicSettingCharacters.length > 0 && (
                      <BasicSettingCharacterList
                        basicSettingCharacters={basicSettingCharacters}
                        isLoading={isSaving}
                        onCreateCharacter={createCharacterFromBasicSetting}
                      />
                    )}

                    {/* キャラクターリスト */}
                    <div className={styles.characterList}>
                      <div className={styles.characterListHeader}>
                        <h2 className="text-xl font-semibold">キャラクター一覧</h2>
                        <Button onClick={handleAddNewCharacter}>
                          新規作成
                        </Button>
                      </div>

                      {characters.length === 0 ? (
                        <div className={styles.noCharactersContainer}>
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
                  <div className={styles.characterFormContainer}>
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
                  <div className={styles.noCharacterSelectedContainer}>
                    <User className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-center mb-4">
                      キャラクター一覧タブからキャラクターを選択するか、新規作成ボタンをクリックしてください。
                    </p>
                    <Button
                      onClick={() => {
                        handleAddNewCharacter();
                      }}
                      className={styles.createButton}
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
          <div className={styles.pcContainer}>
            <div className={styles.buttonContainer}>
              <Button
                onClick={handleAddNewCharacter}
                className={styles.createButton}
              >
                新規キャラクター作成
              </Button>
            </div>

            <div className={styles.contentContainer}>
              {/* 左側: キャラクターリスト */}
              <div className={styles.characterListContainer}>
                {isLoading ? (
                  <div className={styles.loadingContainer}>
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-500">読み込み中...</span>
                  </div>
                ) : error ? (
                  <div className={styles.errorContainer}>
                    <p className="text-red-500">{error}</p>
                    <Button
                      variant="outline"
                      className={styles.refreshButton}
                      onClick={refreshCharacters}
                    >
                      再読み込み
                    </Button>
                  </div>
                ) : (
                  <div className={styles.characterList}>
                    {/* 作品設定ブロック */}
                    <div className={styles.settingBlock}>
                      <div className={styles.settingBlockHeader}>
                        <h2 className="text-xl font-semibold">作品設定</h2>
                      </div>
                      <div className={styles.settingBlockContent}>
                        <p className="text-gray-600 mb-2">作品設定からキャラクターを作成できます。</p>
                        <Button 
                          variant="outline" 
                          onClick={() => router.push(`/stories/${storyId}/settings`)}
                          className="w-full"
                        >
                          作品設定を編集
                        </Button>
                      </div>
                    </div>

                    {/* 作品設定の登場人物 */}
                    {basicSettingCharacters.length > 0 && (
                      <BasicSettingCharacterList
                        basicSettingCharacters={basicSettingCharacters}
                        isLoading={isSaving}
                        onCreateCharacter={createCharacterFromBasicSetting}
                      />
                    )}

                    {/* キャラクターリスト */}
                    <div className={styles.characterListHeader}>
                      <h2 className="text-xl font-semibold">キャラクター一覧</h2>
                      <Button onClick={handleAddNewCharacter}>
                        新規作成
                      </Button>
                    </div>

                    {characters.length === 0 ? (
                      <div className={styles.noCharactersContainer}>
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
                )}
              </div>

              {/* 右側: キャラクター編集フォーム */}
              <div className={styles.characterFormContainer}>
                {selectedCharacter ? (
                  <div className={styles.characterForm}>
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
                  <div className={styles.noCharacterSelectedContainer}>
                    <User className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-center mb-4">
                      左側のリストからキャラクターを選択するか、新規作成ボタンをクリックしてください。
                    </p>
                    <Button
                      onClick={handleAddNewCharacter}
                      className={styles.createButton}
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
