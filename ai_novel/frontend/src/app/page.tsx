import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ヘッダー */}
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container flex h-16 items-center space-x-4">
          <h1 className="text-xl font-bold">AI小説執筆支援</h1>
          <div className="flex-1" />
          <nav className="flex items-center space-x-4">
            <Link href="/stories" className={buttonVariants({ variant: "outline" })}>
              小説一覧
            </Link>
            <Link href="/credit" className={buttonVariants({ variant: "outline" })}>
              クレジット
            </Link>
          </nav>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 container py-10">
        <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
          <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold">
              AIの力で、あなたの物語を紡ぎましょう
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              AI小説執筆支援システムは、あなたの創造力をサポートし、オリジナルの小説を簡単に作成できるツールです。
              基本設定から小説の完成まで、AIがあなたの創作を強力にサポートします。
            </p>
            <div className="flex gap-4">
              <Link href="/stories/new" className={buttonVariants({ size: "lg" })}>
                新しい小説を書く
              </Link>
              <Link
                href="/tutorial"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                使い方を見る
              </Link>
            </div>
          </div>
        </section>

        <section className="container py-8 md:py-12 lg:py-24">
          <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-10">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold">特徴</h2>
              <ul className="space-y-2 text-lg">
                <li>✓ 3幕構成による物語の自動生成</li>
                <li>✓ キャラクター設定の詳細化</li>
                <li>✓ エピソードごとの展開サポート</li>
                <li>✓ 小説本文の自動執筆</li>
                <li>✓ 編集可能な全てのコンテンツ</li>
              </ul>
            </div>
            <div className="rounded-lg border bg-card p-8">
              <h3 className="text-xl font-bold mb-4">クレジットシステム</h3>
              <p className="mb-4">
                各機能の利用には一定のクレジットが必要です。
                新規登録時に100クレジットが付与されます。
              </p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>基本設定の作成</span>
                  <span className="font-bold">1クレジット</span>
                </div>
                <div className="flex justify-between">
                  <span>キャラクター詳細の作成</span>
                  <span className="font-bold">2クレジット / 1キャラクター</span>
                </div>
                <div className="flex justify-between">
                  <span>あらすじ詳細の作成</span>
                  <span className="font-bold">2クレジット</span>
                </div>
                <div className="flex justify-between">
                  <span>エピソード詳細の作成</span>
                  <span className="font-bold">3クレジット</span>
                </div>
                <div className="flex justify-between">
                  <span>エピソード本文の作成</span>
                  <span className="font-bold">4クレジット</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} AI小説執筆支援システム - All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
