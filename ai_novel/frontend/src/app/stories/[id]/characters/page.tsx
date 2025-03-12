import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getStory } from '@/lib/api-client';
import { getCharacterDetails } from '@/lib/api-client';
import { CharacterDetail } from '@/lib/types';
import { PlusCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'キャラクター詳細一覧',
  description: '小説のキャラクター詳細一覧を表示します',
};

interface CharactersPageProps {
  params: {
    id: string;
  };
}

export default async function CharactersPage({ params }: CharactersPageProps) {
  const storyId = parseInt(params.id);

  if (isNaN(storyId)) {
    notFound();
  }

  try {
    const story = await getStory(storyId);
    const characters = await getCharacterDetails(storyId);

    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">キャラクター詳細</h1>
            <p className="text-muted-foreground">
              「{story.title}」のキャラクター詳細一覧
            </p>
          </div>
          <Link href={`/stories/${storyId}/characters/create`}>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              新規キャラクター作成
            </Button>
          </Link>
        </div>

        {characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <h2 className="text-2xl font-semibold mb-2">キャラクターがまだ作成されていません</h2>
            <p className="text-muted-foreground mb-6">
              「新規キャラクター作成」ボタンをクリックして、キャラクターを作成しましょう。
            </p>
            <Link href={`/stories/${storyId}/characters/create`}>
              <Button size="lg">
                <PlusCircle className="mr-2 h-5 w-5" />
                キャラクターを作成する
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {characters.map((character: CharacterDetail) => (
              <Link key={character.id} href={`/stories/${storyId}/characters/${character.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle>{character.name}</CardTitle>
                    <CardDescription>{character.role}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {character.gender && (
                        <div>
                          <span className="font-semibold">性別: </span>
                          <span>{character.gender}</span>
                        </div>
                      )}
                      {character.age && (
                        <div>
                          <span className="font-semibold">年齢: </span>
                          <span>{character.age}</span>
                        </div>
                      )}
                      {character.personality && (
                        <div>
                          <span className="font-semibold">性格: </span>
                          <span className="line-clamp-2">{character.personality}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">詳細を見る</Button>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
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
