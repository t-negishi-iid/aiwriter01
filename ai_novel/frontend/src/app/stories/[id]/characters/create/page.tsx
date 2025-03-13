"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// CharacterCreateFormコンポーネントが存在しない場合は、仮のコンポーネントを作成
const CharacterCreateForm = ({ storyId }: { storyId: number }) => {
  return (
    <div>
      <p>キャラクター作成フォーム（開発中）</p>
      <p>小説ID: {storyId}</p>
    </div>
  );
};

export default function CreateCharacterPage() {
  const router = useRouter()
  const params = useParams()
  const storyId = parseInt(params.id as string);

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
        <h1 className="text-3xl font-bold">キャラクター作成</h1>
        <p className="text-muted-foreground mt-2">
          小説の登場人物を作成します。
          キャラクターの基本情報を入力してください。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>キャラクター情報</CardTitle>
          <CardDescription>
            キャラクターの基本情報を入力してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CharacterCreateForm storyId={storyId} />
        </CardContent>
      </Card>
    </div>
  )
}
