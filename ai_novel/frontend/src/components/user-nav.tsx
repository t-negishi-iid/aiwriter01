"use client"

import { User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export function UserNav() {
  return (
    <div className="flex items-center gap-2">
      <ThemeToggle />
      <Button variant="ghost" size="icon">
        <User className="h-5 w-5" />
        <span className="sr-only">ユーザーメニュー</span>
      </Button>
    </div>
  )
}
