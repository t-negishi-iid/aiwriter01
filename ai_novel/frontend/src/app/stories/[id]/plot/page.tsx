"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { plotApi, storyApi } from "@/lib/api"
import { PlotDetail, Story } from "@/lib/types"

export default function PlotPage() {
  const router = useRouter()
  const params = useParams();
  const storyId = params.id as string;

  const [story, setStory] = useState<Story | null>(null)
  const [plotDetail, setPlotDetail] = useState<PlotDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // 小説情報とあらすじの取得
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

        // あらすじの取得
        const plotResponse = await plotApi.getPlot(storyId)
        if (plotResponse.success && plotResponse.data) {
          setPlotDetail(plotResponse.data)
        } else {
          console.warn("あらすじの取得に失敗:", plotResponse.message)
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

  // あらすじの更新
  const handleSave = async () => {
    if (!plotDetail) return

    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await plotApi.updatePlotDetail(storyId, plotDetail)
      if (response.success) {
        setSuccessMessage("あらすじを保存しました")
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        throw new Error(response.message || "あらすじの保存に失敗しました")
      }
    } catch (err) {
      console.error("あらすじ保存エラー:", err)
      setError(err instanceof Error ? err.message : "保存中にエラーが発生しました")
    } finally {
      setIsSaving(false)
    }
  }

  // フィールド更新ハンドラ
  const handleFieldChange = (field: keyof PlotDetail, value: string) => {
    if (plotDetail) {
      setPlotDetail({ ...plotDetail, [field]: value })
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

  if (!plotDetail) {
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
          <h1 className="text-3xl font-bold">あらすじ</h1>
        </div>

        <Alert variant="default" className="mb-6">
          <AlertTitle>あらすじがまだ作成されていません</AlertTitle>
          <AlertDescription>
            あらすじを生成してから編集できます。
          </AlertDescription>
        </Alert>

        <Button onClick={() => router.push(`/stories/${storyId}/plot/generate`)}>
          あらすじを生成する
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
        <h1 className="text-3xl font-bold">あらすじ編集</h1>
        <p className="text-muted-foreground mt-2">
          「{story?.title}」のあらすじを編集します
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>エラーが発生しました</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert variant="default" className="mb-6 bg-green-50 border-green-200">
          <AlertTitle>成功</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>第1幕</CardTitle>
          <CardDescription>物語の導入部分</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={plotDetail.act1}
            onChange={(e) => handleFieldChange('act1', e.target.value)}
            className="min-h-[200px]"
          />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>第2幕</CardTitle>
          <CardDescription>物語の展開部分</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={plotDetail.act2}
            onChange={(e) => handleFieldChange('act2', e.target.value)}
            className="min-h-[200px]"
          />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>第3幕</CardTitle>
          <CardDescription>物語の結末部分</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={plotDetail.act3}
            onChange={(e) => handleFieldChange('act3', e.target.value)}
            className="min-h-[200px]"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              保存中...
            </>
          ) : (
            "保存する"
          )}
        </Button>
      </div>
    </div>
  )
}
