'use client';

import { useEffect, useState } from "react";
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StoryProvider } from '@/components/story/StoryProvider';
import { StoryTabs } from '@/components/story/StoryTabs';
import { toast } from "@/components/ui/use-toast";
import { ActDetailApi, episodeApi } from '@/lib/unified-api-client';
import { ActDetail, EpisodeDetail } from '@/lib/unified-api-client';

export default function ContentPage() {
  const searchParams = useSearchParams();
  const storyId = searchParams.get('id');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acts, setActs] = useState<ActDetail[]>([]);
  const [selectedAct, setSelectedAct] = useState<ActDetail | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeDetail[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<EpisodeDetail | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!storyId) return;

      setIsLoading(true);
      setError(null);

      try {
        // 幕データを取得
        const actsResponse = await ActDetailApi.getActDetails(storyId);
        if (actsResponse && actsResponse.results && actsResponse.results.length > 0) {
          setActs(actsResponse.results);
          const firstAct = actsResponse.results[0];
          setSelectedAct(firstAct);

          // 選択された幕のエピソード一覧を取得
          try {
            const episodesResponse = await episodeApi.getActEpisodes(storyId, firstAct.act_number);
            if (episodesResponse && episodesResponse.results && episodesResponse.results.length > 0) {
              setEpisodes(episodesResponse.results);
              const firstEpisode = episodesResponse.results[0];
              setSelectedEpisode(firstEpisode);
              setEditedContent(firstEpisode.content);
            } else {
              setEpisodes([]);
              setSelectedEpisode(null);
              setEditedContent('');
            }
          } catch (episodeErr) {
            console.error("エピソード一覧取得エラー:", episodeErr);
            setEpisodes([]);
            setEditedContent('');
          }
        } else {
          setActs([]);
          setSelectedAct(null);
          setEpisodes([]);
          setSelectedEpisode(null);
          setEditedContent('');
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
  const handleSelectAct = async (act: ActDetail) => {
    setSelectedAct(act);
    try {
      setIsLoading(true);
      // 選択された幕のエピソード一覧を取得
      const episodesResponse = await episodeApi.getActEpisodes(storyId!, act.act_number);
      if (episodesResponse && episodesResponse.results && episodesResponse.results.length > 0) {
        setEpisodes(episodesResponse.results);
        const firstEpisode = episodesResponse.results[0];
        setSelectedEpisode(firstEpisode);
        setEditedContent(firstEpisode.content);
      } else {
        setEpisodes([]);
        setSelectedEpisode(null);
        setEditedContent('');
      }
    } catch (episodeErr) {
      console.error("エピソード一覧取得エラー:", episodeErr);
      toast({
        title: "エラー",
        description: "エピソード一覧の取得に失敗しました。",
        variant: "destructive"
      });
      setEpisodes([]);
      setSelectedEpisode(null);
      setEditedContent('');
    } finally {
      setIsLoading(false);
    }
  };

  // エピソード選択時のハンドラ
  const handleSelectEpisode = (episode: EpisodeDetail) => {
    setSelectedEpisode(episode);
    setEditedContent(episode.content);
  };

  // エピソード内容の変更ハンドラ
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(e.target.value);
  };

  // エピソード内容の保存ハンドラ
  const handleSaveContent = async () => {
    if (!selectedEpisode || !selectedAct) return;
    
    try {
      setIsSaving(true);
      // APIを呼び出してエピソード内容を更新
      await episodeApi.updateEpisodeContent(
        storyId!, 
        selectedAct.act_number, 
        selectedEpisode.id, 
        {
          title: selectedEpisode.title,
          content: editedContent
        }
      );
      
      // 更新成功メッセージ
      toast({
        title: "保存完了",
        description: "エピソード内容を保存しました。",
      });
      
      // エピソード一覧を更新
      const updatedEpisode = {...selectedEpisode, content: editedContent};
      setEpisodes(prev => prev.map(ep => ep.id === selectedEpisode.id ? updatedEpisode : ep));
      setSelectedEpisode(updatedEpisode);
    } catch (err) {
      console.error("エピソード保存エラー:", err);
      toast({
        title: "エラー",
        description: "エピソード内容の保存に失敗しました。",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!storyId) {
    return <div>小説IDが指定されていません</div>;
  }

  return (
    <StoryProvider storyId={storyId}>
      <StoryTabs storyId={storyId} activeTab="content" />

      <div style={{ display: 'flex', flexDirection: 'row', gap: '24px', marginTop: '24px' }}>
        {/* 左側：エピソード一覧 */}
        <div style={{ width: '40%', position: 'relative' }}>
          <Card className="w-full h-[calc(100vh-200px)]">
            <CardHeader>
              <CardTitle>エピソード一覧</CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2">読み込み中...</span>
                </div>
              ) : error ? (
                <div className="text-center text-red-500">{error}</div>
              ) : acts.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-2">
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
                    <div className="mt-4">
                      {episodes.length > 0 ? (
                        <div className="space-y-2">
                          {episodes.map((episode) => (
                            <div
                              key={episode.id}
                              className={`p-3 border rounded-md cursor-pointer ${selectedEpisode?.id === episode.id
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                                }`}
                              onClick={() => handleSelectEpisode(episode)}
                            >
                              <div className="font-medium y-m-15">
                                {episode.episode_number}話: {episode.title}
                              </div>
                              <textarea
                                className="text-sm mt-1 w-full h-16 resize-none bg-transparent border-none p-0 focus:ring-0 focus:outline-none story-textarea th-200"
                                value={episode.content.substring(0, 100) + "..."}
                                readOnly
                                aria-label={`${episode.episode_number}話: ${episode.title}のプレビュー`}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground">この幕にはエピソードがありません</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">あらすじデータがありません</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右側：エピソード内容表示領域 */}
        <div style={{ width: '60%', position: 'relative' }}>
          <Card className="w-full h-[calc(100vh-200px)]">
            <CardHeader className="flex flex-row items-center justify-between py-2">
              <CardTitle>
                {selectedEpisode
                  ? `${selectedEpisode.episode_number}話: ${selectedEpisode.title}`
                  : 'エピソード内容'}
              </CardTitle>
              {selectedEpisode && (
                <Button 
                  onClick={handleSaveContent} 
                  disabled={isLoading || isSaving}
                  size="sm"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      保存中...
                    </>
                  ) : '保存'}
                </Button>
              )}
            </CardHeader>
            <CardContent className="overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2">読み込み中...</span>
                </div>
              ) : selectedEpisode ? (
                <textarea
                  className="w-full h-[calc(100vh-300px)] resize-none p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary whitespace-pre-wrap"
                  value={editedContent}
                  onChange={handleContentChange}
                  aria-label={`${selectedEpisode.episode_number}話: ${selectedEpisode.title}の本文`}
                />
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">エピソードを選択してください</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </StoryProvider>
  );
}
