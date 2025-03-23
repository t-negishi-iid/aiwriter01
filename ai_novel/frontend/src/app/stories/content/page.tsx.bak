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

// 外側のコンポーネント：StoryProviderを提供する
export default function ContentPage() {
  const searchParams = useSearchParams();
  const storyId = searchParams.get('id');

  if (!storyId) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-10">
          <p className="text-red-500 font-medium">小説IDが指定されていません。</p>
        </div>
      </div>
    );
  }

  return (
    <StoryProvider storyId={storyId}>
      <ContentPageInner storyId={storyId} />
    </StoryProvider>
  );
}

// 内側のコンポーネント：コンテキストを使用する
function ContentPageInner({ storyId }: { storyId: string }) {
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

  // ここでコンテキストを使用（プロバイダの内側で）
  const { basicSetting } = useStoryContext();

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
    } finally {
      setIsLoading(false);
    }
  };

  // エピソード選択ハンドラ
  const handleSelectEpisode = (episode: EpisodeDetail) => {
    setSelectedEpisode(episode);
    setEditedContent(episode.content || '');
    setGeneratedContent('');
  };

  // エピソード内容変更ハンドラ
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(e.target.value);
  };

  // 生成された内容の変更ハンドラ
  const handleGeneratedContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGeneratedContent(e.target.value);
  };

  // 生成内容を適用するハンドラ
  const handleApplyGeneratedContent = () => {
    if (generatedContent) {
      setEditedContent(generatedContent);
    }
  };

  // エピソード内容保存ハンドラ
  const handleSaveContent = async () => {
    if (!storyId || !selectedAct || !selectedEpisode) {
      toast({
        title: "エラー",
        description: "必要な情報が不足しています。",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      // エピソード内容を更新
      await episodeApi.updateEpisodeContent(
        storyId as string,
        selectedAct.act_number,
        selectedEpisode.episode_number,
        {
          title: selectedEpisode.title,
          content: editedContent,
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
    // 必要な情報が揃っているか確認
    if (!storyId || !selectedAct || !selectedEpisode) {
      toast({
        title: "エラー",
        description: "必要な情報が不足しています。",
        variant: "destructive"
      });
      return;
    }

    // 基本設定IDの確認
    if (!basicSetting || !basicSetting.id) {
      console.error("エラー: 基本設定IDが取得できません", basicSetting);
      toast({
        title: "エラー",
        description: "基本設定IDが取得できません。作品の基本設定が正しく設定されているか確認してください。",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedContent("");

    try {
      const response = await contentApi.generateEpisodeContent({
        story_id: parseInt(storyId),
        basic_setting_id: basicSetting.id,
        act_number: selectedAct.act_number,
        episode_number: selectedEpisode.episode_number,
        word_count: wordCount,
      });

      if (response && response.content) {
        setGeneratedContent(response.content);
        toast({
          title: "生成完了",
          description: "エピソード本文を生成しました。",
        });
      } else {
        toast({
          title: "警告",
          description: "生成結果が空でした。別の設定で再試行してください。",
          variant: "warning"
        });
      }
    } catch (err) {
      console.error("本文生成エラー:", err);
      toast({
        title: "エラー",
        description: "エピソード本文の生成に失敗しました。",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      {/* タブナビゲーション */}
      <StoryTabs activeTab="content" storyId={storyId} />

      <div className="flex gap-4 mt-4">
        {/* 左側：幕・エピソード一覧 */}
        <div style={{ width: '40%' }}>
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
                  {/* 幕一覧 */}
                  <div className="mb-4">
                    <h3 className="font-medium mb-2">幕</h3>
                    <div className="space-y-2">
                      {acts.map((act) => (
                        <div
                          key={act.id}
                          className={`p-3 border rounded-md cursor-pointer ${selectedAct?.id === act.id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                            }`}
                          onClick={() => handleSelectAct(act)}
                        >
                          <div className="font-medium y-m-10">
                            第{act.act_number}幕: {act.title}
                          </div>
                          <div className="text-sm mt-1">
                            {act.description && act.description.length > 100
                              ? act.description.substring(0, 100) + "..."
                              : act.description || 'あらすじなし'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* エピソード一覧 */}
                  {selectedAct && (
                    <div>
                      <h3 className="font-medium mb-2">エピソード</h3>
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
    </div>
  );
}
