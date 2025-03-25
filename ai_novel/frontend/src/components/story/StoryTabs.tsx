'use client';

import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StoryTabsProps {
  storyId: string;
  activeTab: string;
}

export function StoryTabs({ storyId, activeTab }: StoryTabsProps) {
  const tabs = [
    { value: 'overview', label: '概要', href: `/stories?id=${storyId}` },
    { value: 'basic-setting-data', label: '基本設定', href: `/stories/basic-setting-data?id=${storyId}` },
    { value: 'basic-setting', label: '作品設定', href: `/stories/basic-setting?id=${storyId}` },
    { value: 'characters', label: '人物設定', href: `/stories/characters?id=${storyId}` },
    { value: 'plot', label: 'あらすじ詳細化', href: `/stories/plot?id=${storyId}` },
    { value: 'episodes', label: 'エピソードに分割', href: `/stories/episodes?id=${storyId}` },
    { value: 'content', label: '本文執筆', href: `/stories/content?id=${storyId}` },
    { value: 'summary', label: '小説を読む', href: `/stories/read?id=${storyId}` },

  ];

  return (
    <Tabs value={activeTab} className="w-full">
      <TabsList className="grid w-full grid-cols-7">
        {tabs.map((tab) => (
          <Link key={tab.value} href={tab.href} passHref>
            <TabsTrigger value={tab.value} className="w-full">
              {tab.label}
            </TabsTrigger>
          </Link>
        ))}
      </TabsList>
    </Tabs>
  );
}
