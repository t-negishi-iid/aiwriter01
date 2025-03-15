'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Book } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { StoryProvider } from '@/components/story/StoryProvider';
import { StoryTabs } from '@/components/story/StoryTabs';
import { basicSettingApi, characterApi } from '@/lib/api-client';
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// キャラクターデータの型定義
interface CharacterData {
  id?: number;
  storyId: string | null;
  name: string;
  role: string;
  personality: string;
  background: string;
  appearance: string;
  goal: string;
  conflict: string;
  growth: string;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function CharactersPage() {
  const searchParams = useSearchParams();
  const storyId = searchParams.get('id');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [basicSettingData, setBasicSettingData] = useState<any>(null);
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterData | null>(null);

  // 折りたたみ状態の管理
  const [showBasicSettingCharacters, setShowBasicSettingCharacters] = useState(true);
  const [showCharacterList, setShowCharacterList] = useState(true);

  // WorldSettingSelectorと同様のスタイル
  const leftAlignedHeaderStyle = {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    backgroundColor: '#f0f7ff',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    marginBottom: '1rem'
  };

  const expandIconStyle = {
    fontSize: '1rem',
    color: '#3498db',
    marginRight: '0.5rem'
  };

  const categoryTitleStyle = {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    margin: 0,
    color: '#2c3e50'
  };

  useEffect(() => {
    // 画面サイズを検出して、モバイルかどうかを判定
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // 初期チェック
    checkIfMobile();

    // リサイズイベントのリスナーを追加
    window.addEventListener('resize', checkIfMobile);

    // クリーンアップ
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!storyId) return;

      setIsLoading(true);
      setError(null);

      try {
        // 基本設定データを取得
        const basicSettingResponse = await basicSettingApi.getBasicSetting(storyId);
        setBasicSettingData(basicSettingResponse);

        // キャラクターデータを取得
        const charactersResponse = await characterApi.getCharacters(storyId);
        if (charactersResponse && Array.isArray(charactersResponse)) {
          setCharacters(charactersResponse);
          if (charactersResponse.length > 0) {
            setSelectedCharacter(charactersResponse[0]);
          }
        }
      } catch (err) {
        console.error("データ取得エラー:", err);
        setError("データの取得に失敗しました。");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [storyId]);

  // キャラクター保存ハンドラ
  const handleSaveCharacter = async () => {
    if (!storyId || !selectedCharacter) {
      toast({
        title: "エラー",
        description: "キャラクターデータがありません。",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        ...selectedCharacter,
        story_id: storyId
      };

      let response;
      if (selectedCharacter.id) {
        response = await characterApi.updateCharacter(storyId, selectedCharacter.id, data);
      } else {
        response = await characterApi.createCharacter(storyId, data);
      }

      // キャラクターリストを更新
      const updatedCharacters = await characterApi.getCharacters(storyId);
      if (updatedCharacters && Array.isArray(updatedCharacters)) {
        setCharacters(updatedCharacters);
        
        // 新しく作成したキャラクターを選択
        const updatedCharacter = updatedCharacters.find(c => c.id === response.id);
        if (updatedCharacter) {
          setSelectedCharacter(updatedCharacter);
        }
      }

      toast({
        title: "成功",
        description: "キャラクターが保存されました。",
      });
    } catch (err) {
      console.error("キャラクター保存エラー:", err);
      toast({
        title: "エラー",
        description: "キャラクターの保存に失敗しました。",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 新規キャラクター作成ハンドラ
  const handleCreateNewCharacter = () => {
    setSelectedCharacter({
      storyId: storyId,
      name: '',
      role: '',
      personality: '',
      background: '',
      appearance: '',
      goal: '',
      conflict: '',
      growth: '',
      notes: ''
    });
  };

  // キャラクター選択ハンドラ
  const handleSelectCharacter = (character: CharacterData) => {
    setSelectedCharacter(character);
  };

  // キャラクターフィールド変更ハンドラ
  const handleCharacterChange = (field: keyof CharacterData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (selectedCharacter) {
      setSelectedCharacter({
        ...selectedCharacter,
        [field]: e.target.value
      });
    }
  };

  if (!storyId) {
    return <div>小説IDが指定されていません</div>;
  }

  return (
    <StoryProvider storyId={storyId}>
      <StoryTabs storyId={storyId} activeTab="characters" />
      
      {isMobile ? (
        // モバイル表示：タブで切り替え
        <Tabs defaultValue="basic-characters" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic-characters">基本設定の登場人物</TabsTrigger>
            <TabsTrigger value="character-detail">キャラクター詳細</TabsTrigger>
          </TabsList>

          <div className="flex space-x-4 mt-4 mb-4">
            <Button 
              onClick={handleSaveCharacter} 
              disabled={isSaving || !selectedCharacter}
              className="ml-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : 'キャラクター保存'}
            </Button>
          </div>

          <TabsContent value="basic-characters">
            <Card className="w-full h-full">
              <CardHeader>
                <CardTitle>基本設定の登場人物</CardTitle>
                <CardDescription>小説の基本設定に含まれる登場人物情報</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">読み込み中...</span>
                  </div>
                ) : basicSettingData && basicSettingData.characters ? (
                  <div className="bg-white border border-gray-200 rounded-md p-0 mb-4 overflow-y-auto max-h-[500px] w-full h-full">
                    <div className="w-full h-full p-5">
                      <textarea
                        className="w-full border-none bg-transparent resize-none outline-none"
                        value={basicSettingData.characters}
                        readOnly
                        placeholder="基本設定の登場人物情報"
                        style={{ width: '100%', minHeight: '400px', boxSizing: 'border-box', padding: '20px', margin: '0' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">基本設定の登場人物情報がありません</h3>
                    <p className="text-muted-foreground mb-6">
                      基本設定タブで登場人物情報を作成してください
                    </p>
                    <Button onClick={() => router.push(`/stories/basic-setting?id=${storyId}`)}>
                      基本設定ページへ移動
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="mt-6">
              <Card className="w-full h-full">
                <CardHeader>
                  <CardTitle>キャラクターリスト</CardTitle>
                  <CardDescription>作成済みのキャラクター一覧</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLoading ? (
                    <div className="flex justify-center items-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2">読み込み中...</span>
                    </div>
                  ) : characters.length > 0 ? (
                    <div className="space-y-2">
                      {characters.map((character) => (
                        <div 
                          key={character.id} 
                          className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 ${selectedCharacter?.id === character.id ? 'bg-blue-50 border-blue-300' : ''}`}
                          onClick={() => handleSelectCharacter(character)}
                        >
                          <h3 className="font-medium">{character.name}</h3>
                          <p className="text-sm text-gray-500">{character.role}</p>
                        </div>
                      ))}
                      <Button 
                        className="w-full mt-4" 
                        variant="outline"
                        onClick={handleCreateNewCharacter}
                      >
                        新規キャラクター作成
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="mb-4">キャラクターがまだ作成されていません</p>
                      <Button 
                        onClick={handleCreateNewCharacter}
                      >
                        新規キャラクター作成
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="character-detail">
            <Card className="w-full h-full">
              <CardHeader>
                <CardTitle>キャラクター詳細</CardTitle>
                <CardDescription>キャラクターの詳細情報</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedCharacter ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">名前</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded-md"
                        value={selectedCharacter.name}
                        onChange={handleCharacterChange('name')}
                        placeholder="キャラクターの名前"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">役割</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded-md"
                        value={selectedCharacter.role}
                        onChange={handleCharacterChange('role')}
                        placeholder="主人公、ヒロイン、敵役など"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">性格</label>
                      <textarea
                        className="w-full min-h-[100px] p-2 border rounded-md"
                        value={selectedCharacter.personality}
                        onChange={handleCharacterChange('personality')}
                        placeholder="キャラクターの性格特性"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">背景</label>
                      <textarea
                        className="w-full min-h-[100px] p-2 border rounded-md"
                        value={selectedCharacter.background}
                        onChange={handleCharacterChange('background')}
                        placeholder="キャラクターの過去や背景"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">外見</label>
                      <textarea
                        className="w-full min-h-[100px] p-2 border rounded-md"
                        value={selectedCharacter.appearance}
                        onChange={handleCharacterChange('appearance')}
                        placeholder="キャラクターの外見的特徴"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">目標</label>
                      <textarea
                        className="w-full min-h-[100px] p-2 border rounded-md"
                        value={selectedCharacter.goal}
                        onChange={handleCharacterChange('goal')}
                        placeholder="キャラクターの目標や動機"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">葛藤</label>
                      <textarea
                        className="w-full min-h-[100px] p-2 border rounded-md"
                        value={selectedCharacter.conflict}
                        onChange={handleCharacterChange('conflict')}
                        placeholder="キャラクターが直面する葛藤"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">成長</label>
                      <textarea
                        className="w-full min-h-[100px] p-2 border rounded-md"
                        value={selectedCharacter.growth}
                        onChange={handleCharacterChange('growth')}
                        placeholder="キャラクターの成長や変化"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">備考</label>
                      <textarea
                        className="w-full min-h-[100px] p-2 border rounded-md"
                        value={selectedCharacter.notes}
                        onChange={handleCharacterChange('notes')}
                        placeholder="その他の特記事項"
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">キャラクターが選択されていません</h3>
                    <p className="text-muted-foreground mb-6">
                      左側のリストからキャラクターを選択するか、新規作成してください
                    </p>
                    <Button onClick={handleCreateNewCharacter}>
                      新規キャラクター作成
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        // PC表示：左右に並べる
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px' }}>
          <div className="flex space-x-4">
            <Button 
              variant="outline"
              onClick={handleCreateNewCharacter}
            >
              新規キャラクター作成
            </Button>
            <Button
              onClick={handleSaveCharacter} 
              disabled={isSaving || !selectedCharacter}
              className="ml-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : 'キャラクター保存'}
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', gap: '24px' }}>
            {/* 左側：基本設定の登場人物とキャラクターリスト */}
            <div style={{ width: '50%', position: 'relative' }}>
              <Card className="w-full h-full mb-6">
                <CardHeader>
                  <CardTitle>基本設定の登場人物</CardTitle>
                  <CardDescription>小説の基本設定に含まれる登場人物情報</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLoading ? (
                    <div className="flex justify-center items-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2">読み込み中...</span>
                    </div>
                  ) : basicSettingData && basicSettingData.characters ? (
                    <div className="bg-white border border-gray-200 rounded-md p-0 mb-4 overflow-y-auto max-h-[300px] w-full">
                      <div className="w-full h-full p-5">
                        <textarea
                          className="w-full border-none bg-transparent resize-none outline-none"
                          value={basicSettingData.characters}
                          readOnly
                          placeholder="基本設定の登場人物情報"
                          style={{ width: '100%', minHeight: '200px', boxSizing: 'border-box', padding: '20px', margin: '0' }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">基本設定の登場人物情報がありません</h3>
                      <p className="text-muted-foreground mb-6">
                        基本設定タブで登場人物情報を作成してください
                      </p>
                      <Button onClick={() => router.push(`/stories/basic-setting?id=${storyId}`)}>
                        基本設定ページへ移動
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="w-full h-full">
                <CardHeader>
                  <CardTitle>キャラクターリスト</CardTitle>
                  <CardDescription>作成済みのキャラクター一覧</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLoading ? (
                    <div className="flex justify-center items-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2">読み込み中...</span>
                    </div>
                  ) : characters.length > 0 ? (
                    <div className="space-y-2">
                      {characters.map((character) => (
                        <div 
                          key={character.id} 
                          className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 ${selectedCharacter?.id === character.id ? 'bg-blue-50 border-blue-300' : ''}`}
                          onClick={() => handleSelectCharacter(character)}
                        >
                          <h3 className="font-medium">{character.name}</h3>
                          <p className="text-sm text-gray-500">{character.role}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="mb-4">キャラクターがまだ作成されていません</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 右側：キャラクター詳細 */}
            <div style={{ width: '50%', position: 'relative' }}>
              <Card className="w-full h-full">
                <CardHeader>
                  <CardTitle>キャラクター詳細</CardTitle>
                  <CardDescription>キャラクターの詳細情報</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedCharacter ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1">名前</label>
                        <input
                          type="text"
                          className="w-full p-2 border rounded-md"
                          value={selectedCharacter.name}
                          onChange={handleCharacterChange('name')}
                          placeholder="キャラクターの名前"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">役割</label>
                        <input
                          type="text"
                          className="w-full p-2 border rounded-md"
                          value={selectedCharacter.role}
                          onChange={handleCharacterChange('role')}
                          placeholder="主人公、ヒロイン、敵役など"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">性格</label>
                        <textarea
                          className="w-full min-h-[100px] p-2 border rounded-md"
                          value={selectedCharacter.personality}
                          onChange={handleCharacterChange('personality')}
                          placeholder="キャラクターの性格特性"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">背景</label>
                        <textarea
                          className="w-full min-h-[100px] p-2 border rounded-md"
                          value={selectedCharacter.background}
                          onChange={handleCharacterChange('background')}
                          placeholder="キャラクターの過去や背景"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">外見</label>
                        <textarea
                          className="w-full min-h-[100px] p-2 border rounded-md"
                          value={selectedCharacter.appearance}
                          onChange={handleCharacterChange('appearance')}
                          placeholder="キャラクターの外見的特徴"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">目標</label>
                        <textarea
                          className="w-full min-h-[100px] p-2 border rounded-md"
                          value={selectedCharacter.goal}
                          onChange={handleCharacterChange('goal')}
                          placeholder="キャラクターの目標や動機"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">葛藤</label>
                        <textarea
                          className="w-full min-h-[100px] p-2 border rounded-md"
                          value={selectedCharacter.conflict}
                          onChange={handleCharacterChange('conflict')}
                          placeholder="キャラクターが直面する葛藤"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">成長</label>
                        <textarea
                          className="w-full min-h-[100px] p-2 border rounded-md"
                          value={selectedCharacter.growth}
                          onChange={handleCharacterChange('growth')}
                          placeholder="キャラクターの成長や変化"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">備考</label>
                        <textarea
                          className="w-full min-h-[100px] p-2 border rounded-md"
                          value={selectedCharacter.notes}
                          onChange={handleCharacterChange('notes')}
                          placeholder="その他の特記事項"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">キャラクターが選択されていません</h3>
                      <p className="text-muted-foreground mb-6">
                        左側のリストからキャラクターを選択するか、新規作成してください
                      </p>
                      <Button onClick={handleCreateNewCharacter}>
                        新規キャラクター作成
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </StoryProvider>
  );
}
