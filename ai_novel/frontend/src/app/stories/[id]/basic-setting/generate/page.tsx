"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react"
import { useParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { taskApi } from "@/lib/api-client"
import { TaskStatus } from "@/lib/types"

export default function BasicSettingGeneratePage() {
  const router = useRouter()
  const params = useParams()
  const storyId = params.id as string

  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // タスクステータスの定期的な取得
  useEffect(() => {
    let intervalId: NodeJS.Timeout

    const fetchTaskStatus = async () => {
      try {
        // ローカルストレージからタスクIDを取得
        const taskId = localStorage.getItem(`basic_setting_task_${storyId}`)
        if (!taskId) {
          setError("タスクIDが見つかりません")
          return
        }

        const response = await taskApi.getTaskStatus(taskId)
        if (response.success && response.data) {
          setTaskStatus(response.data)

          // 進捗状況の更新
          if (response.data.status === "completed") {
            setProgress(100)
            // 完了したら詳細ページにリダイレクト
            setTimeout(() => {
              router.push(`/stories/${storyId}`)
            }, 2000)
          } else if (response.data.status === "failed") {
            setProgress(0)
            setError("基本設定の生成に失敗しました")
            clearInterval(intervalId)
          } else {
            // 進行中の場合は進捗を更新
            setProgress(response.data.progress || Math.min(progress + 5, 95))
          }
        } else {
          setError("タスクステータスの取得に失敗しました")
        }
      } catch (err) {
        console.error("タスクステータス取得エラー:", err)
        setError("タスクステータスの取得中にエラーが発生しました")
      }
    }

    // 初回実行
    fetchTaskStatus()

    // 5秒ごとに更新
    intervalId = setInterval(fetchTaskStatus, 5000)

    return () => {
      clearInterval(intervalId)
    }
  }, [storyId, router, progress])

  return (
    <div className="container max-w-3xl py-10">
      <div className="mb-8">
        <Link
          href={`/stories/${storyId}`}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          小説詳細に戻る
        </Link>
        <h1 className="text-3xl font-bold">基本設定の生成中</h1>
        <p className="text-muted-foreground mt-2">
          AIが小説の基本設定を生成しています。このプロセスには数分かかる場合があります。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本設定生成状況</CardTitle>
          <CardDescription>
            生成が完了すると自動的に次のステップに進みます
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">進捗状況</span>
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              {progress >= 25 ? (
                <CheckCircle className="h-5 w-5 text-primary mr-2" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
              )}
              <span>基本情報の分析</span>
            </div>
            <div className="flex items-center">
              {progress >= 50 ? (
                <CheckCircle className="h-5 w-5 text-primary mr-2" />
              ) : progress >= 25 ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-muted mr-2" />
              )}
              <span>世界観と設定の生成</span>
            </div>
            <div className="flex items-center">
              {progress >= 75 ? (
                <CheckCircle className="h-5 w-5 text-primary mr-2" />
              ) : progress >= 50 ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-muted mr-2" />
              )}
              <span>キャラクター設定の生成</span>
            </div>
            <div className="flex items-center">
              {progress >= 100 ? (
                <CheckCircle className="h-5 w-5 text-primary mr-2" />
              ) : progress >= 75 ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-muted mr-2" />
              )}
              <span>プロット概要の生成</span>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-md">
              <p className="font-medium">エラーが発生しました</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            生成が完了すると自動的に小説詳細ページに移動します
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
