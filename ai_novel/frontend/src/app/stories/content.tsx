'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Book, FileText, Users, PenTool, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { storyApi, basicSettingApi, characterApi, plotApi, episodeApi, integratedSettingCreatorApi } from "@/lib/api";
import { Story, BasicSetting, Character, PlotDetail, Episode, EpisodeContent } from "@/lib/types";

interface StoryContentProps {
  storyId: string;
}

export function StoryContent({ storyId }: StoryContentProps) {
  const router = useRouter();

  const [story, setStory] = useState<Story | null>(null);
  const [basicSetting, setBasicSetting] = useState<BasicSetting | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [plotDetail, setPlotDetail] = useState<PlotDetail | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [episodeContent, setEpisodeContent] = useState<EpisodeContent | null>(null);
  const [basicSettingData, setBasicSettingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 小説データの取得
  useEffect(() => {
    async function fetchStoryData() {
      setIsLoading(true);
      setError(null);

      // 小説情報の取得
      try {
        const storyData = await storyApi.getStory(storyId);
        console.log("小説情報の取得結果:", storyData);
        if (storyData) {
          // APIレスポンスの形式に合わせて処理
          setStory(storyData);
        } else {
          console.warn("小説情報の取得に失敗:", "データがありません");
        }
      } catch (err) {
        console.error("小説情報取得エラー:", err);
      }

      // 統合設定クリエイターデータ（基本設定）の取得
      try {
        const integratedData = await integratedSettingCreatorApi.getIntegratedSettingData(storyId);
        console.log("統合設定クリエイターデータの取得結果:", JSON.stringify(integratedData, null, 2));
        if (integratedData) {
          // データ構造を確認して適切に設定
          if (integratedData && integratedData.results && integratedData.results.basic_setting_data) {
            setBasicSettingData(integratedData.results.basic_setting_data);
          }
        }
      } catch (err) {
        console.error("統合設定クリエイターデータ取得エラー:", err);
        setIntegratedSettingData(null);
        setBasicSetting(null);
      }

      // 基本設定の取得は統合設定から行うため、個別のAPIコールは不要
      /*
      try {
        const basicSettingData = await basicSettingApi.getBasicSetting(storyId);
        console.log("基本設定の取得結果:", basicSettingData);
        if (basicSettingData) {
          // APIレスポンスの形式に合わせて処理
          setBasicSetting(basicSettingData);
        } else {
          console.warn("基本設定の取得に失敗:", "データがありません");
          setBasicSetting(null);
        }
      } catch (err) {
        console.error("基本設定取得エラー:", err);
        setBasicSetting(null);
      }
      */

      // キャラクター一覧の取得
      try {
        const charactersData = await characterApi.getCharacters(storyId);
        console.log("キャラクター一覧の取得結果:", charactersData);
        if (charactersData) {
          // APIレスポンスの形式に合わせて処理
          setCharacters(charactersData);
        } else {
          console.warn("キャラクター一覧の取得に失敗:", "データがありません");
          setCharacters([]);
        }
      } catch (err) {
        console.error("キャラクター一覧取得エラー:", err);
        setCharacters([]);
      }

      // あらすじの取得
      try {
        const plotData = await plotApi.getPlot(storyId);
        console.log("あらすじの取得結果:", plotData);
        if (plotData) {
          // データが配列の場合は最初の要素を取得、そうでなければそのまま使用
          const plotDetailData = Array.isArray(plotData) ? plotData[0] : plotData;
          setPlotDetail(plotDetailData);
        } else {
          console.warn("あらすじの取得に失敗:", "データがありません");
          setPlotDetail(null);
        }
      } catch (err) {
        console.error("あらすじ取得エラー:", err);
        setPlotDetail(null);
      }

      // エピソード一覧の取得
      try {
        const episodesData = await episodeApi.getEpisodes(storyId);
        console.log("エピソード一覧の取得結果:", episodesData);
        if (episodesData) {
          // APIレスポンスの形式に合わせて処理
          setEpisodes(episodesData);

          // 最初のエピソードを選択
          if (episodesData.length > 0) {
            setCurrentEpisode(episodesData[0]);
            // 最初のエピソードの内容を取得
            try {
              await fetchEpisodeContent(storyId, episodesData[0].id);
            } catch (err) {
              console.error("エピソード内容取得エラー:", err);
            }
          }
        } else {
          console.warn("エピソード一覧の取得に失敗:", "データがありません");
          setEpisodes([]);
        }
      } catch (err) {
        console.error("エピソード一覧取得エラー:", err);
        setEpisodes([]);
      }

      setIsLoading(false);
    }

    if (storyId) {
      fetchStoryData();
    }
  }, [storyId]);

  // エピソード内容の取得
  const fetchEpisodeContent = async (storyId: string, episodeId: number | string) => {
    try {
      // クエリパラメータ形式に合わせて引数を一つだけ渡す
      const response = await episodeApi.getEpisodeContent(episodeId.toString());
      console.log("エピソード内容の取得結果:", response);
      if (response) {
        // APIレスポンスの形式に合わせて処理
        setEpisodeContent(response);
      } else {
        setEpisodeContent(null);
      }
    } catch (err) {
      console.error("エピソード内容取得エラー:", err);
      setEpisodeContent(null);
    }
  };

  // エピソード選択時の処理
  const handleEpisodeSelect = async (episodeId: number | string) => {
    const episode = episodes.find((ep) => ep.id === episodeId);
    if (episode) {
      setCurrentEpisode(episode);
      await fetchEpisodeContent(storyId, episodeId);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">読み込み中...</span>
        </div>
      </div>
    );
  }

  // URLパターンは新しいクエリパラメータ形式に変更
  const getStoryUrl = (id: string) => `/stories?id=${id}`;

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <Link
          href="/stories"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          小説一覧に戻る
        </Link>
        <h1 className="text-3xl font-bold">{story?.title || "無題の小説"}</h1>
        <p className="text-muted-foreground mt-2">
          {story?.description || "説明はありません"}
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>エラーが発生しました</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="basic-data">基本設定</TabsTrigger>
          <TabsTrigger value="basic-setting">作品設定</TabsTrigger>
          <TabsTrigger value="characters">登場人物</TabsTrigger>
          <TabsTrigger value="plot">あらすじ詳細</TabsTrigger>
          <TabsTrigger value="episodes">エピソード詳細</TabsTrigger>
          <TabsTrigger value="content">小説執筆</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>概要</CardTitle>
              <CardDescription>小説の概要情報</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 概要の内容はここに追加予定 */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="basic-data">
          <Card>
            <CardHeader>
              <CardTitle>基本設定</CardTitle>
              <CardDescription>小説の基本的な設定情報</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {basicSettingData ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">基本設定データ</h3>
                    <div className="flex justify-center mt-4">
                      <Button onClick={() => router.push(`/tools/integrated-setting-creator?storyId=${storyId}`)}>
                        統合クリエイターで編集する
                      </Button>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-md p-4 mb-4 overflow-y-auto max-h-[500px]">
                      <div className="whitespace-pre-wrap break-words w-full">
                        <textarea className="w-full h-auto border-none bg-transparent resize-none outline-none px-5" value={basicSettingData} readOnly style={{ minWidth: '100%', minHeight: '300px', marginTop: '20px', marginBottom: '20px', marginLeft: '20px', marginRight: '20px', padding: '20px' }}></textarea>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center mt-4">
                    <Button onClick={() => router.push(`/tools/integrated-setting-creator?storyId=${storyId}`)}>
                      統合クリエイターで編集する
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">基本設定がまだ作成されていません</h3>
                  <p className="text-muted-foreground mb-6">
                    基本設定を作成して、小説の世界観や登場人物を定義しましょう
                  </p>
                  <Button onClick={() => router.push(`/tools/integrated-setting-creator?storyId=${storyId}`)}>
                    統合クリエイターで作成する
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="basic-setting">
          <Card>
            <CardHeader>
              <CardTitle>作品設定</CardTitle>
              <CardDescription>小説の作品設定情報</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {basicSetting ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">作品設定</h3>
                    <div className="whitespace-pre-line bg-muted p-4 rounded-md">
                      {basicSetting.story_setting}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">登場人物設定</h3>
                    <div className="whitespace-pre-line bg-muted p-4 rounded-md">
                      {basicSetting.characters}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">あらすじ概要</h3>
                    <div className="whitespace-pre-line bg-muted p-4 rounded-md">
                      {basicSetting.plot_overview}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">基本設定がまだ作成されていません</h3>
                  <p className="text-muted-foreground mb-6">
                    基本設定を作成して、小説の世界観や登場人物を定義しましょう
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Button onClick={() => router.push(`/tools/integrated-setting-creator?storyId=${storyId}`)}>
                      統合設定クリエイターで作成
                    </Button>
                    <Button variant="outline" onClick={() => router.push(`/stories/${storyId}/basic-setting-data`)}>
                      従来の方法で作成
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
            {basicSetting && (
              <CardFooter>
                <Button variant="outline" asChild className="ml-auto">
                  <Link href={`/stories?id=${storyId}&tab=basic-setting`}>
                    基本設定を編集する
                  </Link>
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="characters">
          <Card>
            <CardHeader>
              <CardTitle>登場人物</CardTitle>
              <CardDescription>小説の登場人物一覧</CardDescription>
            </CardHeader>
            <CardContent>
              {characters.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {characters.map((character) => (
                    <Card key={character.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-xl">{character.name}</CardTitle>
                        <CardDescription>{character.role}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground line-clamp-3">
                          {character.personality || "性格の説明はありません"}
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" size="sm" asChild className="ml-auto">
                          <Link href={`/stories?id=${storyId}&tab=character&characterId=${character.id}`}>
                            詳細を見る
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">登場人物がまだ作成されていません</h3>
                  <p className="text-muted-foreground mb-6">
                    登場人物を作成して、物語に命を吹き込みましょう
                  </p>
                  <Button onClick={() => router.push(`/stories?id=${storyId}&action=create-character`)}>
                    登場人物を作成する
                  </Button>
                </div>
              )}
            </CardContent>
            {characters.length > 0 && (
              <CardFooter>
                <Button variant="outline" asChild className="ml-auto">
                  <Link href={`/stories?id=${storyId}&action=create-character`}>
                    新しい登場人物を追加
                  </Link>
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="plot">
          <Card>
            <CardHeader>
              <CardTitle>あらすじ詳細</CardTitle>
              <CardDescription>物語の詳細なあらすじ</CardDescription>
            </CardHeader>
            <CardContent>
              {plotDetail ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">第1幕</h3>
                    <div className="whitespace-pre-line bg-muted p-4 rounded-md">
                      {plotDetail.act1}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">第2幕</h3>
                    <div className="whitespace-pre-line bg-muted p-4 rounded-md">
                      {plotDetail.act2}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">第3幕</h3>
                    <div className="whitespace-pre-line bg-muted p-4 rounded-md">
                      {plotDetail.act3}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">あらすじがまだ作成されていません</h3>
                  <p className="text-muted-foreground mb-6">
                    詳細なあらすじを作成して、物語の展開を計画しましょう
                  </p>
                  <Button onClick={() => router.push(`/stories?id=${storyId}&action=generate-plot`)}>
                    あらすじを生成する
                  </Button>
                </div>
              )}
            </CardContent>
            {plotDetail && (
              <CardFooter>
                <Button variant="outline" asChild className="ml-auto">
                  <Link href={`/stories?id=${storyId}&tab=plot`}>
                    あらすじを編集する
                  </Link>
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="episodes">
          <Card>
            <CardHeader>
              <CardTitle>エピソード詳細</CardTitle>
              <CardDescription>小説のエピソード一覧と内容</CardDescription>
            </CardHeader>
            <CardContent>
              {episodes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-1 space-y-2">
                    <h3 className="text-lg font-medium mb-4">エピソード一覧</h3>
                    <div className="space-y-2">
                      {episodes.map((episode) => (
                        <Button
                          key={episode.id}
                          variant={currentEpisode?.id === episode.id ? "default" : "outline"}
                          className="w-full justify-start"
                          onClick={() => handleEpisodeSelect(episode.id)}
                        >
                          {episode.title || `エピソード ${episode.number}`}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-3">
                    <h3 className="text-lg font-medium mb-4">
                      {currentEpisode?.title || "エピソード内容"}
                    </h3>
                    {episodeContent ? (
                      <div className="whitespace-pre-line bg-muted p-4 rounded-md">
                        {episodeContent.content}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-muted rounded-md">
                        <PenTool className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          このエピソードの内容はまだ作成されていません
                        </p>
                        {currentEpisode && (
                          <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => router.push(`/stories?id=${storyId}&episodeId=${currentEpisode.id}&action=generate-episode`)}
                          >
                            エピソード内容を生成する
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">エピソードがまだ作成されていません</h3>
                  <p className="text-muted-foreground mb-6">
                    エピソードを作成して、物語を形にしましょう
                  </p>
                  <Button onClick={() => router.push(`/stories?id=${storyId}&action=generate-episodes`)}>
                    エピソードを生成する
                  </Button>
                </div>
              )}
            </CardContent>
            {episodes.length > 0 && episodeContent && (
              <CardFooter>
                <Button variant="outline" asChild className="ml-auto">
                  <Link href={`/stories?id=${storyId}&episodeId=${currentEpisode?.id}&action=edit-episode`}>
                    エピソードを編集する
                  </Link>
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>小説執筆</CardTitle>
              <CardDescription>小説本文の執筆と編集</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {episodeContent ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">本文</h3>
                    <div className="whitespace-pre-wrap bg-muted p-4 rounded-md min-h-[300px]">
                      {episodeContent.content}
                    </div>
                  </div>
                </div>
              ) : currentEpisode ? (
                <div className="text-center py-8">
                  <PenTool className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">本文がまだ作成されていません</h3>
                  <p className="text-muted-foreground mb-6">
                    このエピソードの本文を執筆しましょう
                  </p>
                  <Button onClick={() => router.push(`/stories/${storyId}/episodes/${currentEpisode.id}/edit`)}>
                    本文を執筆する
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <PenTool className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">エピソードが選択されていません</h3>
                  <p className="text-muted-foreground mb-6">
                    エピソードを選択するか、新しいエピソードを作成してください
                  </p>
                </div>
              )}
            </CardContent>
            {episodeContent && (
              <CardFooter>
                <Button variant="outline" asChild className="ml-auto">
                  <Link href={`/stories/${storyId}/episodes/${currentEpisode?.id}/edit`}>
                    本文を編集する
                  </Link>
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
