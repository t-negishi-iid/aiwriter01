"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Feather, Moon, Sun } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { Navigation } from "./navigation"

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { setTheme, theme } = useTheme()
  const pathname = usePathname()

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleMenu}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">メニューを切り替え</span>
          </Button>
          <Link href="/" className="flex items-center gap-2">
            <Feather className="h-6 w-6" />
            <span className="text-xl font-bold">AI小説作成</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname === "/" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            ホーム
          </Link>
          <Link
            href="/stories"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname.startsWith("/stories") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            小説一覧
          </Link>
          <Link
            href="/help"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname === "/help" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            ヘルプ
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">テーマを切り替え</span>
          </Button>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden">
          <Navigation />
        </div>
      )}
    </header>
  )
}
