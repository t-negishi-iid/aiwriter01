import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getStory } from '@/lib/api-client';
import { ArrowLeft } from 'lucide-react';
import CharacterCreateForm from './character-create-form';

export const metadata: Metadata = {
  title: 'キャラクター作成',
  description: '新しいキャラクターを作成します',
};

interface CreateCharacterPageProps {
  params: {
    id: string;
  };
}

export default async function CreateCharacterPage({ params }: CreateCharacterPageProps) {
  const storyId = parseInt(params.id);

  if (isNaN(storyId)) {
    notFound();
  }

  try {
    const story = await getStory(storyId);

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
            <h1 className="text-3xl font-bold tracking-tight">キャラクター作成</h1>
            <p className="text-muted-foreground">
              「{story.title}」の新しいキャラクターを作成
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>キャラクター情報入力</CardTitle>
          </CardHeader>
          <CardContent>
            <CharacterCreateForm storyId={storyId} />
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    console.error('小説情報の取得に失敗しました:', error);
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold tracking-tight mb-6">キャラクター作成</h1>
        <div className="bg-destructive/10 p-4 rounded-md">
          <p className="text-destructive">
            小説情報の取得中にエラーが発生しました。しばらくしてからもう一度お試しください。
          </p>
        </div>
      </div>
    );
  }
}
