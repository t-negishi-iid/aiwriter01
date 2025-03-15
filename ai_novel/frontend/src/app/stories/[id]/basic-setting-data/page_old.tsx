"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { basicSettingApi } from "@/lib/api"
import { BasicSettingDataForm } from "@/components/forms/basic-setting-data-form"
import { BasicSettingData } from "@/lib/types"

export default function BasicSettingDataPage() {
  const router = useRouter()
  const params = useParams();
  const storyId = params.id as string;

  const handleSubmit = async (data: BasicSettingData) => {
    try {
      await basicSettingApi.createBasicSettingData(storyId, data)
      toast({
        title: "基本設定データを作成しました",
        description: "続いて基本設定を生成しましょう",
      })
      router.push(`/stories?id=${storyId}&tab=basic-setting`)
    } catch (error) {
      console.error("基本設定データの作成に失敗しました:", error)
      toast({
        title: "エラーが発生しました",
        description: "基本設定データの作成に失敗しました。もう一度お試しください。",
        variant: "destructive",
      })
      throw error; // BasicSettingDataFormでエラーハンドリングするために再スロー
    }
  }

  return (
    <div className="container max-w-4xl py-10 form-container">
      <div className="mb-8">
        <Link
          href={`/stories?id=${storyId}`}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          小説詳細に戻る
        </Link>
        <h1 className="text-3xl font-bold">基本設定データの作成</h1>
        <p className="text-muted-foreground mt-2">
          小説の基本設定を生成するためのデータを入力してください。
          入力した情報を元にAIが小説の基本設定を生成します。
        </p>
      </div>

      <Tabs defaultValue="form" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="form">フォーム入力</TabsTrigger>
          <TabsTrigger value="guide">入力ガイド</TabsTrigger>
        </TabsList>

        <TabsContent value="form">
          <Card className="card">
            <CardHeader>
              <CardTitle>基本設定データ入力</CardTitle>
              <CardDescription>小説の基本設定を生成するための情報を入力してください</CardDescription>
            </CardHeader>
            <CardContent>
              <BasicSettingDataForm
                storyId={storyId}
                onSubmit={handleSubmit}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guide">
          <Card className="card">
            <CardHeader>
              <CardTitle>基本設定データの入力ガイド</CardTitle>
              <CardDescription>効果的な基本設定を生成するためのヒント</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">ジャンルについて</h3>
                <p>物語のジャンルは読者の期待値を設定します。一般的なジャンル（ファンタジー、SF、ミステリーなど）や、より具体的なサブジャンル（ダークファンタジー、サイバーパンク、コージーミステリーなど）を指定できます。複数のジャンルを組み合わせることで独自性が生まれます。</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">テーマ・主題について</h3>
                <p>テーマは物語の中心的なメッセージや探求するアイデアです。例えば「自己犠牲の価値」「権力の腐敗」「愛と喪失」などが考えられます。複雑で多層的なテーマを持つ物語はより深みを持ちます。</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">世界観・舞台設定について</h3>
                <p>物語の舞台となる世界、時代、場所の特徴を具体的に説明してください。架空の世界の場合は、その世界の物理法則、魔法システム、技術レベル、社会構造などを明記すると効果的です。現実世界を舞台にする場合でも、特定の時代や地域の特徴を入力すると良いでしょう。</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">プロットタイプについて</h3>
                <p>物語の基本的な構造や展開パターンを選択します。「英雄の旅」「怪物との戦い」「成り上がり」などの古典的なパターンから選ぶことで、物語の骨格が決まります。</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">追加情報について</h3>
                <p>その他の要望や特に含めたい要素、避けたい要素などを自由に記述できます。AIはこれらの情報も考慮して基本設定を生成します。</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
