"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getStoryDetail, getActs, getEpisodes, getEpisodeContent } from '../utils/api-client';
import ReaderControls from '@/app/stories/read/components/ReaderControls';
import TableOfContents from '@/app/stories/read/components/TableOfContents';
import styles from './reader.module.css';

interface ReaderContainerProps {
  storyId: number;
  initialAct?: number;
  initialEpisode?: number;
}

interface Story {
  id: number;
  title: string;
}

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

interface EpisodeContent {
  id: number;
  title: string;
  content: string;
}

export default function ReaderContainer({ storyId, initialAct, initialEpisode }: ReaderContainerProps) {
  const [story, setStory] = useState<Story | null>(null);
  const [acts, setActs] = useState<Act[]>([]);
  const [episodes, setEpisodes] = useState<{ [key: number]: Episode[] }>({});
  const [currentAct, setCurrentAct] = useState<number | null>(initialAct || null);
  const [currentEpisode, setCurrentEpisode] = useState<number | null>(initialEpisode || null);
  const [content, setContent] = useState<EpisodeContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showToc, setShowToc] = useState(false);
  const router = useRouter();

  // 読書設定
  const [fontSize, setFontSize] = useState(16); // フォントサイズ (px)
  const [isVertical, setIsVertical] = useState(false); // 縦書き/横書き
  const [theme, setTheme] = useState('light'); // light, sepia, dark

  const contentRef = useRef<HTMLDivElement>(null);

  // 小説詳細の取得
  useEffect(() => {
    const fetchStoryDetail = async () => {
      try {
        setLoading(true);
        const storyData = await getStoryDetail(storyId);
        setStory(storyData);

        // 小説の幕（Act）情報を取得
        const actsData = await getActs(storyId);
        const actsList = actsData.results || [];
        setActs(actsList);

        if (actsList.length > 0 && !initialAct) {
          setCurrentAct(actsList[0].act_number);
        }

        setError(null);
      } catch (err) {
        setError('小説情報の取得に失敗しました');
        console.error('小説情報の取得エラー:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStoryDetail();
  }, [storyId, initialAct]);

  // 現在の幕が変更されたら、その幕のエピソード一覧を取得
  useEffect(() => {
    if (currentAct === null) return;

    const fetchEpisodes = async () => {
      try {
        setLoading(true);
        const episodesData = await getEpisodes(storyId, currentAct);
        const episodesList = episodesData.results || [];

        setEpisodes(prev => ({
          ...prev,
          [currentAct]: episodesList
        }));

        if (episodesList.length > 0 && !initialEpisode) {
          setCurrentEpisode(episodesList[0].episode_number);
        }
      } catch (err) {
        setError(`エピソード一覧の取得に失敗しました（幕${currentAct}）`);
        console.error('エピソード一覧の取得エラー:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEpisodes();
  }, [storyId, currentAct, initialEpisode]);

  // 現在のエピソードが変更されたら、そのエピソードの本文を取得
  useEffect(() => {
    if (currentAct === null || currentEpisode === null) return;

    const fetchContent = async () => {
      try {
        setLoading(true);
        const contentData = await getEpisodeContent(storyId, currentAct, currentEpisode);
        setContent(contentData);

        // スクロール位置をリセット
        if (contentRef.current) {
          contentRef.current.scrollTop = 0;
        }
      } catch (err) {
        setError(`エピソード本文の取得に失敗しました（幕${currentAct}、エピソード${currentEpisode}）`);
        console.error('エピソード本文の取得エラー:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [storyId, currentAct, currentEpisode]);

  // 次のエピソードに進む
  const goToNextEpisode = () => {
    if (currentAct === null || currentEpisode === null) return;

    const currentActEpisodes = episodes[currentAct] || [];
    const currentIndex = currentActEpisodes.findIndex(ep => ep.episode_number === currentEpisode);

    if (currentIndex < currentActEpisodes.length - 1) {
      // 同じ幕の次のエピソードへ
      setCurrentEpisode(currentActEpisodes[currentIndex + 1].episode_number);
    } else {
      // 次の幕の最初のエピソードへ
      const currentActIndex = acts.findIndex(act => act.act_number === currentAct);

      if (currentActIndex < acts.length - 1) {
        const nextAct = acts[currentActIndex + 1].act_number;
        setCurrentAct(nextAct);

        // 次の幕のエピソードが既に読み込まれているかチェック
        if (episodes[nextAct] && episodes[nextAct].length > 0) {
          setCurrentEpisode(episodes[nextAct][0].episode_number);
        } else {
          // エピソードはまだ読み込まれていないので、useEffectで自動的に読み込まれる
          setCurrentEpisode(null);
        }
      }
    }
  };

  // 前のエピソードに戻る
  const goToPrevEpisode = () => {
    if (currentAct === null || currentEpisode === null) return;

    const currentActEpisodes = episodes[currentAct] || [];
    const currentIndex = currentActEpisodes.findIndex(ep => ep.episode_number === currentEpisode);

    if (currentIndex > 0) {
      // 同じ幕の前のエピソードへ
      setCurrentEpisode(currentActEpisodes[currentIndex - 1].episode_number);
    } else {
      // 前の幕の最後のエピソードへ
      const currentActIndex = acts.findIndex(act => act.act_number === currentAct);

      if (currentActIndex > 0) {
        const prevAct = acts[currentActIndex - 1].act_number;
        setCurrentAct(prevAct);

        // 前の幕のエピソードが既に読み込まれているかチェック
        if (episodes[prevAct] && episodes[prevAct].length > 0) {
          const lastEpisode = episodes[prevAct][episodes[prevAct].length - 1];
          setCurrentEpisode(lastEpisode.episode_number);
        } else {
          // エピソードはまだ読み込まれていないので、useEffectで自動的に読み込まれる
          setCurrentEpisode(null);
        }
      }
    }
  };

  // 特定のエピソードに移動
  const navigateToEpisode = (actNumber: number, episodeNumber: number) => {
    setCurrentAct(actNumber);
    setCurrentEpisode(episodeNumber);
    setShowToc(false); // 目次を閉じる
  };

  // テーマを切り替え
  const changeTheme = (newTheme: string) => {
    setTheme(newTheme);
  };

  // フォントサイズを変更
  const changeFontSize = (size: number) => {
    setFontSize(size);
  };

  // 縦書き/横書きを切り替え
  const toggleWritingMode = () => {
    setIsVertical(prev => !prev);
  };

  // テーマに応じたスタイルクラス名を取得
  const getThemeClassName = () => {
    switch (theme) {
      case 'sepia':
        return styles.sepiaTheme;
      case 'dark':
        return styles.darkTheme;
      default: // light
        return styles.lightTheme;
    }
  };

  const canGoPrev = () => {
    if (currentAct === null || currentEpisode === null) return false;

    const currentActEpisodes = episodes[currentAct] || [];
    const currentIndex = currentActEpisodes.findIndex(ep => ep.episode_number === currentEpisode);

    return currentIndex > 0 || acts.findIndex(act => act.act_number === currentAct) > 0;
  };

  const canGoNext = () => {
    if (currentAct === null || currentEpisode === null) return false;

    const currentActEpisodes = episodes[currentAct] || [];
    const currentIndex = currentActEpisodes.findIndex(ep => ep.episode_number === currentEpisode);

    return currentIndex < currentActEpisodes.length - 1 || acts.findIndex(act => act.act_number === currentAct) < acts.length - 1;
  };

  const handleCloseButton = () => {
    console.log('閉じるボタンがクリックされました');
    console.log(`遷移先URL: /stories/read?id=${storyId}`);
    // 正しいエピソード一覧画面へ遷移（Next.jsのrouter使用）
    router.push(`/stories/read?id=${storyId}`);
  };

  if (loading && !story) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !story) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative my-4 mx-auto max-w-4xl">
        <strong className="font-bold">エラー：</strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className={`${styles.readerContainer} ${getThemeClassName()}`}>
      {/* サイドバー表示ボタンのみのシンプルなヘッダー */}
      <div className="fixed top-3 left-3 z-50">
        <button
          onClick={() => setShowToc(prev => !prev)}
          className="p-2 rounded-full bg-white/80 shadow-md hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label="目次を表示/非表示"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* 閉じるボタン（右上） */}
      <div className="fixed top-3 right-3 z-50">
        <button
          onClick={handleCloseButton}
          className="p-2 rounded-full bg-white/80 shadow-md hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label="閉じる"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* 設定コントロールを左上に配置 */}
      <div className="fixed top-3 left-16 z-50">
        <ReaderControls
          fontSize={fontSize}
          onChangeFontSize={changeFontSize}
          isVertical={isVertical}
          onToggleWritingMode={toggleWritingMode}
          theme={theme}
          onChangeTheme={changeTheme}
        />
      </div>

      {/* 目次（サイドバー） */}
      {showToc && (
        <TableOfContents
          acts={acts}
          episodes={episodes}
          currentAct={currentAct}
          currentEpisode={currentEpisode}
          navigateToEpisode={navigateToEpisode}
          onClose={() => setShowToc(false)}
        />
      )}

      {/* メインコンテンツ */}
      <main className="flex-grow flex flex-col overflow-hidden pt-14">
        {/* 横書きモード：前のエピソードに移動するボタン（上部中央） */}
        {!isVertical && (
          <div className="flex justify-center my-4">
            <button
              onClick={goToPrevEpisode}
              disabled={!canGoPrev()}
              className={`p-2 rounded-full bg-white/80 shadow-md ${canGoPrev()
                ? 'hover:bg-gray-200 dark:hover:bg-gray-700'
                : 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                }`}
              aria-label="前のエピソード"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          </div>
        )}

        {/* 縦書きモード：次のエピソードに移動するボタン（左側中央） */}
        {isVertical && (
          <div className="fixed left-3 top-1/2 transform -translate-y-1/2 z-40">
            <button
              onClick={goToNextEpisode}
              disabled={!canGoNext()}
              className={`p-2 rounded-full bg-white/80 shadow-md ${canGoNext()
                ? 'hover:bg-gray-200 dark:hover:bg-gray-700'
                : 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                }`}
              aria-label="次のエピソード"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        )}

        {/* 本文コンテンツ */}
        <div
          ref={contentRef}
          className={`${styles.contentContainer} ${isVertical ? styles.verticalWriting : ''}`}
          style={{ fontSize: `${fontSize}px` }}
        >
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative my-4">
              <span className="block sm:inline">{error}</span>
            </div>
          ) : !content ? (
            <div className="text-center text-gray-500">
              エピソードを選択してください
            </div>
          ) : (
            <div className={isVertical ? 'min-h-full' : ''}>
              {/* エピソードタイトル */}
              <h2 className="text-xl font-semibold text-center py-4 mb-4">{content.title}</h2>

              {content.content.split('\n').map((paragraph, index) => (
                <p key={index} className={isVertical ? styles.verticalParagraph : styles.paragraph}>{paragraph}</p>
              ))}
            </div>
          )}
        </div>

        {/* 横書きモード：次のエピソードに移動するボタン（下部中央） */}
        {!isVertical && (
          <div className="flex justify-center my-4">
            <button
              onClick={goToNextEpisode}
              disabled={!canGoNext()}
              className={`p-2 rounded-full bg-white/80 shadow-md ${canGoNext()
                ? 'hover:bg-gray-200 dark:hover:bg-gray-700'
                : 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                }`}
              aria-label="次のエピソード"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        )}

        {/* 縦書きモード：前のエピソードに移動するボタン（右側中央） */}
        {isVertical && (
          <div className="fixed right-3 top-1/2 transform -translate-y-1/2 z-40">
            <button
              onClick={goToPrevEpisode}
              disabled={!canGoPrev()}
              className={`p-2 rounded-full bg-white/80 shadow-md ${canGoPrev()
                ? 'hover:bg-gray-200 dark:hover:bg-gray-700'
                : 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                }`}
              aria-label="前のエピソード"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
