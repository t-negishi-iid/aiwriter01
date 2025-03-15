"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, BookOpen, Users, Settings, Feather, BookText } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface StoryCreationNavProps {
  storyId: string
  activeStep: number
}

export function StoryCreationNav({ storyId, activeStep }: StoryCreationNavProps) {
  const steps = [
    { name: "基本設定", href: `/stories/${storyId}/basic-data` },
    { name: "作品設定", href: `/stories/${storyId}/basic-settings` },
    { name: "登場人物", href: `/stories/${storyId}/characters` },
    { name: "あらすじ詳細", href: `/stories/${storyId}/plot` },
    { name: "エピソード詳細", href: `/stories/${storyId}/episodes` },
    { name: "小説執筆", href: `/stories/${storyId}/content` }
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
      <nav className="flex flex-col space-y-1">
        {steps.map((step, index) => (
          <Link
            key={step.href}
            href={step.href}
            className={cn(
              "flex items-center px-3 py-2 text-sm rounded-md",
              index === activeStep
                ? "bg-primary text-primary-foreground font-medium"
                : index < activeStep
                ? "text-foreground hover:bg-muted"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <div
              className={cn(
                "mr-2 h-4 w-4 rounded-full flex items-center justify-center text-xs",
                index === activeStep
                  ? "bg-background text-foreground"
                  : index < activeStep
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted-foreground text-muted"
              )}
            >
              {index < activeStep ? "✓" : index + 1}
            </div>
            {step.name}
          </Link>
        ))}
      </nav>
    </div>
  )
}
