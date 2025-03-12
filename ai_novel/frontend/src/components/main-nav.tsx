"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Feather } from "lucide-react"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

export function MainNav() {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-2">
      <Link href="/" className="flex items-center gap-2 mr-6">
        <Feather className="h-6 w-6" />
        <span className="hidden font-bold sm:inline-block">AI小説作成</span>
      </Link>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <Link href="/" legacyBehavior passHref>
              <NavigationMenuLink
                className={cn(
                  navigationMenuTriggerStyle(),
                  pathname === "/" && "bg-accent text-accent-foreground"
                )}
              >
                ホーム
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger
              className={cn(
                pathname.startsWith("/stories") && "bg-accent text-accent-foreground"
              )}
            >
              小説管理
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid gap-3 p-4 w-[200px]">
                <li>
                  <Link
                    href="/stories"
                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-4 no-underline outline-none focus:shadow-md"
                  >
                    <div className="mb-2 text-lg font-medium">
                      小説一覧
                    </div>
                    <p className="text-sm text-muted-foreground">
                      作成した小説の一覧を表示します
                    </p>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/stories/new"
                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-4 no-underline outline-none focus:shadow-md"
                  >
                    <div className="mb-2 text-lg font-medium">
                      新規作成
                    </div>
                    <p className="text-sm text-muted-foreground">
                      新しい小説を作成します
                    </p>
                  </Link>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/help" legacyBehavior passHref>
              <NavigationMenuLink
                className={cn(
                  navigationMenuTriggerStyle(),
                  pathname === "/help" && "bg-accent text-accent-foreground"
                )}
              >
                ヘルプ
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  )
}
