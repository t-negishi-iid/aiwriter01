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

export default function EpisodesPage() {
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
            }
          } else {
            setSelectedEpisode(null);
            setEpisodeContent(null);
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
    setSelectedEpisode(episode);
    if (episode.id) {
      try {
        setIsLoading(true);
        // 選択されたエピソードの内容を取得
        const contentResponse = await episodeApi.getEpisodeContent(episode.id);
        setEpisodeContent(contentResponse);
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

  // エピソード保存ハンドラ
  const handleSaveEpisode = async () => {
    if (!selectedAct || !selectedAct.id || !selectedEpisode || !selectedEpisode.id) {
      toast({
        title: "エラー",
        description: "保存するエピソードが選択されていません。",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      // エピソード情報を保存
      const episodeData = {
        ...selectedEpisode,
        act_id: selectedAct.id
      };
      await episodeApi.updateEpisode(selectedAct.id, selectedEpisode.id, episodeData);

      // エピソード内容を保存
      if (episodeContent && episodeContent.content) {
        const contentData = {
          ...episodeContent,
          episode_id: selectedEpisode.id
        };
        await episodeApi.updateEpisodeContent(selectedEpisode.id, contentData);
      }

      toast({
        title: "成功",
        description: "エピソードが保存されました。",
      });
    } catch (err) {
      console.error("エピソード保存エラー:", err);
      toast({
        title: "エラー",
        description: "エピソードの保存に失敗しました。",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // エピソード生成ハンドラ
  const handleGenerateEpisodes = async () => {
    if (!storyId) {
      toast({
        title: "エラー",
        description: "小説IDが指定されていません。",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      await episodeApi.createEpisodes(storyId);
      
      toast({
        title: "成功",
        description: "エピソード生成タスクが開始されました。生成完了までしばらくお待ちください。",
      });
      
      // 5秒後にデータを再取得
      setTimeout(async () => {
        try {
          // 幕データを再取得
          const plotResponse = await plotApi.getPlot(storyId);
          if (plotResponse && Array.isArray(plotResponse)) {
            setActs(plotResponse);
            if (plotResponse.length > 0) {
              const firstAct = plotResponse[0];
              setSelectedAct(firstAct);
              
              // 選択された幕のエピソードを取得
              if (firstAct.id) {
                const episodesResponse = await episodeApi.getActEpisodes(firstAct.id);
                if (episodesResponse && Array.isArray(episodesResponse)) {
                  setEpisodes(episodesResponse);
                  if (episodesResponse.length > 0) {
                    setSelectedEpisode(episodesResponse[0]);
                    
                    // 選択されたエピソードの内容を取得
                    const episodeId = episodesResponse[0].id;
                    if (episodeId) {
                      const contentResponse = await episodeApi.getEpisodeContent(episodeId);
                      setEpisodeContent(contentResponse);
                    }
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error("データ再取得エラー:", e);
        }
      }, 5000);
      
    } catch (err) {
      console.error("エピソード生成エラー:", err);
      toast({
        title: "エラー",
        description: "エピソードの生成に失敗しました。",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
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

    setIsGenerating(true);
    try {
      await episodeApi.createEpisodeContent(storyId, selectedEpisode.id);
      
      toast({
        title: "成功",
        description: "エピソード内容生成タスクが開始されました。生成完了までしばらくお待ちください。",
      });
      
      // 5秒後にエピソード内容を再取得
      setTimeout(async () => {
        try {
          const contentResponse = await episodeApi.getEpisodeContent(selectedEpisode.id);
          setEpisodeContent(contentResponse);
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

  // エピソードフィールド変更ハンドラ
  const handleEpisodeChange = (field: keyof EpisodeData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (selectedEpisode) {
      setSelectedEpisode({
        ...selectedEpisode,
        [field]: e.target.value
      });
    }
  };

  // エピソード内容変更ハンドラ
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (episodeContent) {
      setEpisodeContent({
        ...episodeContent,
        content: e.target.value
      });
    } else if (selectedEpisode) {
      setEpisodeContent({
        episode_id: selectedEpisode.id!,
        content: e.target.value
      });
    }
  };

  if (!storyId) {
    return <div>小説IDが指定されていません</div>;
  }

  return (
    <StoryProvider storyId={storyId}>
      <StoryTabs storyId={storyId} activeTab="episodes" />
      
      {isMobile ? (
        // モバイル表示：タブで切り替え
        <Tabs defaultValue="plot-summary" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="plot-summary">あらすじ詳細</TabsTrigger>
            <TabsTrigger value="episode-detail">エピソード詳細</TabsTrigger>
          </TabsList>

          <div className="flex space-x-4 mt-4 mb-4">
            <Button 
              onClick={handleGenerateEpisodes} 
              disabled={isGenerating || isSaving}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : 'エピソード生成'}
            </Button>
            <Button 
              onClick={handleGenerateEpisodeContent} 
              disabled={isGenerating || isSaving || !selectedEpisode}
              className="ml-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : 'エピソード内容生成'}
            </Button>
            <Button 
              onClick={handleSaveEpisode} 
              disabled={isSaving || !selectedEpisode}
              className="ml-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : 'エピソード保存'}
            </Button>
          </div>

          <TabsContent value="plot-summary">
            <Card className="w-full h-full">
              <CardHeader>
                <CardTitle>あらすじ詳細</CardTitle>
                <CardDescription>各幕のあらすじ詳細</CardDescription>
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
                          <label className="block text-sm font-medium mb-1">タイトル</label>
                          <input
                            type="text"
                            className="w-full p-2 border rounded-md"
                            value={selectedAct.title}
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">詳細</label>
                          <textarea
                            className="w-full min-h-[400px] p-2 border rounded-md"
                            value={selectedAct.description}
                            readOnly
                          />
                        </div>
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

          <TabsContent value="episode-detail">
            <Card className="w-full h-full">
              <CardHeader>
                <CardTitle>エピソード詳細</CardTitle>
                <CardDescription>各エピソードの詳細情報</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">読み込み中...</span>
                  </div>
                ) : episodes.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {episodes.map((episode) => (
                        <Button 
                          key={episode.id} 
                          variant={selectedEpisode?.id === episode.id ? "default" : "outline"}
                          className="w-full"
                          onClick={() => handleSelectEpisode(episode)}
                        >
                          {episode.episode_number}話
                        </Button>
                      ))}
                    </div>
                    
                    {selectedEpisode && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-1">タイトル</label>
                          <input
                            type="text"
                            className="w-full p-2 border rounded-md"
                            value={selectedEpisode.title}
                            onChange={handleEpisodeChange('title')}
                            placeholder="エピソードのタイトル"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">概要</label>
                          <textarea
                            className="w-full min-h-[100px] p-2 border rounded-md"
                            value={selectedEpisode.description}
                            onChange={handleEpisodeChange('description')}
                            placeholder="エピソードの概要"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">内容</label>
                          <textarea
                            className="w-full min-h-[400px] p-2 border rounded-md"
                            value={episodeContent?.content || ''}
                            onChange={handleContentChange}
                            placeholder="エピソードの内容"
                          />
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">エピソードがまだ作成されていません</h3>
                    <p className="text-muted-foreground mb-6">
                      「エピソード生成」ボタンをクリックして、エピソードを自動生成してください
                    </p>
                    <Button onClick={handleGenerateEpisodes}>
                      エピソード生成
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
              onClick={handleGenerateEpisodes} 
              disabled={isGenerating || isSaving}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : 'エピソード生成'}
            </Button>
            <Button 
              onClick={handleGenerateEpisodeContent} 
              disabled={isGenerating || isSaving || !selectedEpisode}
              className="ml-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : 'エピソード内容生成'}
            </Button>
            <Button 
              onClick={handleSaveEpisode} 
              disabled={isSaving || !selectedEpisode}
              className="ml-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : 'エピソード保存'}
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', gap: '24px' }}>
            {/* 左側：あらすじ詳細 */}
            <div style={{ width: '40%', position: 'relative' }}>
              <Card className="w-full h-full">
                <CardHeader>
                  <CardTitle>あらすじ詳細</CardTitle>
                  <CardDescription>各幕のあらすじ詳細</CardDescription>
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
                            <label className="block text-sm font-medium mb-1">タイトル</label>
                            <input
                              type="text"
                              className="w-full p-2 border rounded-md"
                              value={selectedAct.title}
                              readOnly
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">詳細</label>
                            <textarea
                              className="w-full min-h-[300px] p-2 border rounded-md"
                              value={selectedAct.description}
                              readOnly
                            />
                          </div>
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

            {/* 右側：エピソード詳細 */}
            <div style={{ width: '60%', position: 'relative' }}>
              <Card className="w-full h-full">
                <CardHeader>
                  <CardTitle>エピソード詳細</CardTitle>
                  <CardDescription>各エピソードの詳細情報</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoading ? (
                    <div className="flex justify-center items-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2">読み込み中...</span>
                    </div>
                  ) : episodes.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        {episodes.map((episode) => (
                          <Button 
                            key={episode.id} 
                            variant={selectedEpisode?.id === episode.id ? "default" : "outline"}
                            className="w-full"
                            onClick={() => handleSelectEpisode(episode)}
                          >
                            {episode.episode_number}話
                          </Button>
                        ))}
                      </div>
                      
                      {selectedEpisode && (
                        <>
                          <div>
                            <label className="block text-sm font-medium mb-1">タイトル</label>
                            <input
                              type="text"
                              className="w-full p-2 border rounded-md"
                              value={selectedEpisode.title}
                              onChange={handleEpisodeChange('title')}
                              placeholder="エピソードのタイトル"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">概要</label>
                            <textarea
                              className="w-full min-h-[100px] p-2 border rounded-md"
                              value={selectedEpisode.description}
                              onChange={handleEpisodeChange('description')}
                              placeholder="エピソードの概要"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">内容</label>
                            <textarea
                              className="w-full min-h-[300px] p-2 border rounded-md"
                              value={episodeContent?.content || ''}
                              onChange={handleContentChange}
                              placeholder="エピソードの内容"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">エピソードがまだ作成されていません</h3>
                      <p className="text-muted-foreground mb-6">
                        「エピソード生成」ボタンをクリックして、エピソードを自動生成してください
                      </p>
                      <Button onClick={handleGenerateEpisodes}>
                        エピソード生成
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
