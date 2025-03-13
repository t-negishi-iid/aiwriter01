"use client"

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { storyApi, getCharacterDetail } from '@/lib/api-client';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';

// キャラクターの型定義
interface Character {
  id: number;
  name: string;
  role: string;
  age?: string;
  gender?: string;
  appearance?: string;
  personality?: string;
  background?: string;
  motivation?: string;
  relationship?: string;
  development?: string;
}

export default function CharacterDetailPage() {
  const router = useRouter();
  const params = useParams();
  const storyId = params.id as string;
  const characterId = params.characterId as string;

  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCharacter() {
      setLoading(true);
      try {
        const response = await getCharacterDetail(storyId, characterId);
        if (response.success && response.data) {
          setCharacter(response.data);
        } else {
          setError(response.message || 'キャラクター情報の取得に失敗しました');
        }
      } catch (err) {
        console.error('キャラクター取得エラー:', err);
        setError('キャラクター情報の取得中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    }

    fetchCharacter();
  }, [storyId, characterId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTitle>エラー</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!character) {
    return (
      <Alert className="my-4">
        <AlertTitle>情報がありません</AlertTitle>
        <AlertDescription>キャラクター情報が見つかりませんでした。</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/stories/${storyId}/characters`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">キャラクター詳細</h1>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="text-red-500">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">{character.name}</CardTitle>
          <CardDescription>{character.role}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">基本情報</h3>
              <div className="space-y-2">
                <div>
                  <span className="font-semibold">年齢:</span> {character.age}
                </div>
                <div>
                  <span className="font-semibold">性別:</span> {character.gender}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">外見</h3>
              <p className="text-sm text-gray-700">{character.appearance}</p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">性格</h3>
              <p className="text-sm text-gray-700">{character.personality}</p>
            </div>

            <div>
              <h3 className="font-medium mb-2">背景</h3>
              <p className="text-sm text-gray-700">{character.background}</p>
            </div>

            <div>
              <h3 className="font-medium mb-2">動機</h3>
              <p className="text-sm text-gray-700">{character.motivation}</p>
            </div>

            <div>
              <h3 className="font-medium mb-2">関係性</h3>
              <p className="text-sm text-gray-700">{character.relationship}</p>
            </div>

            <div>
              <h3 className="font-medium mb-2">成長</h3>
              <p className="text-sm text-gray-700">{character.development}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
