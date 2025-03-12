"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { storyApi, episodeApi } from "@/lib/api"
import { StoryCreationNav } from "@/components/layout/navigation"
import { toast } from "@/components/ui/use-toast"

interface Story {
  id: string
  title: string
  created_at: string
  updated_at: string
  status: string
  steps_completed: number
}

interface Episode {
  id: string
  title: string
  order: number
  content?: string
}

export default function StoryPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [story, setStory] = useState<Story | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEpisode, setSelectedEpisode] = useState<string | null>(null)
  const [episodeContent, setEpisodeContent] = useState("")
  const [isLoadingContent, setIsLoadingContent] = useState(false)

  useEffect(() => {
    const fetchStoryData = async () => {
      try {
        setIsLoading(true)
        // 小説情報を取得
        const storyData = await storyApi.getStory(params.id)
        setStory(storyData)

        // エピソード一覧を取得
        const episodesData = await episodeApi.getEpisodes(params.id)
        setEpisodes(episodesData)

        // 最初のエピソードを選択
        if (episodesData.length > 0) {
          setSelectedEpisode(episodesData[0].id)
          await fetchEpisodeContent(params.id, episodesData[0].id)
        }

      } catch (error) {
        console.error("小説データの取得に失敗しました:", error)
        toast({
          title: "エラー",
          description: "小説データの取得に失敗しました。",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchStoryData()
    }
  }, [params.id])

  const fetchEpisodeContent = async (storyId: string, episodeId: string) => {
    try {
      setIsLoadingContent(true)
      const content = await episodeApi.getEpisodeContent(storyId, episodeId)
      setEpisodeContent(content.content || "")
    } catch (error) {
      console.error("エピソード内容の取得に失敗しました:", error)
      toast({
        title: "エラー",
        description: "エピソード内容の取得に失敗しました。",
        variant: "destructive",
      })
      setEpisodeContent("")
    } finally {
      setIsLoadingContent(false)
    }
  }

  const handleEpisodeSelect = async (episodeId: string) => {
    setSelectedEpisode(episodeId)
    await fetchEpisodeContent(params.id, episodeId)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <div className="text-center">
          <div className="text-lg">読み込み中...</div>
        </div>
      </div>
    )
  }

  if (!story) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">小説が見つかりません</h2>
          <p>指定された小説は存在しないか、アクセス権がありません。</p>
          <Button asChild>
            <Link href="/stories">小説一覧に戻る</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{story.title || "無題の小説"}</h1>
          <p className="text-muted-foreground">
            作成日: {formatDate(story.created_at)}
            {story.updated_at !== story.created_at &&
              ` (更新日: ${formatDate(story.updated_at)})`}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href="/stories">戻る</Link>
          </Button>
          <Button asChild>
            <Link href={`/stories/${story.id}/edit`}>編集</Link>
          </Button>
        </div>
      </div>

      <StoryCreationNav storyId={story.id} activeStep={story.steps_completed} />

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="content">小説本文</TabsTrigger>
          <TabsTrigger value="info">情報</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          {episodes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1 space-y-4">
                <h3 className="text-lg font-medium">エピソード</h3>
                <div className="space-y-2">
                  {episodes.map((episode) => (
                    <Button
                      key={episode.id}
                      variant={selectedEpisode === episode.id ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => handleEpisodeSelect(episode.id)}
                    >
                      {episode.title || `第${episode.order + 1}話`}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-3 border rounded-lg p-6">
                {isLoadingContent ? (
                  <div className="flex items-center justify-center h-[400px]">
                    <div className="text-center">
                      <div className="text-lg">読み込み中...</div>
                    </div>
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <div className="whitespace-pre-wrap leading-7">
                      {episodeContent || "コンテンツがありません。"}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">エピソードがまだ作成されていません</h3>
              <p className="text-muted-foreground mb-4">
                「エピソード」タブから小説のエピソードを作成してください。
              </p>
              <Button asChild>
                <Link href={`/stories/${story.id}/episodes`}>エピソードを作成</Link>
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="info" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">基本情報</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-4">
                  <div className="font-medium">タイトル</div>
                  <div className="col-span-2">{story.title || "未設定"}</div>
                </div>
                <Separator />
                <div className="grid grid-cols-3 gap-4">
                  <div className="font-medium">ステータス</div>
                  <div className="col-span-2">
                    {story.status === "completed" ? "完成" : "作成中"}
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-3 gap-4">
                  <div className="font-medium">完了ステップ</div>
                  <div className="col-span-2">
                    {story.steps_completed}/7
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-3 gap-4">
                  <div className="font-medium">作成日</div>
                  <div className="col-span-2">{formatDate(story.created_at)}</div>
                </div>
                <Separator />
                <div className="grid grid-cols-3 gap-4">
                  <div className="font-medium">更新日</div>
                  <div className="col-span-2">{formatDate(story.updated_at)}</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">エピソード情報</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-4">
                  <div className="font-medium">総エピソード数</div>
                  <div className="col-span-2">{episodes.length}</div>
                </div>
                {episodes.length > 0 && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-3 gap-4">
                      <div className="font-medium">最終更新</div>
                      <div className="col-span-2">
                        {episodes[episodes.length - 1].title || `第${episodes[episodes.length - 1].order + 1}話`}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" asChild>
              <Link href={`/stories/${story.id}/logs`}>
                ログを表示
              </Link>
            </Button>
            <Button variant="destructive" onClick={() => {
              if (confirm("本当にこの小説を削除しますか？この操作は取り消せません。")) {
                storyApi.deleteStory(story.id)
                  .then(() => {
                    toast({
                      title: "削除完了",
                      description: "小説が削除されました。",
                    })
                    router.push("/stories")
                  })
                  .catch((error) => {
                    console.error("小説の削除に失敗しました:", error)
                    toast({
                      title: "エラー",
                      description: "小説の削除に失敗しました。",
                      variant: "destructive",
                    })
                  })
              }
            }}>
              小説を削除
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
