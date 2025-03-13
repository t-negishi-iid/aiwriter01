"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, Plus, Edit, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { storyApi, episodeApi } from "@/lib/api"
import { Story, Episode } from "@/lib/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function EpisodesPage() {
  const router = useRouter()
  const params = useParams();
  const storyId = params.id as string;

  const [story, setStory] = useState<Story | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [episodeToDelete, setEpisodeToDelete] = useState<Episode | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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
          setEpisodes(episodesResponse.data)
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

  // エピソード削除処理
  const handleDeleteEpisode = async () => {
    if (!episodeToDelete) return

    setIsDeleting(true)
    try {
      // 注: 実際のAPIにエピソード削除機能がある場合は、ここで呼び出します
      // const response = await episodeApi.deleteEpisode(storyId, episodeToDelete.id)
      // if (response.success) {
      //   setEpisodes(prevEpisodes => prevEpisodes.filter(episode => episode.id !== episodeToDelete.id))
      //   setEpisodeToDelete(null)
      // } else {
      //   throw new Error(response.message || "エピソードの削除に失敗しました")
      // }

      // 現在はモック処理として、フロントエンドの状態だけを更新
      setEpisodes(prevEpisodes => prevEpisodes.filter(episode => episode.id !== episodeToDelete.id))
      setEpisodeToDelete(null)
    } catch (err) {
      console.error("エピソード削除エラー:", err)
      setError(err instanceof Error ? err.message : "削除中にエラーが発生しました")
    } finally {
      setIsDeleting(false)
    }
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
        <h1 className="text-3xl font-bold">エピソード一覧</h1>
        <p className="text-muted-foreground mt-2">
          「{story?.title}」のエピソード一覧
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>エラーが発生しました</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">エピソード</h2>
        <Button onClick={() => router.push(`/stories/${storyId}/episodes/generate`)}>
          <Plus className="mr-2 h-4 w-4" />
          エピソードを生成する
        </Button>
      </div>

      {episodes.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <div className="flex flex-col items-center">
              <h3 className="text-lg font-medium mb-2">エピソードがありません</h3>
              <p className="text-muted-foreground mb-6">
                「エピソードを生成する」ボタンからエピソードを作成しましょう
              </p>
              <Button onClick={() => router.push(`/stories/${storyId}/episodes/generate`)}>
                <Plus className="mr-2 h-4 w-4" />
                エピソードを生成する
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {episodes.map((episode) => (
            <Card key={episode.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">{episode.title || `エピソード ${episode.number}`}</CardTitle>
                <CardDescription>
                  {episode.summary ? episode.summary.substring(0, 100) + (episode.summary.length > 100 ? '...' : '') : 'エピソードの要約はありません'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">シーン描写</h4>
                    <p className="text-sm line-clamp-2">{episode.scene_description || '情報なし'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">キャラクター成長</h4>
                    <p className="text-sm line-clamp-2">{episode.character_development || '情報なし'}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex space-x-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setEpisodeToDelete(episode)}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        削除
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
                        <AlertDialogDescription>
                          「{episode.title || `エピソード ${episode.number}`}」を削除します。この操作は元に戻せません。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteEpisode}
                          disabled={isDeleting}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeleting && episodeToDelete?.id === episode.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              削除中...
                            </>
                          ) : (
                            <>削除する</>
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/stories/${storyId}/episodes/${episode.id}/edit`}>
                      <Edit className="h-4 w-4 mr-1" />
                      編集
                    </Link>
                  </Button>
                </div>

                <Button size="sm" asChild>
                  <Link href={`/stories/${storyId}/episodes/${episode.id}`}>
                    詳細を見る
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
