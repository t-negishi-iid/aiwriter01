"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function Navbar() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between py-4">
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors hover:text-primary ${pathname === "/" ? "text-primary" : "text-muted-foreground"
              }`}
          >
            ホーム
          </Link>
          <Link
            href="/stories"
            className={`text-sm font-medium transition-colors hover:text-primary ${pathname.startsWith("/stories") ? "text-primary" : "text-muted-foreground"
              }`}
          >
            小説一覧
          </Link>
          <Link
            href="/help"
            className={`text-sm font-medium transition-colors hover:text-primary ${pathname === "/help" ? "text-primary" : "text-muted-foreground"
              }`}
          >
            ヘルプ
          </Link>
        </nav>
      </div>
    </header>
  )
}
