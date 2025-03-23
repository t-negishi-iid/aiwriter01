'use client';

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StoryProvider, useStoryContext } from '@/components/story/StoryProvider';
import { StoryTabs } from '@/components/story/StoryTabs';
import { toast } from "@/components/ui/use-toast";
import { ActDetailApi, episodeApi, contentApi } from '@/lib/unified-api-client';
import { ActDetail, EpisodeDetail } from '@/lib/unified-api-client';
import { useSearchParams } from 'next/navigation';

// Storyコンテキストに基本設定IDを含む拡張インターフェース
interface StoryWithBasicSetting {
  id: number;
  title: string;
  description: string;
  basic_setting?: {
    id: number;
  };
  [key: string]: any;
}

export default function ContentPage() {
  const searchParams = useSearchParams();
  const storyIdFromQuery = searchParams.get('id');
  
  // 最終的に使用するストーリーID
  const [storyId, setStoryId] = useState<string | null>(storyIdFromQuery);

  // クライアントサイドでパスパラメータからIDを取得
  useEffect(() => {
    // クライアントサイドでのみ実行
    const pathname = window.location.pathname;
    const pathSegments = pathname.split('/');
    // パスパラメータからのID取得（/stories/content/123 の形式を想定）
    const idFromPath = pathSegments.length > 3 ? pathSegments[3] : null;
    
    // クエリパラメータかパスパラメータのどちらかからIDを使用
    setStoryId(storyIdFromQuery || idFromPath);
  }, [storyIdFromQuery]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acts, setActs] = useState<ActDetail[]>([]);
  const [selectedAct, setSelectedAct] = useState<ActDetail | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeDetail[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<EpisodeDetail | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [wordCount, setWordCount] = useState<number>(1000);

  // StoryContextから基本設定情報を取得
  const { story } = useStoryContext();
  // 基本設定IDを取得
  const basicSettingId = story ? (story as StoryWithBasicSetting).basic_setting?.id || 1 : 1;

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
  }, [storyId]);

  // 幕選択ハンドラ
  const handleSelectAct = async (act: ActDetail) => {
    setSelectedAct(act);
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
    setEditedContent(episode.content || '');
  };

  // エピソード内容の変更ハンドラ
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(e.target.value);
  };

  // 生成された内容の変更ハンドラ
  const handleGeneratedContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGeneratedContent(e.target.value);
  };

  // 生成内容をエピソードに適用するハンドラ
  const handleApplyGeneratedContent = () => {
    if (!generatedContent) {
      toast({
        title: "エラー",
        description: "適用する生成内容がありません。",
        variant: "destructive"
      });
      return;
    }

    setEditedContent(generatedContent);
    toast({
      title: "適用完了",
      description: "生成された内容をエピソードに適用しました。変更を保存するには「保存」ボタンをクリックしてください。",
    });
  };

  // エピソード内容の保存ハンドラ
  const handleSaveContent = async () => {
    if (!selectedEpisode || !selectedAct || !storyId) return;

    try {
      setIsSaving(true);
      // APIを呼び出してエピソード内容を更新
      await episodeApi.updateEpisodeContent(
        storyId as string,
        selectedAct.act_number,
        selectedEpisode.episode_number,
        {
          title: selectedEpisode.title,
          content: editedContent,
          raw_data: editedContent // ユーザーが直接編集した内容はraw_dataも同じ
        }
      );

      // 更新成功メッセージ
      toast({
        title: "保存完了",
        description: "エピソード内容を保存しました。",
      });

      // エピソード一覧を更新
      const updatedEpisode = { ...selectedEpisode, content: editedContent };
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

  // エピソード本文を生成するハンドラ
  const handleGenerateContent = async () => {
    if (!selectedEpisode || !selectedAct || !basicSettingId || !storyId) return;

    try {
      setIsGenerating(true);
      // APIを呼び出してエピソード本文を生成
      const response = await contentApi.createEpisodeContent(
        storyId as string,
        selectedAct.act_number,
        selectedEpisode.episode_number,
        {
          basic_setting_id: basicSettingId,
          word_count: wordCount
        }
      );

      if (response && response.content) {
        setGeneratedContent(response.content as string);
        toast({
          title: "生成完了",
          description: "エピソード本文が生成されました。",
        });
      } else {
        toast({
          title: "警告",
          description: "本文生成レスポンスの形式が不正です。",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error("エピソード生成エラー:", err);
      toast({
        title: "エラー",
        description: "エピソード本文の生成に失敗しました。",
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
    <StoryProvider storyId={storyId as string}>
      <StoryTabs storyId={storyId as string} activeTab="content" />

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
          <Card className="w-full mb-4">
            <CardHeader className="flex flex-row items-center justify-between py-2">
              <CardTitle>
                {selectedEpisode
                  ? `${selectedEpisode.episode_number}話: ${selectedEpisode.title}`
                  : 'エピソード内容'}
              </CardTitle>
              {selectedEpisode && (
                <div className="flex space-x-2">
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

                  <Button 
                    className="w-full"
                    disabled={isGenerating || !selectedEpisode}
                    onClick={handleGenerateContent}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        生成中...
                      </>
                    ) : '本文を生成する'}
                  </Button>
                  <label htmlFor="word-count" className="w-1/2">文字数</label>
                  <input
                    type="number"
                    value={wordCount}
                    onChange={(e) => setWordCount(Number(e.target.value))}
                    className="ml-2 w-10 p-1 border rounded"
                    id="word-count"
                    placeholder="文字数"
                    min={500}
                    max={10000}
                    disabled={isGenerating}
                  />
                </div>
              )}
            </CardHeader>
            <CardContent className="overflow-y-auto h-[calc(100vh-500px)]">
              {isLoading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2">読み込み中...</span>
                </div>
              ) : selectedEpisode ? (
                <textarea
                  className="w-full h-full resize-none p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary whitespace-pre-wrap story-textarea th-200"
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

          {/* 生成された本文表示エリア */}
          {selectedEpisode && (
            <Card className="w-full">
              <CardHeader className="flex flex-row items-center justify-between py-2">
                <CardTitle>生成した本文</CardTitle>
                <Button
                  onClick={handleApplyGeneratedContent}
                  size="sm"
                  disabled={!generatedContent}
                >
                  この内容を適用
                </Button>
              </CardHeader>
              <CardContent className="overflow-y-auto h-[calc(100vh-500px)]">
                <textarea
                  className="w-full h-full resize-none p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary whitespace-pre-wrap story-textarea th-200"
                  value={generatedContent}
                  onChange={handleGeneratedContentChange}
                  placeholder="「本文を生成する」ボタンをクリックすると、AIによる本文案がここに表示されます。"
                  aria-label="生成された本文"
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </StoryProvider>
  );
}
