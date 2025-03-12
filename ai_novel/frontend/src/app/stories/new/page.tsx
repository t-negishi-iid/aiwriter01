"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { storyApi } from "@/lib/api"

export default function NewStoryPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast({
        title: "タイトルを入力してください",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const newStory = await storyApi.createStory({ title })
      toast({
        title: "小説を作成しました",
        description: "続いて基本設定を作成しましょう",
      })
      router.push(`/stories/${newStory.id}/basic-data`)
    } catch (error) {
      console.error("小説の作成に失敗しました:", error)
      toast({
        title: "エラーが発生しました",
        description: "小説の作成に失敗しました。もう一度お試しください。",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container max-w-3xl py-10">
      <div className="mb-8">
        <Link
          href="/stories"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          小説一覧に戻る
        </Link>
        <h1 className="text-3xl font-bold">新しい小説を作成</h1>
        <p className="text-muted-foreground mt-2">
          タイトルを入力して小説作成プロセスを開始しましょう。
          タイトルは後から変更することもできます。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-2">
          <Label htmlFor="title">小説のタイトル</Label>
          <Input
            id="title"
            placeholder="小説のタイトルを入力してください"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
          />
          <p className="text-sm text-muted-foreground">
            仮のタイトルでも構いません。AI支援により後で適切なタイトルを生成することもできます。
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" asChild>
            <Link href="/stories">キャンセル</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "作成中..." : "小説を作成する"}
          </Button>
        </div>
      </form>
    </div>
  )
}
