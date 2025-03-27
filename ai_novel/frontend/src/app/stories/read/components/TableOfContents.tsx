"use client";

import React from 'react';

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

interface TableOfContentsProps {
  acts: Act[];
  episodes: { [key: number]: Episode[] };
  currentAct: number | null;
  currentEpisode: number | null;
  navigateToEpisode: (actNumber: number, episodeNumber: number) => void;
  onClose: () => void;
}

export default function TableOfContents({
  acts,
  episodes,
  currentAct,
  currentEpisode,
  navigateToEpisode,
  onClose
}: TableOfContentsProps) {
  return (
    <div className="fixed inset-0 z-50 flex">
      {/* オーバーレイ（背景） */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>
      
      {/* 目次の内容 */}
      <div className="relative max-w-md w-full h-full bg-white dark:bg-gray-800 shadow-lg overflow-auto z-10">
        <div className="p-4 border-b sticky top-0 bg-white dark:bg-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-semibold">目次</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="閉じる"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="p-4">
          {acts.length === 0 ? (
            <p className="text-gray-500 text-center">目次情報がありません</p>
          ) : (
            <div className="space-y-6">
              {acts.map((act) => (
                <div key={act.id} className="space-y-2">
                  <h3 className="font-medium text-lg border-b pb-1">
                    {act.title || `第${act.act_number}幕`}
                  </h3>
                  
                  <ul className="pl-4 space-y-2">
                    {episodes[act.act_number]?.map((episode) => (
                      <li 
                        key={episode.id}
                        className={`py-1 px-2 cursor-pointer rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          currentAct === act.act_number && currentEpisode === episode.episode_number
                            ? 'bg-blue-100 dark:bg-blue-900'
                            : ''
                        }`}
                        onClick={() => navigateToEpisode(act.act_number, episode.episode_number)}
                      >
                        {episode.title || `第${episode.episode_number}話`}
                      </li>
                    )) || (
                      <li className="text-gray-500">エピソード情報を読み込み中...</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
