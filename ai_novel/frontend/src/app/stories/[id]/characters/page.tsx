"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { characterApi } from "@/lib/api"
import { Character } from "@/lib/types"

export default function CharactersPage() {
  const router = useRouter()
  const params = useParams();
  const storyId = params.id as string;

  const [characters, setCharacters] = useState<Character[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCharacters() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await characterApi.getCharacters(storyId.toString())
        if (response.success && response.data) {
          setCharacters(response.data)
        } else {
          throw new Error(response.message || "キャラクター一覧の取得に失敗しました")
        }
      } catch (err) {
        console.error("キャラクター一覧取得エラー:", err)
        setError(err instanceof Error ? err.message : "未知のエラーが発生しました")
      } finally {
        setIsLoading(false)
      }
    }

    fetchCharacters()
  }, [storyId])

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8">
        <Link
          href={`/stories/${storyId}`}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          小説詳細に戻る
        </Link>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">登場人物一覧</h1>
          <Button onClick={() => router.push(`/stories/${storyId}/characters/create`)}>
            <Plus className="mr-2 h-4 w-4" />
            新規キャラクター作成
          </Button>
        </div>
        <p className="text-muted-foreground mt-2">
          小説の登場人物一覧です。
          キャラクターをクリックすると詳細を確認できます。
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>エラーが発生しました</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">読み込み中...</span>
        </div>
      ) : characters.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="flex flex-col items-center">
              <h3 className="text-lg font-medium mb-2">キャラクターがありません</h3>
              <p className="text-muted-foreground mb-6">
                「新規キャラクター作成」ボタンからキャラクターを作成しましょう
              </p>
              <Button onClick={() => router.push(`/stories/${storyId}/characters/create`)}>
                <Plus className="mr-2 h-4 w-4" />
                新規キャラクター作成
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {characters.map((character) => (
            <Card key={character.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">{character.name}</CardTitle>
                <CardDescription>{character.role}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground line-clamp-3">
                  {character.personality || "性格の説明はありません"}
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" asChild className="ml-auto">
                  <Link href={`/stories/${storyId}/characters/${character.id}`}>
                    詳細を見る
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
