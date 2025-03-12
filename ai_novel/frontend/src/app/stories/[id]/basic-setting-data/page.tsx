"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { basicSettingDataApi } from "@/lib/api"

export default function BasicSettingDataPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const storyId = params.id

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    genre: "",
    theme: "",
    setting: "",
    targetAudience: "",
    mood: "",
    narrativeStyle: "",
    additionalNotes: ""
  })

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 簡易バリデーション
    if (!formData.genre.trim() || !formData.theme.trim() || !formData.setting.trim()) {
      toast({
        title: "必須項目を入力してください",
        description: "ジャンル、テーマ、設定は必須項目です",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      await basicSettingDataApi.createBasicSettingData(storyId, formData)
      toast({
        title: "基本設定データを作成しました",
        description: "続いて基本設定を生成しましょう",
      })
      router.push(`/stories/${storyId}/basic-setting`)
    } catch (error) {
      console.error("基本設定データの作成に失敗しました:", error)
      toast({
        title: "エラーが発生しました",
        description: "基本設定データの作成に失敗しました。もう一度お試しください。",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
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
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>ジャンルとテーマ</CardTitle>
                <CardDescription>作品の基本的な方向性を決めます</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="genre">ジャンル <span className="text-destructive">*</span></Label>
                  <Textarea
                    id="genre"
                    name="genre"
                    placeholder="例: ファンタジー、SF、ミステリー、恋愛、歴史小説など"
                    value={formData.genre}
                    onChange={handleChange}
                    className="min-h-[100px]"
                  />
                  <p className="text-sm text-muted-foreground">
                    複数のジャンルを組み合わせることもできます（例: ダークファンタジー）
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="theme">テーマ・主題 <span className="text-destructive">*</span></Label>
                  <Textarea
                    id="theme"
                    name="theme"
                    placeholder="例: 成長、復讐、愛、喪失、自己発見など"
                    value={formData.theme}
                    onChange={handleChange}
                    className="min-h-[100px]"
                  />
                  <p className="text-sm text-muted-foreground">
                    作品を通して伝えたいメッセージや探求したいテーマを入力してください
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>世界観と設定</CardTitle>
                <CardDescription>物語の舞台となる世界や時代を設定します</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="setting">世界観・舞台設定 <span className="text-destructive">*</span></Label>
                  <Textarea
                    id="setting"
                    name="setting"
                    placeholder="例: 魔法が存在する中世ファンタジー世界、近未来の宇宙コロニー、現代日本の田舎町など"
                    value={formData.setting}
                    onChange={handleChange}
                    className="min-h-[120px]"
                  />
                  <p className="text-sm text-muted-foreground">
                    時代、場所、特殊なルールなど、物語の舞台に関する詳細を入力してください
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>追加情報</CardTitle>
                <CardDescription>より具体的な作品の方向性を設定します</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="targetAudience">対象読者層</Label>
                  <Textarea
                    id="targetAudience"
                    name="targetAudience"
                    placeholder="例: 10代後半〜20代前半の若者、ファンタジー小説を好む大人の読者など"
                    value={formData.targetAudience}
                    onChange={handleChange}
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mood">作品の雰囲気・トーン</Label>
                  <Textarea
                    id="mood"
                    name="mood"
                    placeholder="例: ダークでシリアス、軽快でユーモラス、ロマンチック、哲学的など"
                    value={formData.mood}
                    onChange={handleChange}
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="narrativeStyle">物語の語り方・文体</Label>
                  <Textarea
                    id="narrativeStyle"
                    name="narrativeStyle"
                    placeholder="例: 一人称視点、三人称客観視点、複数の視点を切り替える、詩的な文体など"
                    value={formData.narrativeStyle}
                    onChange={handleChange}
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalNotes">その他の要望・注意点</Label>
                  <Textarea
                    id="additionalNotes"
                    name="additionalNotes"
                    placeholder="例: 特定のキーワードやモチーフを含めたい、避けたい表現やテーマなど"
                    value={formData.additionalNotes}
                    onChange={handleChange}
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>

            <CardFooter className="flex justify-end gap-2 px-0">
              <Button variant="outline" asChild>
                <Link href={`/stories/${storyId}`}>キャンセル</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "送信中..." : "基本設定データを送信"}
              </Button>
            </CardFooter>
          </form>
        </TabsContent>

        <TabsContent value="guide">
          <Card>
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
                <h3 className="text-lg font-medium">追加情報について</h3>
                <p>対象読者層や雰囲気、文体などの情報はオプションですが、入力することでより具体的な方向性を指定できます。特に避けたい要素や必ず含めたい要素がある場合は、「その他の要望」に明記しておくことをお勧めします。</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
