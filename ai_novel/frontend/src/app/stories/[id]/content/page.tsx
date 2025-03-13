"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, Book } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { storyApi, episodeApi } from "@/lib/api"
import { Story, Episode, EpisodeContent } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ContentPage() {
  const router = useRouter()
  const params = useParams();
  const storyId = params.id as string;

  const [story, setStory] = useState<Story | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [expandedEpisodes, setExpandedEpisodes] = useState<Record<number, boolean>>({})
  const [episodeContents, setEpisodeContents] = useState<Record<number, EpisodeContent | null>>({})
  const [loadingContents, setLoadingContents] = useState<Record<number, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeEpisodeId, setActiveEpisodeId] = useState<number | null>(null)

  // 小説情報とエピソード一覧の取得
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      setError(null)

      try {
        // 小説情報の取得
        const storyResponse = await storyApi.getStory(storyId)
        if (storyResponse.success && storyResponse.data) {
          setStory(storyResponse.data)
        } else {
          throw new Error(storyResponse.message || "小説情報の取得に失敗しました")
        }

        // エピソード一覧の取得
        const episodesResponse = await episodeApi.getEpisodes(storyId)
        if (episodesResponse.success && episodesResponse.data) {
          const sortedEpisodes = [...episodesResponse.data].sort((a, b) => a.number - b.number)
          setEpisodes(sortedEpisodes)

          // 最初のエピソードをアクティブに設定
          if (sortedEpisodes.length > 0) {
            setActiveEpisodeId(sortedEpisodes[0].id)
            await toggleEpisode(sortedEpisodes[0].id)
          }
        } else {
          console.warn("エピソード一覧の取得に失敗:", episodesResponse.message)
          setEpisodes([])
        }
      } catch (err) {
        console.error("データ取得エラー:", err)
        setError(err instanceof Error ? err.message : "データの取得中にエラーが発生しました")
      } finally {
        setIsLoading(false)
      }
    }

    if (storyId) {
      fetchData()
    }
  }, [storyId])

  // エピソードの展開/折りたたみを切り替える
  const toggleEpisode = async (episodeId: number) => {
    // すでに展開されている場合は折りたたむだけ
    if (expandedEpisodes[episodeId]) {
      setExpandedEpisodes(prev => ({
        ...prev,
        [episodeId]: false
      }))
      return
    }

    // 展開する場合はコンテンツを読み込む
    setExpandedEpisodes(prev => ({
      ...prev,
      [episodeId]: true
    }))

    // すでにコンテンツがある場合は読み込まない
    if (episodeContents[episodeId]) return

    // コンテンツを読み込む
    setLoadingContents(prev => ({
      ...prev,
      [episodeId]: true
    }))

    try {
      const response = await episodeApi.getEpisodeContent(storyId, episodeId.toString())
      if (response.success && response.data) {
        setEpisodeContents(prev => {
          const newState = { ...prev };
          newState[episodeId] = response.data;
          return newState;
        })
      } else {
        console.warn("エピソードコンテンツの取得に失敗:", response.message)
        setEpisodeContents(prev => {
          const newState = { ...prev };
          newState[episodeId] = null;
          return newState;
        })
      }
    } catch (err) {
      console.error("エピソードコンテンツ取得エラー:", err)
      setEpisodeContents(prev => {
        const newState = { ...prev };
        newState[episodeId] = null;
        return newState;
      })
    } finally {
      setLoadingContents(prev => ({
        ...prev,
        [episodeId]: false
      }))
    }
  }

  // エピソード選択時の処理
  const handleEpisodeSelect = async (episodeId: number) => {
    setActiveEpisodeId(episodeId)
    if (!episodeContents[episodeId]) {
      await toggleEpisode(episodeId)
    }
  }

  // 全文表示用のテキスト生成
  const getFullContent = () => {
    return episodes
      .filter(episode => episodeContents[episode.id]?.content)
      .map(episode => {
        const content = episodeContents[episode.id]?.content || ''
        return `# ${episode.title || `エピソード ${episode.number}`}\n\n${content}\n\n`
      })
      .join('\n')
  }

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-10">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">読み込み中...</span>
        </div>
      </div>
    )
  }

  if (episodes.length === 0) {
    return (
      <div className="container max-w-4xl py-10">
        <div className="mb-8">
          <Link
            href={`/stories/${storyId}`}
            className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            小説詳細に戻る
          </Link>
          <h1 className="text-3xl font-bold">小説本文</h1>
        </div>

        <Alert variant="default" className="mb-6">
          <AlertTitle>エピソードがまだ作成されていません</AlertTitle>
          <AlertDescription>
            エピソードを作成してから本文を閲覧できます。
          </AlertDescription>
        </Alert>

        <Button onClick={() => router.push(`/stories/${storyId}/episodes/generate`)}>
          エピソードを生成する
        </Button>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8">
        <Link
          href={`/stories/${storyId}`}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          小説詳細に戻る
        </Link>
        <h1 className="text-3xl font-bold">小説本文</h1>
        <p className="text-muted-foreground mt-2">
          「{story?.title}」の本文
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>エラーが発生しました</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="episodes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="episodes">エピソード別</TabsTrigger>
          <TabsTrigger value="full">全文表示</TabsTrigger>
        </TabsList>

        <TabsContent value="episodes">
          <Card>
            <CardHeader>
              <CardTitle>エピソード別表示</CardTitle>
              <CardDescription>エピソードごとに本文を表示します</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1 space-y-2">
                  <h3 className="text-lg font-medium mb-4">エピソード一覧</h3>
                  <div className="space-y-2">
                    {episodes.map((episode) => (
                      <Button
                        key={episode.id}
                        variant={activeEpisodeId === episode.id ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => handleEpisodeSelect(episode.id)}
                      >
                        {episode.title || `エピソード ${episode.number}`}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-3">
                  {activeEpisodeId ? (
                    <>
                      <h3 className="text-lg font-medium mb-4">
                        {episodes.find(e => e.id === activeEpisodeId)?.title || "エピソード内容"}
                      </h3>
                      {episodeContents[activeEpisodeId] ? (
                        <div className="whitespace-pre-line bg-muted p-4 rounded-md">
                          {episodeContents[activeEpisodeId]?.content}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-muted rounded-md">
                          <Book className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">
                            このエピソードの内容はまだ作成されていません
                          </p>
                          <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => router.push(`/stories/${storyId}/episodes/${activeEpisodeId}/generate`)}
                          >
                            エピソード内容を生成する
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        左側のリストからエピソードを選択してください
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="full">
          <Card>
            <CardHeader>
              <CardTitle>全文表示</CardTitle>
              <CardDescription>小説の全文を一括表示します</CardDescription>
            </CardHeader>
            <CardContent>
              {getFullContent() ? (
                <div className="whitespace-pre-line bg-muted p-4 rounded-md">
                  {getFullContent()}
                </div>
              ) : (
                <div className="text-center py-8 bg-muted rounded-md">
                  <Book className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    エピソードの内容がまだ作成されていません
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => router.push(`/stories/${storyId}/episodes`)}
                  >
                    エピソード一覧へ
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
