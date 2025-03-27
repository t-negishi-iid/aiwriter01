import type { Metadata } from "next"
import { Inter as FontSans } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { ThemeProvider } from "@/components/ui/theme-provider"
import { Navbar } from "@/components/layout/navbar"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "AIブロックノベルエディタ",
  description: "AIを活用した小説執筆支援システム",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1 container py-4">{children}</main>
            <footer className="border-t py-4 y-m-20">
              <div className="container text-center text-sm text-muted-foreground">
                ブロックノベルAIエディタ © {new Date().getFullYear()} 株式会社イード
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
