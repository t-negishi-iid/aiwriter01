import Link from "next/link"
import { Feather } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-6 flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center gap-2 mb-4 md:mb-0">
          <Feather className="h-5 w-5" />
          <span className="text-lg font-semibold">AI小説作成</span>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
          <nav className="flex gap-4 md:gap-6">
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
              利用規約
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
              プライバシーポリシー
            </Link>
            <Link href="/help" className="text-sm text-muted-foreground hover:text-foreground">
              ヘルプ
            </Link>
          </nav>
          <div className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} AI小説作成支援システム
          </div>
        </div>
      </div>
    </footer>
  )
}
