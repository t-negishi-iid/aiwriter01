'use client';

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { ActDetail, EpisodeDetail } from '@/lib/unified-api-client';
import { ActDetailApi, episodeApi } from '@/lib/unified-api-client';
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface EpisodeDetailListProps {
  storyId: string;
  selectedAct: ActDetail | null;
  setSelectedAct: (act: ActDetail | null) => void;
  selectedEpisode: EpisodeDetail | null;
  setSelectedEpisode: (episode: EpisodeDetail | null) => void;
  setEditedContent: (content: string) => void;
  selectedActNumber: string;
  setSelectedActNumber: (actNumber: string) => void;
}

export default function EpisodeDetailList({
  storyId,
  selectedAct,
  setSelectedAct,
  selectedEpisode,
  setSelectedEpisode,
  setEditedContent,
  selectedActNumber,
  setSelectedActNumber
}: EpisodeDetailListProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acts, setActs] = useState<ActDetail[]>([]);
  const [episodes, setEpisodes] = useState<EpisodeDetail[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!storyId) {
        setError('小説IDが指定されていません。');
        setIsLoading(false);
        return;
      }

      try {
        // 幕データを取得
        const actsResponse = await ActDetailApi.getActDetails(storyId as string);
        if (actsResponse && actsResponse.results && actsResponse.results.length > 0) {
          setActs(actsResponse.results);
          const firstAct = actsResponse.results[0];
          setSelectedAct(firstAct);
          setSelectedActNumber(firstAct.act_number.toString());

          // 選択された幕のエピソード一覧を取得
          try {
            const episodesResponse = await episodeApi.getActEpisodes(storyId as string, firstAct.act_number);
            if (episodesResponse && episodesResponse.results && episodesResponse.results.length > 0) {
              setEpisodes(episodesResponse.results);
              const firstEpisode = episodesResponse.results[0];
              setSelectedEpisode(firstEpisode);
              setEditedContent(firstEpisode.content || '');
            }
          } catch (episodeErr) {
            console.error('エピソード取得エラー:', episodeErr);
            setError('エピソードの取得に失敗しました。');
          }
        } else {
          setError('幕データが見つかりませんでした。');
        }
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError('データの取得に失敗しました。');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [storyId, setSelectedAct, setSelectedEpisode, setEditedContent, setSelectedActNumber]);

  // 幕選択ハンドラ
  const handleSelectAct = async (act: ActDetail) => {
    setSelectedAct(act);
    setSelectedActNumber(act.act_number.toString());
    setSelectedEpisode(null);
    setEditedContent('');

    try {
      setIsLoading(true);
      // 選択された幕のエピソード一覧を取得
      const episodesResponse = await episodeApi.getActEpisodes(storyId as string, act.act_number);
      if (episodesResponse && episodesResponse.results && episodesResponse.results.length > 0) {
        setEpisodes(episodesResponse.results);
        const firstEpisode = episodesResponse.results[0];
        setSelectedEpisode(firstEpisode);
        setEditedContent(firstEpisode.content || '');
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
    } finally {
      setIsLoading(false);
    }
  };

  // タブでの幕選択ハンドラ
  const handleTabChange = (value: string) => {
    if (!acts.length) return;

    // 選択された幕の番号に対応する幕を検索
    const actNumber = parseInt(value, 10);
    const selectedAct = acts.find(act => act.act_number === actNumber);

    if (selectedAct) {
      handleSelectAct(selectedAct);
    }
  };

  // エピソード選択ハンドラ
  const handleSelectEpisode = (episode: EpisodeDetail) => {
    setSelectedEpisode(episode);
    setEditedContent(episode.content || '');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>幕とエピソード</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">読み込み中...</span>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-red-500">{error}</p>
          </div>
        ) : acts.length > 0 ? (
          <div>
            {/* 幕タブ */}
            <Tabs
              value={selectedActNumber}
              onValueChange={handleTabChange}
              className="mb-6"
            >
              <TabsList className="grid grid-cols-3 w-full">
                {acts.map((act) => (
                  <TabsTrigger
                    key={act.id}
                    value={act.act_number.toString()}
                  >
                    第{act.act_number}幕
                  </TabsTrigger>
                ))}
              </TabsList>

              {acts.map((act) => (
                <TabsContent
                  key={act.id}
                  value={act.act_number.toString()}
                  className="mt-2"
                >

                </TabsContent>
              ))}
            </Tabs>

            {/* エピソード一覧 */}
            {selectedAct && (
              <div>
                <h3 className="font-medium mb-2">{selectedAct.title}</h3>
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
                          {/* TODO: エピソード選択ボタンを配置 */}
                          <button
                            className="ml-2"
                            style={{
                              float: 'right',
                              marginRight: '10px',
                              backgroundColor: 'transparent',
                              border: '1px solid #ccc',
                              borderRadius: '4px',
                              padding: '2px 6px',
                              cursor: 'pointer'
                            }}
                            onClick={() => handleSelectEpisode(episode)}
                          >
                            選択
                          </button>
                        </div>
                        <textarea
                          className="text-sm mt-1 w-full h-16 resize-none bg-transparent border-none p-0 focus:ring-0 focus:outline-none story-textarea th-200"
                          value={episode.content && episode.content.length > 100
                            ? episode.content.substring(0, 100) + "..."
                            : episode.content || ''}
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
        )
        }
      </CardContent >
    </Card >
  );
}
