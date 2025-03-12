"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, BookOpen, Users, Settings, Feather, BookText } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

export interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  disabled?: boolean
}

export function Navigation() {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    {
      title: "ホーム",
      href: "/",
      icon: <Home className="h-4 w-4" />,
    },
    {
      title: "基本設定",
      href: "/settings",
      icon: <Settings className="h-4 w-4" />,
    },
    {
      title: "キャラクター",
      href: "/characters",
      icon: <Users className="h-4 w-4" />,
    },
    {
      title: "プロット",
      href: "/plot",
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      title: "エピソード",
      href: "/episodes",
      icon: <BookText className="h-4 w-4" />,
    },
    {
      title: "執筆",
      href: "/content",
      icon: <Feather className="h-4 w-4" />,
    },
  ]

  return (
    <nav className="flex flex-col gap-2 p-4">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname === item.href
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
          )}
        >
          {item.icon}
          {item.title}
        </Link>
      ))}
    </nav>
  )
}

interface StoryCreationNavProps {
  storyId: string
  activeStep: number
}

export function StoryCreationNav({ storyId, activeStep }: StoryCreationNavProps) {
  const steps = [
    { name: "基本設定作成用データ", href: `/stories/${storyId}/basic-data` },
    { name: "基本設定", href: `/stories/${storyId}/basic-settings` },
    { name: "キャラクター詳細", href: `/stories/${storyId}/characters` },
    { name: "タイトル", href: `/stories/${storyId}/title` },
    { name: "あらすじ", href: `/stories/${storyId}/plot` },
    { name: "エピソード詳細", href: `/stories/${storyId}/episodes` },
    { name: "本文執筆", href: `/stories/${storyId}/content` }
  ]

  const progressValue = (activeStep / (steps.length - 1)) * 100

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">作成プロセス</h2>
        <span className="text-sm text-muted-foreground">
          ステップ {activeStep + 1}/{steps.length}
        </span>
      </div>

      <Progress value={progressValue} className="h-2" />

      <div className="grid grid-cols-1 md:grid-cols-7 gap-2 pt-2">
        {steps.map((step, index) => (
          <Button
            key={index}
            variant={index <= activeStep ? "default" : "outline"}
            size="sm"
            className={cn(
              "w-full text-xs",
              index > activeStep && "opacity-50"
            )}
            asChild
          >
            <Link href={step.href}>
              {index + 1}. {step.name}
            </Link>
          </Button>
        ))}
      </div>
    </div>
  )
}
