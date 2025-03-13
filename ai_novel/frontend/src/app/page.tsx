import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function HomePage() {
  // 小説生成プロセスのステップ
  const steps = [
    {
      title: "基本設定",
      description: "小説のジャンル、舞台、時代などの基本的な設定を作成します。",
    },
    {
      title: "キャラクター作成",
      description: "主人公やサブキャラクターなど、物語に登場する人物を設定します。",
    },
    {
      title: "プロット作成",
      description: "物語の展開や起承転結など、全体的なプロットを構築します。",
    },
    {
      title: "エピソード詳細化",
      description: "各章や各シーンの詳細を設定し、物語を肉付けします。",
    },
    {
      title: "本文執筆",
      description: "設定に基づいて、AIが小説本文を執筆します。",
    },
  ]

  // 特徴セクション
  const features = [
    {
      title: "AI駆動の創作支援",
      description: "最新のAI技術を活用して、あなたの創作プロセスをサポートします。",
    },
    {
      title: "柔軟なカスタマイズ",
      description: "各ステップで細かい設定が可能で、あなたの理想の物語を形にします。",
    },
    {
      title: "効率的な執筆プロセス",
      description: "下書きから完成までの時間を大幅に短縮し、創作の効率を高めます。",
    },
  ]

  return (
    <div className="space-y-12 py-6">
      {/* ヒーローセクション */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">AIノベルライター</h1>
        <p className="text-xl text-muted-foreground max-w-[700px] mx-auto">
          AIを活用した小説執筆支援システムで、あなたのアイデアを物語に変えましょう
        </p>
        <div className="flex justify-center pt-6">
          <div className="inline-flex items-center rounded-md border border-input bg-background p-1 text-muted-foreground shadow-sm">
            <Link href="/stories/new" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-6 py-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90">
              【新しい小説を作成】
            </Link>
            <Link href="/stories" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-6 py-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground">
              【小説一覧を見る】
            </Link>
          </div>
        </div>
      </section>

      <Separator />

      {/* プロセス説明セクション */}
      <section>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold">小説生成プロセス</h2>
          <p className="text-muted-foreground mt-2">
            AIノベルライターの5つのステップで、あなたのアイデアが小説になります
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <Card key={index} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-8 h-8 mr-2 text-sm">
                    {index + 1}
                  </span>
                  {step.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p>{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* 特徴セクション */}
      <section>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold">システムの特徴</h2>
          <p className="text-muted-foreground mt-2">
            AIノベルライターが提供する主な特徴
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="flex flex-col">
              <CardHeader>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p>{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTAセクション */}
      <section className="bg-muted py-12 px-6 rounded-lg text-center">
        <h2 className="text-3xl font-bold mb-4">さあ、創作を始めましょう</h2>
        <p className="text-muted-foreground mb-6 max-w-[600px] mx-auto">
          AIノベルライターを使って、あなたのアイデアを形にしましょう。
          最初の一歩は、新しい小説を作成することから始まります。
        </p>
        <div className="flex justify-center">
          <div className="inline-flex items-center rounded-md border border-input bg-background p-1 text-muted-foreground shadow-sm">
            <Link href="/stories/new" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-6 py-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90">
              新しい小説を作成する
            </Link>
            <Link href="/stories" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-6 py-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground">
              小説一覧を見る
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
