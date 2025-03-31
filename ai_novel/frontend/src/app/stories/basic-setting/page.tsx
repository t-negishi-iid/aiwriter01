'use client';

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Blocks, Book } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { StoryProvider } from '@/components/story/StoryProvider';
import { StoryTabs } from '@/components/story/StoryTabs';
import { basicSettingApi } from '@/lib/api-client';
import { unifiedStoryApi } from '@/lib/unified-api-client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";

// 統合設定データの型定義
interface IntegratedSettingData {
  id: number;
  basic_setting_data: string;
  integrated_data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// 作品設定データの型定義
interface WorkSettingData {
  id?: number;                // 作品設定ID
  storyId: string | null;     // 小説ID
  basicSettingDataId: number; // 基本設定データID
  title: string;              // タイトル
  summary: string;            // サマリー
  theme: string;              // テーマ（主題）
  themeDescription: string;   // テーマ（主題）の説明：未使用
  timePlace: string;          // 時代と場所
  worldSetting: string;       // 作品世界と舞台設定
  worldSettingBasic: string;  // 基本的な世界観：未使用
  worldSettingFeatures: string;// 特徴的な要素：未使用
  writingStyle: string;       // 参考とする作風
  writingStyleStructure: string;// 文体と構造的特徴：未使用
  writingStyleExpression: string;// 表現技法：未使用
  writingStyleTheme: string;  // テーマと主題：未使用
  emotional: string;          // 情緒的・感覚的要素
  emotionalLove: string;      // 愛情表現：未使用
  emotionalFeelings: string;  // 感情表現：未使用
  emotionalAtmosphere: string;// 雰囲気演出：未使用
  emotionalSensuality: string;// 官能的表現：未使用
  characters: string;         // 主な登場人物
  keyItems: string;           // 主な固有名詞
  mystery: string;            // 物語の背景となる過去の謎
  plotPattern: string;        // プロットパターン
  act1Overview: string;       // 第1幕概要
  act2Overview: string;       // 第2幕概要
  act3Overview: string;       // 第3幕概要
  rawContent: string;         // 生成された元の内容全体
  createdAt?: string;         // 作成日時
  updatedAt?: string;         // 更新日時
}

export default function BasicSettingPage() {
  const searchParams = useSearchParams();
  const storyId = searchParams.get('id');
  const router = useRouter();
  const [basicSettingData, setBasicSettingData] = useState<string | null>(null);
  const [basicSettingDataId, setBasicSettingDataId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 作品設定データの状態
  const [workSettingData, setWorkSettingData] = useState<WorkSettingData>({
    storyId: storyId,
    basicSettingDataId: 0,
    title: '',
    summary: '',
    theme: '',
    themeDescription: '',
    timePlace: '',
    worldSetting: '',
    worldSettingBasic: '',
    worldSettingFeatures: '',
    writingStyle: '',
    writingStyleStructure: '',
    writingStyleExpression: '',
    writingStyleTheme: '',
    emotional: '',
    emotionalLove: '',
    emotionalFeelings: '',
    emotionalAtmosphere: '',
    emotionalSensuality: '',
    characters: '',
    keyItems: '',
    mystery: '',
    plotPattern: '',
    act1Overview: '',
    act2Overview: '',
    act3Overview: '',
    rawContent: ''
  });

  // テキストエリアへの参照
  const refs = {
    title: useRef<HTMLTextAreaElement>(null),
    summary: useRef<HTMLTextAreaElement>(null),
    theme: useRef<HTMLTextAreaElement>(null),
    timePlace: useRef<HTMLTextAreaElement>(null),
    worldSetting: useRef<HTMLTextAreaElement>(null),
    writingStyle: useRef<HTMLTextAreaElement>(null),
    emotional: useRef<HTMLTextAreaElement>(null),
    characters: useRef<HTMLTextAreaElement>(null),
    keyItems: useRef<HTMLTextAreaElement>(null),
    mystery: useRef<HTMLTextAreaElement>(null),
    plotPattern: useRef<HTMLTextAreaElement>(null),
    act1Overview: useRef<HTMLTextAreaElement>(null),
    act2Overview: useRef<HTMLTextAreaElement>(null),
    act3Overview: useRef<HTMLTextAreaElement>(null),
    rawContent: useRef<HTMLTextAreaElement>(null)
  };

  useEffect(() => {
    // 画面サイズを検出して、モバイルかどうかを判定
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // 初期チェック
    checkIfMobile();

    // リサイズイベントのリスナーを追加
    window.addEventListener('resize', checkIfMobile);

    // クリーンアップ
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  useEffect(() => {
    const fetchBasicSettingData = async () => {
      if (!storyId) return;

      setIsLoading(true);
      setError(null);

      try {
        // 統合設定クリエイターデータを取得
        const response = await unifiedStoryApi.getIntegratedSettingCreatorData(storyId);
        console.log("統合設定クリエイターデータの取得結果:", response);

        if (response && response.success && response.data) {
          // データを適切な型にキャスト
          const settingData = response.data as IntegratedSettingData;

          // basic_setting_dataを設定
          setBasicSettingData(settingData.basic_setting_data || null);

          // basic_setting_data_idを保存
          if (settingData.id) {
            const id = settingData.id;
            setBasicSettingDataId(id);
            setWorkSettingData(prev => ({
              ...prev,
              basicSettingDataId: id
            }));
          }
        } else {
          setBasicSettingData(null);
        }

        // 既存の作品設定データを取得
        try {
          const basicSettingResponse = await basicSettingApi.getBasicSetting(storyId);
          console.log("既存の作品設定データ取得結果:", basicSettingResponse);

          // 既存のデータがある場合は表示
          if (basicSettingResponse && basicSettingResponse.id) {
            setWorkSettingData({
              storyId: storyId,
              basicSettingDataId: basicSettingDataId || 0,
              title: basicSettingResponse.title || '',
              summary: basicSettingResponse.summary || '',
              theme: basicSettingResponse.theme || '',
              themeDescription: basicSettingResponse.theme_description || '',
              timePlace: basicSettingResponse.time_place || '',
              worldSetting: basicSettingResponse.world_setting || '',
              worldSettingBasic: basicSettingResponse.world_setting_basic || '',
              worldSettingFeatures: basicSettingResponse.world_setting_features || '',
              writingStyle: basicSettingResponse.writing_style || '',
              writingStyleStructure: basicSettingResponse.writing_style_structure || '',
              writingStyleExpression: basicSettingResponse.writing_style_expression || '',
              writingStyleTheme: basicSettingResponse.writing_style_theme || '',
              emotional: basicSettingResponse.emotional || '',
              emotionalLove: basicSettingResponse.emotional_love || '',
              emotionalFeelings: basicSettingResponse.emotional_feelings || '',
              emotionalAtmosphere: basicSettingResponse.emotional_atmosphere || '',
              emotionalSensuality: basicSettingResponse.emotional_sensuality || '',
              characters: basicSettingResponse.characters || '',
              keyItems: basicSettingResponse.key_items || '',
              mystery: basicSettingResponse.mystery || '',
              plotPattern: basicSettingResponse.plot_pattern || '',
              act1Overview: basicSettingResponse.act1_overview || '',
              act2Overview: basicSettingResponse.act2_overview || '',
              act3Overview: basicSettingResponse.act3_overview || '',
              rawContent: basicSettingResponse.raw_content || '',
              id: basicSettingResponse.id,
              createdAt: basicSettingResponse.created_at,
              updatedAt: basicSettingResponse.updated_at
            });
          }
        } catch (err) {
          // 既存の作品設定データが存在しない場合は無視
          console.log("既存の作品設定データは見つかりませんでした:", err);
        }
      } catch (err) {
        console.error("統合設定クリエイターデータ取得エラー:", err);
        setError("基本設定データの取得に失敗しました。");
        setBasicSettingData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBasicSettingData();
  }, [storyId, basicSettingDataId]);

  // 作品設定生成ボタンのクリックハンドラ
  const handleGenerateWorkSetting = async () => {
    if (!storyId || !basicSettingDataId) {
      toast({
        title: "エラー",
        description: "基本設定データIDが見つかりません。",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await basicSettingApi.generateBasicSetting(storyId, basicSettingDataId);
      console.log("作品設定生成結果:", response);

      // レスポンスから作品設定データを更新
      if (response) {
        setWorkSettingData({
          storyId: storyId,
          basicSettingDataId: basicSettingDataId,
          title: response.title || '',
          summary: response.summary || '',
          theme: response.theme || '',
          themeDescription: response.theme_description || '',
          timePlace: response.time_place || '',
          worldSetting: response.world_setting || '',
          worldSettingBasic: response.world_setting_basic || '',
          worldSettingFeatures: response.world_setting_features || '',
          writingStyle: response.writing_style || '',
          writingStyleStructure: response.writing_style_structure || '',
          writingStyleExpression: response.writing_style_expression || '',
          writingStyleTheme: response.writing_style_theme || '',
          emotional: response.emotional || '',
          emotionalLove: response.emotional_love || '',
          emotionalFeelings: response.emotional_feelings || '',
          emotionalAtmosphere: response.emotional_atmosphere || '',
          emotionalSensuality: response.emotional_sensuality || '',
          characters: response.characters || '',
          keyItems: response.key_items || '',
          mystery: response.mystery || '',
          plotPattern: response.plot_pattern || '',
          act1Overview: response.act1_overview || '',
          act2Overview: response.act2_overview || '',
          act3Overview: response.act3_overview || '',
          rawContent: response.raw_content || '',
          id: response.id,
          createdAt: response.created_at,
          updatedAt: response.updated_at
        });
      }

      toast({
        title: "成功",
        description: "作品設定が生成されました。",
      });
    } catch (err) {
      console.error("作品設定生成エラー:", err);
      toast({
        title: "エラー",
        description: "作品設定の生成に失敗しました。",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 作品設定保存ボタンのクリックハンドラ
  const handleSaveWorkSetting = async () => {
    if (!storyId) {
      toast({
        title: "エラー",
        description: "小説IDが見つかりません。",
        variant: "destructive"
      });
      return;
    }

    // 保存前に全てのフォームの値を取得して状態を更新
    const updatedWorkSettingData = {
      ...workSettingData,
      title: refs.title.current?.value || '',
      summary: refs.summary.current?.value || '',
      theme: refs.theme.current?.value || '',
      timePlace: refs.timePlace.current?.value || '',
      worldSetting: refs.worldSetting.current?.value || '',
      writingStyle: refs.writingStyle.current?.value || '',
      emotional: refs.emotional.current?.value || '',
      characters: refs.characters.current?.value || '',
      keyItems: refs.keyItems.current?.value || '',
      mystery: refs.mystery.current?.value || '',
      plotPattern: refs.plotPattern.current?.value || '',
      act1Overview: refs.act1Overview.current?.value || '',
      act2Overview: refs.act2Overview.current?.value || '',
      act3Overview: refs.act3Overview.current?.value || '',
      rawContent: refs.rawContent.current?.value || ''
    };

    // 状態を更新
    setWorkSettingData(updatedWorkSettingData);

    setIsSaving(true);
    try {
      // 保存処理を実装（既存のAPIを使用）
      const data = {
        story_id: storyId,
        basic_setting_data_id: updatedWorkSettingData.basicSettingDataId,
        title: updatedWorkSettingData.title,
        summary: updatedWorkSettingData.summary,
        theme: updatedWorkSettingData.theme,
        theme_description: updatedWorkSettingData.themeDescription,
        time_place: updatedWorkSettingData.timePlace,
        world_setting: updatedWorkSettingData.worldSetting,
        world_setting_basic: updatedWorkSettingData.worldSettingBasic,
        world_setting_features: updatedWorkSettingData.worldSettingFeatures,
        writing_style: updatedWorkSettingData.writingStyle,
        writing_style_structure: updatedWorkSettingData.writingStyleStructure,
        writing_style_expression: updatedWorkSettingData.writingStyleExpression,
        writing_style_theme: updatedWorkSettingData.writingStyleTheme,
        emotional: updatedWorkSettingData.emotional,
        emotional_love: updatedWorkSettingData.emotionalLove,
        emotional_feelings: updatedWorkSettingData.emotionalFeelings,
        emotional_atmosphere: updatedWorkSettingData.emotionalAtmosphere,
        emotional_sensuality: updatedWorkSettingData.emotionalSensuality,
        characters: updatedWorkSettingData.characters,
        key_items: updatedWorkSettingData.keyItems,
        mystery: updatedWorkSettingData.mystery,
        plot_pattern: updatedWorkSettingData.plotPattern,
        act1_overview: updatedWorkSettingData.act1Overview,
        act2_overview: updatedWorkSettingData.act2Overview,
        act3_overview: updatedWorkSettingData.act3Overview,
        raw_content: updatedWorkSettingData.rawContent
      };

      // 既存のデータがある場合は更新、なければ新規作成
      let response;
      if (updatedWorkSettingData.id) {
        // IDを含めてデータを更新
        const updateData = {
          ...data,
          id: updatedWorkSettingData.id
        };
        response = await basicSettingApi.updateBasicSetting(storyId, updateData);
      } else {
        response = await basicSettingApi.generateBasicSetting(storyId, updatedWorkSettingData.basicSettingDataId);
      }

      console.log("作品設定保存結果:", response);

      toast({
        title: "成功",
        description: "作品設定が保存されました。",
      });
    } catch (err) {
      console.error("作品設定保存エラー:", err);
      toast({
        title: "エラー",
        description: "作品設定の保存に失敗しました。",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!storyId) {
    return <div>小説IDが指定されていません</div>;
  }

  // 基本設定データのコンテンツ
  const BasicSettingContent = () => (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>
          <Blocks className="h-6 w-6" />
          基本設定
        </CardTitle>
        <CardDescription>「基本設定」を元に作品のオリジナルな設定を自動生成します。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">読み込み中...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-4 mb-4">
            {error}
          </div>
        ) : basicSettingData ? (
          <div className="bg-white border border-gray-200 rounded-md p-0 mb-4 overflow-y-auto max-h-[500px] w-full h-full">
            <div className="w-full h-full p-5">
              <textarea
                id="basic-setting-data"
                className="w-full border-none bg-transparent resize-none outline-none story-textarea th-1200"
                value={basicSettingData}
                readOnly
                placeholder="基本設定データがここに表示されます"
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">基本設定がまだ作成されていません</h3>
            <p className="text-muted-foreground mb-6">
              基本設定ページで基本設定を作成してください
            </p>
            <Button onClick={() => router.push(`/stories/basic-setting-data?id=${storyId}`)}>
              基本設定ページへ移動
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // 作品設定のコンテンツ
  const WorkSettingContent = () => {
    // ステートの定義
    const [showActs, setShowActs] = useState(false);

    // スタイル定義
    const leftAlignedHeaderStyle = {
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      marginBottom: '10px'
    };

    const expandIconStyle = {
      marginRight: '8px',
      fontSize: '14px'
    };

    const categoryTitleStyle = {
      margin: 0,
      fontSize: '16px',
      fontWeight: 'medium'
    };

    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>
            <Blocks className="h-6 w-6" />
            作品設定
          </CardTitle>
          <CardDescription>小説の世界観や設定情報</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 mt-4">
            <div className="bg-white border border-gray-200 rounded-md p-0 mb-4 overflow-y-auto w-full">
              <h3 className="text-md font-medium p-4">仮タイトル</h3>
              <textarea
                id="title"
                className="w-full border-none bg-transparent resize-none outline-none p-4 story-textarea th-30"
                placeholder="仮タイトルを入力してください"
                defaultValue={workSettingData.title || ''}
                ref={refs.title}
                rows={2}
                aria-label="仮タイトル"
              />
            </div>

            <div className="bg-white border border-gray-200 rounded-md p-0 mb-4 overflow-y-auto w-full">
              <h3 className="text-md font-medium p-4">サマリー</h3>
              <textarea
                id="summary"
                className="w-full border-none bg-transparent resize-none outline-none p-4 story-textarea th-100"
                placeholder="サマリーを入力してください"
                defaultValue={workSettingData.summary || ''}
                ref={refs.summary}
                rows={4}
                aria-label="サマリー"
              />
            </div>

            <div className="bg-white border border-gray-200 rounded-md p-0 mb-4 overflow-y-auto w-full">
              <h3 className="text-md font-medium p-4">テーマ（主題）</h3>
              <textarea
                id="theme"
                className="w-full border-none bg-transparent resize-none outline-none p-4 story-textarea th-200"
                placeholder="テーマを入力してください"
                defaultValue={workSettingData.theme || ''}
                ref={refs.theme}
                rows={3}
                aria-label="テーマ（主題）"
              />
            </div>

            <div className="bg-white border border-gray-200 rounded-md p-0 mb-4 overflow-y-auto w-full">
              <h3 className="text-md font-medium p-4">時代と場所</h3>
              <textarea
                id="time-place"
                className="w-full border-none bg-transparent resize-none outline-none p-4 story-textarea th-30"
                placeholder="時代と場所を入力してください"
                defaultValue={workSettingData.timePlace || ''}
                ref={refs.timePlace}
                rows={3}
                aria-label="時代と場所"
              />
            </div>

            <div className="space-y-4 mt-4">
              <div className="bg-white border border-gray-200 rounded-md p-0 mb-4 overflow-y-auto w-full">
                <h3 className="text-md font-medium p-4">作品世界と舞台設定</h3>
                <textarea
                  id="world-setting"
                  className="w-full border-none bg-transparent resize-none outline-none p-4 story-textarea th-400"
                  placeholder="作品世界と舞台設定を入力してください"
                  defaultValue={workSettingData.worldSetting || ''}
                  ref={refs.worldSetting}
                  rows={6}
                  aria-label="作品世界と舞台設定"
                />
              </div>
            </div>

            <div className="space-y-4 mt-4">
              <div className="bg-white border border-gray-200 rounded-md p-0 mb-4 overflow-y-auto w-full">
                <h3 className="text-md font-medium p-4">参考とする作風</h3>
                <textarea
                  id="writing-style"
                  className="w-full border-none bg-transparent resize-none outline-none p-4 story-textarea th-300"
                  placeholder="参考とする作風を入力してください"
                  defaultValue={workSettingData.writingStyle || ''}
                  ref={refs.writingStyle}
                  rows={4}
                  aria-label="参考とする作風"
                />
              </div>
            </div>

            <div className="space-y-4 mt-4">
              <div className="bg-white border border-gray-200 rounded-md p-0 mb-4 overflow-y-auto w-full">
                <h3 className="text-md font-medium p-4">情緒的・感覚的要素</h3>
                <textarea
                  id="emotional"
                  className="w-full border-none bg-transparent resize-none outline-none p-4 story-textarea th-300"
                  placeholder="情緒的・感覚的要素を入力してください"
                  defaultValue={workSettingData.emotional || ''}
                  ref={refs.emotional}
                  rows={4}
                  aria-label="情緒的・感覚的要素"
                />
              </div>
            </div>

            <div className="space-y-4 mt-4">
              <div className="bg-white border border-gray-200 rounded-md p-0 mb-4 overflow-y-auto w-full">
                <h3 className="text-md font-medium p-4">主な登場人物</h3>
                <textarea
                  id="characters"
                  className="w-full border-none bg-transparent resize-none outline-none p-4 story-textarea th-400"
                  placeholder="主な登場人物を入力してください"
                  defaultValue={workSettingData.characters || ''}
                  ref={refs.characters}
                  rows={6}
                  aria-label="主な登場人物"
                />
              </div>

              <div className="bg-white border border-gray-200 rounded-md p-0 mb-4 overflow-y-auto w-full">
                <h3 className="text-md font-medium p-4">主な固有名詞</h3>
                <textarea
                  id="key-items"
                  className="w-full border-none bg-transparent resize-none outline-none p-4 story-textarea th-400"
                  placeholder="主な固有名詞を入力してください"
                  defaultValue={workSettingData.keyItems || ''}
                  ref={refs.keyItems}
                  rows={4}
                  aria-label="主な固有名詞"
                />
              </div>

              <div className="bg-white border border-gray-200 rounded-md p-0 mb-4 overflow-y-auto w-full">
                <h3 className="text-md font-medium p-4">物語の背景となる過去の謎</h3>
                <textarea
                  id="mystery"
                  className="w-full border-none bg-transparent resize-none outline-none p-4 story-textarea th-200"
                  placeholder="物語の背景となる過去の謎を入力してください"
                  defaultValue={workSettingData.mystery || ''}
                  ref={refs.mystery}
                  rows={4}
                  aria-label="物語の背景となる過去の謎"
                />
              </div>

              <div className="bg-white border border-gray-200 rounded-md p-0 mb-4 overflow-y-auto w-full">
                <h3 className="text-md font-medium p-4">プロットパターン</h3>
                <textarea
                  id="plot-pattern"
                  className="w-full border-none bg-transparent resize-none outline-none p-4 story-textarea th-30"
                  placeholder="プロットパターンを入力してください"
                  defaultValue={workSettingData.plotPattern || ''}
                  ref={refs.plotPattern}
                  rows={4}
                  aria-label="プロットパターン"
                />
              </div>
            </div>

            <div className="space-y-4 mt-4">
              <div className="bg-white border border-gray-200 rounded-md p-0 mb-4 overflow-y-auto w-full">
                <h3 className="text-md font-medium p-4">第1幕概要</h3>
                <textarea
                  id="act1-overview"
                  className="w-full border-none bg-transparent resize-none outline-none p-4 story-textarea th-200"
                  placeholder="第1幕の概要を入力してください"
                  defaultValue={workSettingData.act1Overview || ''}
                  ref={refs.act1Overview}
                  rows={6}
                  aria-label="第1幕概要"
                />
              </div>

              <div className="bg-white border border-gray-200 rounded-md p-0 mb-4 overflow-y-auto w-full">
                <h3 className="text-md font-medium p-4">第2幕概要</h3>
                <textarea
                  id="act2-overview"
                  className="w-full border-none bg-transparent resize-none outline-none p-4 story-textarea th-200"
                  placeholder="第2幕の概要を入力してください"
                  defaultValue={workSettingData.act2Overview || ''}
                  ref={refs.act2Overview}
                  rows={6}
                  aria-label="第2幕概要"
                />
              </div>

              <div className="bg-white border border-gray-200 rounded-md p-0 mb-4 overflow-y-auto w-full">
                <h3 className="text-md font-medium p-4">第3幕概要</h3>
                <textarea
                  id="act3-overview"
                  className="w-full border-none bg-transparent resize-none outline-none p-4 story-textarea th-200"
                  placeholder="第3幕の概要を入力してください"
                  defaultValue={workSettingData.act3Overview || ''}
                  ref={refs.act3Overview}
                  rows={6}
                  aria-label="第3幕概要"
                />
              </div>
            </div>

          </div>

          {/* 生データ */}
          <div className="bg-white border border-gray-200 rounded-md p-4 w-full">
            <div
              style={leftAlignedHeaderStyle}
              onClick={() => setShowActs(!showActs)}
            >
              <span style={expandIconStyle}>
                {showActs ? '▼' : '▶'}
              </span>
              <h3 style={categoryTitleStyle}>生データ</h3>
            </div>

            {showActs && (
              <div className="bg-white border border-gray-200 rounded-md p-0 mb-4 overflow-y-auto w-full">
                <textarea
                  id="raw-content"
                  className="w-full border-none bg-transparent resize-none outline-none p-4 story-textarea th-1200"
                  defaultValue={workSettingData.rawContent || ''}
                  ref={refs.rawContent}
                  rows={6}
                  aria-label="作品設定の生データ"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card >
    );
  };

  return (
    <StoryProvider storyId={storyId}>
      <StoryTabs storyId={storyId} activeTab="basic-setting" />

      {isMobile ? (
        // モバイル表示：タブで切り替え
        <Tabs defaultValue="basic-setting" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic-setting">基本設定</TabsTrigger>
            <TabsTrigger value="work-setting">作品設定</TabsTrigger>
          </TabsList>

          <div className="flex space-x-4 mt-4 mb-4">
            <Button
              variant="outline"
              onClick={handleGenerateWorkSetting}
              disabled={isGenerating || !basicSettingDataId}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                '作品設定：生成'
              )}
            </Button>
            <Button
              onClick={handleSaveWorkSetting}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                '作品設定：保存'
              )}
            </Button>
          </div>

          <TabsContent value="basic-setting">
            <BasicSettingContent />
          </TabsContent>
          <TabsContent value="work-setting">
            <WorkSettingContent />
          </TabsContent>
        </Tabs>
      ) : (
        // PC表示：左右に並べる
        <div className="panel-container">
          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={handleGenerateWorkSetting}
              disabled={isGenerating || !basicSettingDataId}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                '作品設定：生成'
              )}
            </Button>
            <Button
              onClick={handleSaveWorkSetting}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                '作品設定：保存'
              )}
            </Button>
          </div>

          <div className="panel-row">
            {/* 基本設定データ（左側） */}
            <div className="panel-half">
              <BasicSettingContent />
            </div>

            {/* 作品設定（右側） */}
            <div className="panel-half">
              <WorkSettingContent />
            </div>
          </div>
        </div>
      )}
    </StoryProvider>
  );
}
