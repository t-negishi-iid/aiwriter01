'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Book, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StoryProvider } from '@/components/story/StoryProvider';
import { StoryTabs } from '@/components/story/StoryTabs';
import { plotApi, episodeApi } from '@/lib/api-client';
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// 幕データの型定義
interface ActData {
  id?: number;
  story_id?: string;
  act_number: number;
  title: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

// エピソードデータの型定義
interface EpisodeData {
  id?: number;
  act_id: number;
  episode_number: number;
  title: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

// エピソード内容の型定義
interface EpisodeContentData {
  id?: number;
  episode_id: number;
  content: string;
  created_at?: string;
  updated_at?: string;
}

// 小説本文の型定義
interface NovelContentData {
  id?: number;
  story_id: number;
  content: string;
  created_at?: string;
  updated_at?: string;
}

export default function ContentPage() {
  const searchParams = useSearchParams();
  const storyId = searchParams.get('id');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [acts, setActs] = useState<ActData[]>([]);
  const [selectedAct, setSelectedAct] = useState<ActData | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeData[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<EpisodeData | null>(null);
  const [episodeContent, setEpisodeContent] = useState<EpisodeContentData | null>(null);
  const [novelContent, setNovelContent] = useState<string>('');

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
        // 幕データを取得
        const plotResponse = await plotApi.getPlot(storyId);
        if (plotResponse && Array.isArray(plotResponse)) {
          setActs(plotResponse);
          if (plotResponse.length > 0) {
            setSelectedAct(plotResponse[0]);
            
            // 選択された幕のエピソードを取得
            const actId = plotResponse[0].id;
            if (actId) {
              const episodesResponse = await episodeApi.getActEpisodes(actId);
              if (episodesResponse && Array.isArray(episodesResponse)) {
                setEpisodes(episodesResponse);
                if (episodesResponse.length > 0) {
                  setSelectedEpisode(episodesResponse[0]);
                  
                  // 選択されたエピソードの内容を取得
                  const episodeId = episodesResponse[0].id;
                  if (episodeId) {
                    const contentResponse = await episodeApi.getEpisodeContent(episodeId);
                    setEpisodeContent(contentResponse);
                    
                    // エピソードの内容を小説本文として初期設定
                    if (contentResponse && contentResponse.content) {
                      setNovelContent(contentResponse.content);
                    }
                  }
                }
              }
            }
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

  // 幕選択時のハンドラ
  const handleSelectAct = async (act: ActData) => {
    setSelectedAct(act);
    if (act.id) {
      try {
        setIsLoading(true);
        // 選択された幕のエピソードを取得
        const episodesResponse = await episodeApi.getActEpisodes(act.id);
        if (episodesResponse && Array.isArray(episodesResponse)) {
          setEpisodes(episodesResponse);
          if (episodesResponse.length > 0) {
            setSelectedEpisode(episodesResponse[0]);
            
            // 選択されたエピソードの内容を取得
            const episodeId = episodesResponse[0].id;
            if (episodeId) {
              const contentResponse = await episodeApi.getEpisodeContent(episodeId);
              setEpisodeContent(contentResponse);
              
              // エピソードの内容を小説本文として設定
              if (contentResponse && contentResponse.content) {
                setNovelContent(contentResponse.content);
              } else {
                setNovelContent('');
              }
            }
          } else {
            setSelectedEpisode(null);
            setEpisodeContent(null);
            setNovelContent('');
          }
        }
      } catch (err) {
        console.error("エピソード取得エラー:", err);
        toast({
          title: "エラー",
          description: "エピソードの取得に失敗しました。",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // エピソード選択時のハンドラ
  const handleSelectEpisode = async (episode: EpisodeData) => {
    // 現在の小説内容が変更されている場合、確認ダイアログを表示
    if (episodeContent && episodeContent.content !== novelContent) {
      if (!window.confirm('変更内容が保存されていません。エピソードを切り替えると変更内容が失われます。続行しますか？')) {
        return;
      }
    }
    
    setSelectedEpisode(episode);
    if (episode.id) {
      try {
        setIsLoading(true);
        // 選択されたエピソードの内容を取得
        const contentResponse = await episodeApi.getEpisodeContent(episode.id);
        setEpisodeContent(contentResponse);
        
        // エピソードの内容を小説本文として設定
        if (contentResponse && contentResponse.content) {
          setNovelContent(contentResponse.content);
        } else {
          setNovelContent('');
        }
      } catch (err) {
        console.error("エピソード内容取得エラー:", err);
        toast({
          title: "エラー",
          description: "エピソード内容の取得に失敗しました。",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 小説本文変更ハンドラ
  const handleNovelContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNovelContent(e.target.value);
  };

  // 小説本文保存ハンドラ
  const handleSaveNovelContent = async () => {
    if (!selectedEpisode || !selectedEpisode.id) {
      toast({
        title: "エラー",
        description: "保存するエピソードが選択されていません。",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      // エピソード内容を保存
      const contentData = episodeContent ? {
        ...episodeContent,
        content: novelContent,
        episode_id: selectedEpisode.id
      } : {
        content: novelContent,
        episode_id: selectedEpisode.id
      };
      
      await episodeApi.updateEpisodeContent(selectedEpisode.id, contentData);
      
      // 保存後に最新のエピソード内容を取得
      const updatedContent = await episodeApi.getEpisodeContent(selectedEpisode.id);
      setEpisodeContent(updatedContent);

      toast({
        title: "成功",
        description: "小説本文が保存されました。",
      });
    } catch (err) {
      console.error("小説本文保存エラー:", err);
      toast({
        title: "エラー",
        description: "小説本文の保存に失敗しました。",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // エピソード内容生成ハンドラ
  const handleGenerateEpisodeContent = async () => {
    if (!storyId || !selectedEpisode || !selectedEpisode.id) {
      toast({
        title: "エラー",
        description: "エピソードが選択されていません。",
        variant: "destructive"
      });
      return;
    }

    // 現在の小説内容が変更されている場合、確認ダイアログを表示
    if (episodeContent && episodeContent.content !== novelContent) {
      if (!window.confirm('変更内容が保存されていません。内容を生成すると変更内容が失われます。続行しますか？')) {
        return;
      }
    }

    setIsGenerating(true);
    try {
      await episodeApi.createEpisodeContent(String(storyId), selectedEpisode.id);
      
      toast({
        title: "成功",
        description: "エピソード内容生成タスクが開始されました。生成完了までしばらくお待ちください。",
      });
      
      // 5秒後にエピソード内容を再取得
      setTimeout(async () => {
        try {
          const contentResponse = await episodeApi.getEpisodeContent(selectedEpisode.id);
          setEpisodeContent(contentResponse);
          
          // エピソードの内容を小説本文として設定
          if (contentResponse && contentResponse.content) {
            setNovelContent(contentResponse.content);
          }
        } catch (e) {
          console.error("エピソード内容再取得エラー:", e);
        }
      }, 5000);
      
    } catch (err) {
      console.error("エピソード内容生成エラー:", err);
      toast({
        title: "エラー",
        description: "エピソード内容の生成に失敗しました。",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!storyId) {
    return <div>小説IDが指定されていません</div>;
  }

  return (
    <StoryProvider storyId={storyId}>
      <StoryTabs storyId={storyId} activeTab="content" />
      
      {isMobile ? (
        // モバイル表示：タブで切り替え
        <Tabs defaultValue="episode-list" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="episode-list">エピソード一覧</TabsTrigger>
            <TabsTrigger value="novel-content">小説本文</TabsTrigger>
          </TabsList>

          <div className="flex space-x-4 mt-4 mb-4">
            <Button 
              onClick={handleGenerateEpisodeContent} 
              disabled={isGenerating || isSaving || !selectedEpisode}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : 'エピソード内容生成'}
            </Button>
            <Button 
              onClick={handleSaveNovelContent} 
              disabled={isSaving || !selectedEpisode}
              className="ml-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : '小説本文保存'}
            </Button>
          </div>

          <TabsContent value="episode-list">
            <Card className="w-full h-full">
              <CardHeader>
                <CardTitle>エピソード一覧</CardTitle>
                <CardDescription>各幕のエピソード一覧</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">読み込み中...</span>
                  </div>
                ) : acts.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {acts.map((act) => (
                        <Button 
                          key={act.id} 
                          variant={selectedAct?.id === act.id ? "default" : "outline"}
                          className="w-full"
                          onClick={() => handleSelectAct(act)}
                        >
                          {act.act_number}幕
                        </Button>
                      ))}
                    </div>
                    
                    {selectedAct && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-1">幕タイトル</label>
                          <input
                            type="text"
                            className="w-full p-2 border rounded-md"
                            value={selectedAct.title}
                            readOnly
                            aria-label="幕タイトル"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">幕あらすじ</label>
                          <textarea
                            className="w-full min-h-[100px] p-2 border rounded-md"
                            value={selectedAct.description}
                            readOnly
                            aria-label="幕あらすじ"
                          />
                        </div>
                        
                        <div className="mt-6">
                          <h3 className="text-lg font-medium mb-2">エピソード一覧</h3>
                          {episodes.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                              {episodes.map((episode) => (
                                <Button 
                                  key={episode.id} 
                                  variant={selectedEpisode?.id === episode.id ? "default" : "outline"}
                                  className="w-full"
                                  onClick={() => handleSelectEpisode(episode)}
                                >
                                  {episode.episode_number}話: {episode.title}
                                </Button>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-muted-foreground">
                                この幕にはエピソードがありません
                              </p>
                              <Button 
                                onClick={() => router.push(`/stories/episodes?id=${storyId}`)}
                                className="mt-2"
                              >
                                エピソード管理へ
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        {selectedEpisode && (
                          <div className="mt-4">
                            <h3 className="text-lg font-medium mb-2">選択中のエピソード</h3>
                            <div>
                              <label className="block text-sm font-medium mb-1">タイトル</label>
                              <input
                                type="text"
                                className="w-full p-2 border rounded-md"
                                value={selectedEpisode.title}
                                readOnly
                                aria-label="エピソードタイトル"
                              />
                            </div>
                            <div className="mt-2">
                              <label className="block text-sm font-medium mb-1">概要</label>
                              <textarea
                                className="w-full min-h-[100px] p-2 border rounded-md"
                                value={selectedEpisode.description}
                                readOnly
                                aria-label="エピソード概要"
                              />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">あらすじがまだ作成されていません</h3>
                    <p className="text-muted-foreground mb-6">
                      あらすじタブで「あらすじ生成」ボタンをクリックして、あらすじを自動生成してください
                    </p>
                    <Button onClick={() => router.push(`/stories/plot?id=${storyId}`)}>
                      あらすじページへ移動
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="novel-content">
            <Card className="w-full h-full">
              <CardHeader>
                <CardTitle>小説本文</CardTitle>
                <CardDescription>
                  {selectedEpisode 
                    ? `${selectedAct?.act_number || ''}幕 ${selectedEpisode.episode_number}話: ${selectedEpisode.title}` 
                    : 'エピソードを選択してください'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">読み込み中...</span>
                  </div>
                ) : selectedEpisode ? (
                  <Textarea
                    className="w-full min-h-[500px] p-2 border rounded-md font-serif"
                    value={novelContent}
                    onChange={handleNovelContentChange}
                    placeholder="小説本文を入力してください"
                    aria-label="小説本文"
                  />
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">エピソードが選択されていません</h3>
                    <p className="text-muted-foreground mb-6">
                      左側のエピソード一覧から編集するエピソードを選択してください
                    </p>
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
              onClick={handleGenerateEpisodeContent} 
              disabled={isGenerating || isSaving || !selectedEpisode}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : 'エピソード内容生成'}
            </Button>
            <Button 
              onClick={handleSaveNovelContent} 
              disabled={isSaving || !selectedEpisode}
              className="ml-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : '小説本文保存'}
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', gap: '24px' }}>
            {/* 左側：エピソード一覧 */}
            <div style={{ width: '40%', position: 'relative' }}>
              <Card className="w-full h-full">
                <CardHeader>
                  <CardTitle>エピソード一覧</CardTitle>
                  <CardDescription>各幕のエピソード一覧</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLoading ? (
                    <div className="flex justify-center items-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2">読み込み中...</span>
                    </div>
                  ) : acts.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {acts.map((act) => (
                          <Button 
                            key={act.id} 
                            variant={selectedAct?.id === act.id ? "default" : "outline"}
                            className="w-full"
                            onClick={() => handleSelectAct(act)}
                          >
                            {act.act_number}幕
                          </Button>
                        ))}
                      </div>
                      
                      {selectedAct && (
                        <>
                          <div>
                            <label className="block text-sm font-medium mb-1">幕タイトル</label>
                            <input
                              type="text"
                              className="w-full p-2 border rounded-md"
                              value={selectedAct.title}
                              readOnly
                              aria-label="幕タイトル"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">幕あらすじ</label>
                            <textarea
                              className="w-full min-h-[100px] p-2 border rounded-md"
                              value={selectedAct.description}
                              readOnly
                              aria-label="幕あらすじ"
                            />
                          </div>
                          
                          <div className="mt-6">
                            <h3 className="text-lg font-medium mb-2">エピソード一覧</h3>
                            {episodes.length > 0 ? (
                              <div className="grid grid-cols-2 gap-2">
                                {episodes.map((episode) => (
                                  <Button 
                                    key={episode.id} 
                                    variant={selectedEpisode?.id === episode.id ? "default" : "outline"}
                                    className="w-full"
                                    onClick={() => handleSelectEpisode(episode)}
                                  >
                                    {episode.episode_number}話: {episode.title}
                                  </Button>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-4">
                                <p className="text-muted-foreground">
                                  この幕にはエピソードがありません
                                </p>
                                <Button 
                                  onClick={() => router.push(`/stories/episodes?id=${storyId}`)}
                                  className="mt-2"
                                >
                                  エピソード管理へ
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          {selectedEpisode && (
                            <div className="mt-4">
                              <h3 className="text-lg font-medium mb-2">選択中のエピソード</h3>
                              <div>
                                <label className="block text-sm font-medium mb-1">タイトル</label>
                                <input
                                  type="text"
                                  className="w-full p-2 border rounded-md"
                                  value={selectedEpisode.title}
                                  readOnly
                                  aria-label="エピソードタイトル"
                                />
                              </div>
                              <div className="mt-2">
                                <label className="block text-sm font-medium mb-1">概要</label>
                                <textarea
                                  className="w-full min-h-[100px] p-2 border rounded-md"
                                  value={selectedEpisode.description}
                                  readOnly
                                  aria-label="エピソード概要"
                                />
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">あらすじがまだ作成されていません</h3>
                      <p className="text-muted-foreground mb-6">
                        あらすじタブで「あらすじ生成」ボタンをクリックして、あらすじを自動生成してください
                      </p>
                      <Button onClick={() => router.push(`/stories/plot?id=${storyId}`)}>
                        あらすじページへ移動
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 右側：小説本文 */}
            <div style={{ width: '60%' }}>
              <Card className="w-full h-full">
                <CardHeader>
                  <CardTitle>小説本文</CardTitle>
                  <CardDescription>
                    {selectedEpisode 
                      ? `${selectedAct?.act_number || ''}幕 ${selectedEpisode.episode_number}話: ${selectedEpisode.title}` 
                      : 'エピソードを選択してください'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center items-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2">読み込み中...</span>
                    </div>
                  ) : selectedEpisode ? (
                    <Textarea
                      className="w-full min-h-[600px] p-2 border rounded-md font-serif"
                      value={novelContent}
                      onChange={handleNovelContentChange}
                      placeholder="小説本文を入力してください"
                      aria-label="小説本文"
                    />
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">エピソードが選択されていません</h3>
                      <p className="text-muted-foreground mb-6">
                        左側のエピソード一覧から編集するエピソードを選択してください
                      </p>
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
