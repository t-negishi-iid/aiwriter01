"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Edit, RefreshCw } from "lucide-react"
import { use } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { basicSettingApi } from "@/lib/api"
import { BasicSetting } from "@/lib/types"

export default function BasicSettingPage() {
  const router = useRouter()
  const params = useParams();
  const storyId = params.id as string;

  const [basicSetting, setBasicSetting] = useState<BasicSetting | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBasicSetting = async () => {
      try {
        setIsLoading(true)
        const response = await basicSettingApi.getBasicSetting(storyId)

        if (response.success && response.data) {
          setBasicSetting(response.data)
        } else {
          setError(response.message || "基本設定の取得に失敗しました")
        }
      } catch (err) {
        console.error("基本設定取得エラー:", err)
        setError("基本設定の取得中にエラーが発生しました")
      } finally {
        setIsLoading(false)
      }
    }

    fetchBasicSetting()
  }, [storyId])

  const handleGenerateBasicSetting = async () => {
    try {
      await basicSettingApi.generateBasicSetting(storyId)
      toast({
        title: "基本設定の生成を開始しました",
        description: "生成が完了するまでしばらくお待ちください",
      })
      router.push(`/stories/${storyId}/basic-setting/generate`)
    } catch (error) {
      console.error("基本設定の生成開始に失敗しました:", error)
      toast({
        title: "エラーが発生しました",
        description: "基本設定の生成開始に失敗しました。もう一度お試しください。",
        variant: "destructive",
      })
    }
  }

  const handleEditBasicSetting = () => {
    // 編集ページへの遷移（実装予定）
    toast({
      title: "機能準備中",
      description: "基本設定の編集機能は現在開発中です",
    })
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
        <h1 className="text-3xl font-bold">基本設定</h1>
        <p className="text-muted-foreground mt-2">
          小説の基本設定情報を確認・編集できます。
        </p>
      </div>

      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3 mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      ) : error || !basicSetting ? (
        <Card>
          <CardHeader>
            <CardTitle>基本設定が見つかりません</CardTitle>
            <CardDescription>
              {error || "この小説の基本設定はまだ作成されていません。"}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={handleGenerateBasicSetting}>
              <RefreshCw className="mr-2 h-4 w-4" />
              基本設定を生成する
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>作品設定</CardTitle>
                <CardDescription>小説の世界観や設定</CardDescription>
              </div>
              <Button variant="outline" size="icon" onClick={handleEditBasicSetting}>
                <Edit className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap">{basicSetting.story_setting}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>登場人物設定</CardTitle>
              <CardDescription>主要な登場人物の概要</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap">{basicSetting.characters}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>あらすじ概要</CardTitle>
              <CardDescription>物語の全体的な流れ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap">{basicSetting.plot_overview}</div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>第1幕</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap">{basicSetting.act1_overview}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>第2幕</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap">{basicSetting.act2_overview}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>第3幕</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap">{basicSetting.act3_overview}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
