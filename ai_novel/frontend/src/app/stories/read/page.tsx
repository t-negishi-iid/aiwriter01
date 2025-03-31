"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getStoryDetail, getActs, getEpisodes } from './utils/api-client';
import { StoryTabs } from '@/components/story/StoryTabs';
import { StoryProvider } from '@/components/story/StoryProvider';

// 型定義
interface Story {
  id: number;
  title: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

interface Act {
  id: number;
  act_number: number;
  title: string;
  story_id?: number;
}

interface Episode {
  id: number;
  episode_number: number;
  title: string;
  act_id?: number;
}

interface ApiResponse<T> {
  results: T[];
  count?: number;
  next?: string | null;
  previous?: string | null;
}

// 型ガード関数
function isStory(obj: unknown): obj is Story {
  return obj !== null && 
         typeof obj === 'object' && 
         'id' in obj && 
         typeof (obj as Record<string, unknown>).id === 'number' && 
         'title' in obj && 
         typeof (obj as Record<string, unknown>).title === 'string';
}

function isApiResponse<T>(obj: unknown): obj is ApiResponse<T> {
  return obj !== null && 
         typeof obj === 'object' && 
         'results' in obj && 
         Array.isArray((obj as Record<string, unknown>).results);
}

// エピソード一覧表示ページ
export default function ReadPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const storyId = searchParams.get('id');

  const [story, setStory] = useState<Story | null>(null);
  const [acts, setActs] = useState<Act[]>([]);
  const [episodes, setEpisodes] = useState<Record<number, Episode[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 小説IDがない場合は /stories へリダイレクト
  useEffect(() => {
    if (!storyId) {
      router.push('/stories');
      return;
    }

    const fetchStoryData = async () => {
      try {
        setIsLoading(true);
        // 小説の詳細情報を取得
        const storyData = await getStoryDetail(parseInt(storyId));
        if (isStory(storyData)) {
          setStory(storyData);
        } else {
          console.error('無効な小説データ形式:', storyData);
          setError('小説データの形式が無効です');
          return;
        }

        // 幕（Act）情報を取得
        const actsData = await getActs(parseInt(storyId));
        if (isApiResponse<Act>(actsData)) {
          setActs(actsData.results);
        } else {
          console.error('無効な幕データ形式:', actsData);
          setError('幕データの形式が無効です');
          return;
        }

        // 各幕のエピソード情報を取得
        const episodesObj: Record<number, Episode[]> = {};
        for (const act of actsData.results) {
          const episodesData = await getEpisodes(parseInt(storyId), act.act_number);
          if (isApiResponse<Episode>(episodesData)) {
            episodesObj[act.act_number] = episodesData.results;
          } else {
            console.error(`幕${act.act_number}の無効なエピソードデータ形式:`, episodesData);
          }
        }
        setEpisodes(episodesObj);

        setError(null);
      } catch (err) {
        setError('小説情報の取得に失敗しました');
        console.error('小説情報の取得エラー:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoryData();
  }, [storyId, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">エラー: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return storyId && story ? (
    <StoryProvider storyId={storyId}>
      <div className="container mx-auto py-6">
        <StoryTabs storyId={storyId} activeTab="read" />

        <div className="mt-6">
          <h1 className="text-2xl font-bold mb-6">{story.title}</h1>

          <div className="space-y-8">
            {acts.map((act) => (
              <div key={act.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">
                  {act.title || `第${act.act_number}幕`}
                </h2>

                <div className="space-y-2">
                  {episodes[act.act_number]?.length > 0 ? (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {episodes[act.act_number].map((episode) => (
                        <li key={episode.id} className="py-3">
                          <Link
                            href={`/stories/read/reader?id=${storyId}&act=${act.act_number}&episode=${episode.episode_number}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-between"
                          >
                            <span>
                              {episode.title || `第${episode.episode_number}話`}
                            </span>
                            <span className="text-gray-500 text-sm">
                              読む →
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">エピソードがありません</p>
                  )}
                </div>
              </div>
            ))}

            {acts.length === 0 && (
              <div className="text-center p-8">
                <p className="text-gray-500">この小説にはまだ幕が登録されていません</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </StoryProvider>
  ) : null;
}
