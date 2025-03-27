"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Card,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import ReaderContainer from '@/app/stories/read/components/ReaderContainer';
import { getStoryDetail, getActs, getEpisodes } from './utils/api-client';

interface Act {
  id: number;
  act_number: number;
  title: string;
}

interface Episode {
  id: number;
  episode_number: number;
  title: string;
}

export default function ReadPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const storyId = searchParams.get('id');
  const actNumber = searchParams.get('act');
  const episodeNumber = searchParams.get('episode');

  const [story, setStory] = useState<{id: number; title: string; catchphrase?: string} | null>(null);
  const [acts, setActs] = useState<Act[]>([]);
  const [episodes, setEpisodes] = useState<{ [key: number]: Episode[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedActs, setExpandedActs] = useState<string[]>([]);

  // 小説IDがない場合は /stories へリダイレクト
  useEffect(() => {
    if (!storyId) {
      router.push('/stories');
      return;
    }

    // 小説情報、幕、エピソード情報の取得
    const fetchStoryData = async () => {
      try {
        setIsLoading(true);
        
        // 小説情報の取得
        const storyDetail = await getStoryDetail(Number(storyId));
        setStory({
          id: Number(storyDetail.id),
          title: String(storyDetail.title),
          catchphrase: storyDetail.catchphrase ? String(storyDetail.catchphrase) : undefined
        });
        
        // エピソード表示モードではない場合のみ幕とエピソード一覧を取得
        if (!(actNumber && episodeNumber)) {
          // 幕情報の取得
          const actsData = await getActs(Number(storyId));
          // results配列を取得
          const actsArray = Array.isArray(actsData.results) ? actsData.results : [];
          // act_numberでソート
          const sortedActs = [...actsArray].sort((a: Act, b: Act) => a.act_number - b.act_number);
          setActs(sortedActs);
          
          // 各幕のエピソード取得
          const episodesMap: { [key: number]: Episode[] } = {};
          for (const act of sortedActs) {
            const episodesData = await getEpisodes(Number(storyId), act.act_number);
            // results配列を取得
            const episodesArray = Array.isArray(episodesData.results) ? episodesData.results : [];
            // episode_numberでソート
            episodesMap[act.act_number] = [...episodesArray].sort(
              (a: Episode, b: Episode) => a.episode_number - b.episode_number
            );
          }
          setEpisodes(episodesMap);
          
          // デフォルトで第一幕を開く
          if (sortedActs.length > 0) {
            setExpandedActs([`act-${sortedActs[0].act_number}`]);
          }
        }
        
        setError(null);
      } catch (err) {
        console.error('小説データの取得に失敗:', err);
        setError('小説データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoryData();
  }, [storyId, router, actNumber, episodeNumber]);

  // エピソードを選択
  const handleSelectEpisode = (actNum: number, episodeNum: number) => {
    router.push(`/stories/read?id=${storyId}&act=${actNum}&episode=${episodeNum}`);
  };

  // 一覧に戻る
  const handleBackToList = () => {
    router.push(`/stories/read?id=${storyId}`);
  };

  // リダイレクト処理中は何も表示しない
  if (!storyId) {
    return null;
  }

  // 特定のエピソードを表示する場合
  if (storyId && actNumber && episodeNumber) {
    return (
      <div className="container mx-auto p-4">
        <div className="mb-4">
          <Button variant="ghost" onClick={handleBackToList} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            エピソード一覧に戻る
          </Button>
        </div>
        <ReaderContainer 
          storyId={parseInt(storyId)} 
          initialAct={parseInt(actNumber)} 
          initialEpisode={parseInt(episodeNumber)} 
        />
      </div>
    );
  }

  // ローディング中の表示
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">小説情報を読み込み中...</p>
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex justify-center mt-4">
          <Button onClick={() => window.location.reload()}>
            ページを再読み込み
          </Button>
        </div>
      </div>
    );
  }

  // 幕とエピソード一覧の表示
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{story?.title || '小説'} - エピソード一覧</h1>
        <Button variant="outline" onClick={() => router.push('/stories')}>
          小説一覧に戻る
        </Button>
      </div>

      {story?.catchphrase && (
        <p className="text-lg italic mb-6">「{story.catchphrase}」</p>
      )}

      {acts.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-muted/50">
          <p className="text-lg text-muted-foreground mb-4">エピソードがまだありません</p>
        </div>
      ) : (
        <Accordion type="multiple" value={expandedActs} onValueChange={setExpandedActs} className="mb-6">
          {acts.map((act) => (
            <AccordionItem key={act.id} value={`act-${act.act_number}`} className="border rounded-md mb-2">
              <AccordionTrigger className="px-4 py-2 hover:bg-muted/30">
                <div className="flex items-center">
                  <span className="text-lg font-medium">第{act.act_number}幕: {act.title}</span>
                  <span className="ml-2 text-sm text-muted-foreground">
                    ({episodes[act.act_number]?.length || 0}エピソード)
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {episodes[act.act_number]?.map((episode) => (
                    <Card 
                      key={episode.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleSelectEpisode(act.act_number, episode.episode_number)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">
                          第{episode.episode_number}話: {episode.title}
                        </CardTitle>
                      </CardHeader>
                      <CardFooter className="pt-2 border-t">
                        <Button variant="ghost" size="sm" className="w-full">
                          <BookOpen className="h-4 w-4 mr-2" />
                          読む
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
                {(!episodes[act.act_number] || episodes[act.act_number].length === 0) && (
                  <p className="text-center text-muted-foreground py-4">
                    この幕にはまだエピソードがありません
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
