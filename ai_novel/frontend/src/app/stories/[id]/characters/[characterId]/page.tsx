import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getStory, getCharacterDetail } from '@/lib/api-client';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'キャラクター詳細',
  description: 'キャラクターの詳細情報を表示します',
};

interface CharacterDetailPageProps {
  params: {
    id: string;
    characterId: string;
  };
}

export default async function CharacterDetailPage({ params }: CharacterDetailPageProps) {
  const storyId = parseInt(params.id);
  const characterId = parseInt(params.characterId);

  if (isNaN(storyId) || isNaN(characterId)) {
    notFound();
  }

  try {
    const story = await getStory(storyId);
    const character = await getCharacterDetail(storyId, characterId);

    if (!character) {
      notFound();
    }

    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Link href={`/stories/${storyId}/characters`}>
            <Button variant="outline" size="sm" className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              戻る
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{character.name}</h1>
            <p className="text-muted-foreground">
              「{story.title}」のキャラクター詳細
            </p>
          </div>
        </div>

        <div className="flex justify-end mb-6 space-x-2">
          <Link href={`/stories/${storyId}/characters/${characterId}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              編集
            </Button>
          </Link>
          <Button variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            削除
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">役割</h3>
                  <p>{character.role}</p>
                </div>
                {character.age && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground">年齢</h3>
                    <p>{character.age}</p>
                  </div>
                )}
                {character.gender && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground">性別</h3>
                    <p>{character.gender}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>詳細情報</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {character.appearance && (
                  <div>
                    <h3 className="font-semibold mb-2">外見</h3>
                    <p className="whitespace-pre-line">{character.appearance}</p>
                    <Separator className="my-4" />
                  </div>
                )}

                {character.personality && (
                  <div>
                    <h3 className="font-semibold mb-2">性格</h3>
                    <p className="whitespace-pre-line">{character.personality}</p>
                    <Separator className="my-4" />
                  </div>
                )}

                {character.background && (
                  <div>
                    <h3 className="font-semibold mb-2">背景</h3>
                    <p className="whitespace-pre-line">{character.background}</p>
                    <Separator className="my-4" />
                  </div>
                )}

                {character.motivation && (
                  <div>
                    <h3 className="font-semibold mb-2">動機</h3>
                    <p className="whitespace-pre-line">{character.motivation}</p>
                    <Separator className="my-4" />
                  </div>
                )}

                {character.relationship && (
                  <div>
                    <h3 className="font-semibold mb-2">他キャラクターとの関係</h3>
                    <p className="whitespace-pre-line">{character.relationship}</p>
                    <Separator className="my-4" />
                  </div>
                )}

                {character.development && (
                  <div>
                    <h3 className="font-semibold mb-2">キャラクター成長</h3>
                    <p className="whitespace-pre-line">{character.development}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } catch (error) {
    console.error('キャラクター詳細の取得に失敗しました:', error);
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold tracking-tight mb-6">キャラクター詳細</h1>
        <div className="bg-destructive/10 p-4 rounded-md">
          <p className="text-destructive">
            キャラクター詳細の取得中にエラーが発生しました。しばらくしてからもう一度お試しください。
          </p>
        </div>
      </div>
    );
  }
}
