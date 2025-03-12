"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { Loader2 } from "lucide-react"

import { BasicSettingDataForm } from "@/components/forms/basic-setting-data-form"
import { BasicSettingData, ApiResponse, TaskStatus } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

export default function GenerateBasicSettingPage() {
  const router = useRouter()
  const params = useParams()
  const storyId = params.id as string

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null)
  const [progress, setProgress] = useState(0)

  // 基本設定データの送信処理
  const handleFormSubmit = async (data: BasicSettingData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // APIにデータを送信
      const response = await fetch(`/api/stories/${storyId}/basic-setting-data/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result: ApiResponse<{ task_id: string }> = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "基本設定データの送信に失敗しました")
      }

      if (result.data?.task_id) {
        setTaskId(result.data.task_id)
      } else {
        throw new Error("タスクIDが取得できませんでした")
      }
    } catch (err) {
      console.error("基本設定データの送信エラー:", err)
      setError(err instanceof Error ? err.message : "未知のエラーが発生しました")
      setIsSubmitting(false)
    }
  }

  // タスクの状態を監視
  useEffect(() => {
    if (!taskId) return

    const checkTaskStatus = async () => {
      try {
        const response = await fetch(`/api/tasks/${taskId}`)
        const result: ApiResponse<TaskStatus> = await response.json()

        if (!response.ok) {
          throw new Error(result.message || "タスクステータスの取得に失敗しました")
        }

        if (result.data) {
          setTaskStatus(result.data)

          // ステータスに応じた処理
          switch (result.data.status) {
            case "completed":
              // 処理完了時
              setProgress(100)
              // 基本設定詳細ページに遷移
              router.push(`/stories/${storyId}/basic-setting`)
              break
            case "failed":
              // 処理失敗時
              setError(result.data.error || "基本設定の生成に失敗しました")
              setIsSubmitting(false)
              break
            case "processing":
              // 処理中はプログレスバーを進める（進捗の目安として50%まで徐々に進める）
              setProgress((prev) => Math.min(prev + 2, 50))
              break
            case "pending":
              // 処理待ち
              setProgress((prev) => Math.min(prev + 1, 20))
              break
          }
        }
      } catch (err) {
        console.error("タスクステータス取得エラー:", err)
        // エラーが続く場合も定期的に再試行する（UIはブロックしない）
      }
    }

    // タスクが完了するまで定期的に状態を確認
    const intervalId = setInterval(checkTaskStatus, 2000)

    return () => {
      clearInterval(intervalId)
    }
  }, [taskId, router, storyId])

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>基本設定作成用データの入力</CardTitle>
          <CardDescription>
            物語の基本的な方向性を決めるためのデータを入力してください。
            この情報をもとに、AIがストーリーの基本設定を生成します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>エラーが発生しました</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isSubmitting && taskId ? (
            <div className="space-y-4 py-8">
              <h3 className="text-lg font-medium text-center">基本設定を生成中...</h3>
              <Progress value={progress} className="w-full" />
              <p className="text-center text-muted-foreground">
                AIが物語の基本設定を作成しています。このプロセスには数分かかる場合があります。
              </p>
              <div className="flex justify-center mt-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </div>
          ) : (
            <BasicSettingDataForm
              storyId={storyId}
              onSubmit={handleFormSubmit}
            />
          )}
        </CardContent>
        {isSubmitting && taskId && (
          <CardFooter className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => router.push(`/stories/${storyId}`)}
              className="mt-4"
            >
              キャンセルしてストーリー一覧に戻る
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
