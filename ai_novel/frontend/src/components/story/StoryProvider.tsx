'use client';

import { useState, useEffect, ReactNode, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { storyApi, integratedSettingCreatorApi, basicSettingApi, characterApi, plotApi } from '@/lib/api-client';
import { Story } from '@/types/story';
import { ActDetail } from '@/lib/unified-api-client';

// コンテキスト用の型定義
interface StoryContextType {
  story: Story | null;
  basicSettingData: any;
  basicSetting: any;
  characters: any[];
  plot: any;
  isLoading: boolean;
  error: string | null;
  selectedAct: ActDetail | null;
  setSelectedAct: (act: ActDetail | null) => void;
}

// デフォルト値を持つコンテキストを作成
const StoryContext = createContext<StoryContextType>({
  story: null,
  basicSettingData: null,
  basicSetting: null,
  characters: [],
  plot: null,
  isLoading: true,
  error: null,
  selectedAct: null,
  setSelectedAct: () => {}
});

interface StoryProviderProps {
  children: ReactNode;
  storyId: string;
}

export function StoryProvider({ children, storyId }: StoryProviderProps) {
  const [story, setStory] = useState<Story | null>(null);
  const [basicSettingData, setBasicSettingData] = useState<any>(null);
  const [basicSetting, setBasicSetting] = useState<any>(null);
  const [characters, setCharacters] = useState<any[]>([]);
  const [plot, setPlot] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAct, setSelectedAct] = useState<ActDetail | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 並行して各種データを取得
        const [storyData, integratedData, basicSettingData, charactersData, plotData] = await Promise.allSettled([
          storyApi.getStory(storyId),
          integratedSettingCreatorApi.getIntegratedSettingData(storyId),
          basicSettingApi.getBasicSetting(storyId),
          characterApi.getCharacters(storyId),
          plotApi.getPlot(storyId)
        ]);

        console.log('======= デバッグ情報: StoryProvider データ取得結果 =======');

        // 小説情報の取得結果を処理
        if (storyData.status === 'fulfilled') {
          console.log('小説情報:', storyData.value);
          setStory(storyData.value);
        } else {
          console.error("小説情報取得エラー:", storyData.reason);
        }

        // 統合設定クリエイターデータ（基本設定）の取得結果を処理
        if (integratedData.status === 'fulfilled') {
          console.log('統合設定クリエイターデータ:', integratedData.value);
          const data = integratedData.value;
          if (data && data.results && data.results.basic_setting_data) {
            setBasicSettingData(data.results.basic_setting_data);
          }
        } else {
          console.error("統合設定クリエイターデータ取得エラー:", integratedData.reason);
        }

        // 作品設定（BasicSetting）の取得結果を処理
        if (basicSettingData.status === 'fulfilled') {
          console.log('作品設定(BasicSetting):', basicSettingData.value);
          console.log('作品設定の詳細構造:', JSON.stringify(basicSettingData.value, null, 2));
          if (basicSettingData.value) {
            console.log('基本設定ID:', basicSettingData.value.id);
          }
          setBasicSetting(basicSettingData.value || null);
        } else {
          console.error("作品設定取得エラー:", basicSettingData.reason);
        }

        // キャラクター情報の取得結果を処理
        if (charactersData.status === 'fulfilled') {
          console.log('キャラクター情報:', charactersData.value);
          // APIレスポンスの形式に応じて処理
          const data = charactersData.value;
          if (Array.isArray(data)) {
            setCharacters(data);
          } else if (data && data.results && Array.isArray(data.results)) {
            setCharacters(data.results);
          } else {
            setCharacters([]);
          }
        } else {
          console.error("キャラクター情報取得エラー:", charactersData.reason);
          setCharacters([]);
        }

        // あらすじ情報の取得結果を処理
        if (plotData.status === 'fulfilled') {
          console.log('あらすじ情報:', plotData.value);
          setPlot(plotData.value || null);
        } else {
          console.error("あらすじ情報取得エラー:", plotData.reason);
        }

        console.log('======= デバッグ情報: 終了 =======');
      } catch (err) {
        console.error("データ取得中にエラーが発生しました:", err);
        setError('データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    if (storyId) {
      fetchData();
    } else {
      setIsLoading(false);
      setError('小説IDが指定されていません');
    }
  }, [storyId]);

  // コンテキスト値
  const contextValue: StoryContextType = {
    story,
    basicSettingData,
    basicSetting,
    characters,
    plot,
    isLoading,
    error,
    selectedAct,
    setSelectedAct
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">読み込み中...</span>
        </div>
      </div>
    );
  }

  return (
    <StoryContext.Provider value={contextValue}>
      <div className="container mx-auto py-10">
        <div className="mb-8">
          <Link
            href="/stories"
            className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            小説一覧に戻る
          </Link>
          <p className="text-muted-foreground mt-2">
            {story?.catchphrase && story.catchphrase.length > 30
              ? `${story.catchphrase.substring(0, 30)}...`
              : story?.catchphrase || "説明はありません"}
          </p>
          <h1 className="text-3xl font-bold">{story?.title || "無題の小説"}</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {story?.summary && story.summary.length > 80
              ? `${story.summary.substring(0, 80)}...`
              : story?.summary || "説明はありません"}
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>エラーが発生しました</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {children}
      </div>
    </StoryContext.Provider>
  );
}

export function useStoryContext() {
  return useContext(StoryContext);
}
