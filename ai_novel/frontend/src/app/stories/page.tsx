"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Book, ArrowRight, Loader2, Trash2, Edit } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { storyApi } from "@/lib/api-client"
import { Story } from "@/lib/types"
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

export default function StoriesPage() {
  const router = useRouter()
  const [stories, setStories] = useState<Story[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [storyToDelete, setStoryToDelete] = useState<Story | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // ストーリー一覧の取得
  useEffect(() => {
    async function fetchStories() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await storyApi.getStories()
        if (response.success && response.data) {
          setStories(response.data)
        } else {
          throw new Error(response.message || "ストーリー一覧の取得に失敗しました")
        }
      } catch (err) {
        console.error("ストーリー一覧取得エラー:", err)
        setError(err instanceof Error ? err.message : "未知のエラーが発生しました")
      } finally {
        setIsLoading(false)
      }
    }

    fetchStories()
  }, [])

  // ストーリー削除処理
  const handleDeleteStory = async () => {
    if (!storyToDelete) return

    setIsDeleting(true)
    try {
      const response = await storyApi.deleteStory(storyToDelete.id.toString())
      if (response.success) {
        // 削除成功した場合、リストから削除
        setStories(prevStories => prevStories.filter(story => story.id !== storyToDelete.id))
        setStoryToDelete(null)
      } else {
        throw new Error(response.message || "ストーリーの削除に失敗しました")
      }
    } catch (err) {
      console.error("ストーリー削除エラー:", err)
      setError(err instanceof Error ? err.message : "削除中に未知のエラーが発生しました")
    } finally {
      setIsDeleting(false)
    }
  }

  // ストーリー作成日時のフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">ストーリー一覧</h1>
        <Button onClick={() => router.push('/stories/create')}>
          <Plus className="mr-2 h-4 w-4" />
          新規ストーリー作成
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>エラーが発生しました</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">読み込み中...</span>
        </div>
      ) : stories.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="flex flex-col items-center">
              <Book className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">ストーリーがありません</h3>
              <p className="text-muted-foreground mb-6">
                「新規ストーリー作成」ボタンからストーリーを作成しましょう
              </p>
              <Button onClick={() => router.push('/stories/create')}>
                <Plus className="mr-2 h-4 w-4" />
                新規ストーリー作成
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <Card key={story.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">{story.title}</CardTitle>
                <CardDescription>
                  作成日: {formatDate(story.created_at)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground line-clamp-3">
                  {story.description || "説明はありません"}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex space-x-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setStoryToDelete(story)}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        削除
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
                        <AlertDialogDescription>
                          「{story.title}」を削除します。この操作は元に戻せません。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteStory}
                          disabled={isDeleting}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeleting && storyToDelete?.id === story.id ? (
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
                    <Link href={`/stories/${story.id}/edit`}>
                      <Edit className="h-4 w-4 mr-1" />
                      編集
                    </Link>
                  </Button>
                </div>

                <Button size="sm" asChild>
                  <Link href={`/stories/${story.id}`}>
                    詳細を見る
                    <ArrowRight className="ml-1 h-4 w-4" />
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
