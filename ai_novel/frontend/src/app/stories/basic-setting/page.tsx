'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Book } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { StoryProvider } from '@/components/story/StoryProvider';
import { StoryTabs } from '@/components/story/StoryTabs';
import { integratedSettingCreatorApi, basicSettingApi } from '@/lib/api-client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";

// 作品設定データの型定義
interface WorkSettingData {
  id?: number;                // 作品設定ID
  storyId: string | null;     // 小説ID
  basicSettingDataId: number; // 基本設定データID
  storySettings: string;      // 作品世界と舞台設定
  characters: string;         // 主な登場人物
  plotOverview: string;       // あらすじ
  act1Overview: string;       // 第1幕
  act2Overview: string;       // 第2幕
  act3Overview: string;       // 第3幕
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
    storySettings: '',
    characters: '',
    plotOverview: '',
    act1Overview: '',
    act2Overview: '',
    act3Overview: '',
    rawContent: ''
  });

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
        const response = await integratedSettingCreatorApi.getIntegratedSettingData(storyId);
        console.log("統合設定クリエイターデータの取得結果:", response);

        if (response && response.results) {
          // basic_setting_dataを設定
          setBasicSettingData(response.results.basic_setting_data || null);

          // basic_setting_data_idを保存
          if (response.results.id) {
            const id = response.results.id;
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
              storySettings: basicSettingResponse.story_setting || '',
              characters: basicSettingResponse.characters || '',
              plotOverview: basicSettingResponse.plot_overview || '',
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
  }, [storyId]);

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
          storySettings: response.story_setting || '',
          characters: response.characters || '',
          plotOverview: response.plot_overview || '',
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

    setIsSaving(true);
    try {
      // 保存処理を実装（既存のAPIを使用）
      const data = {
        story_id: storyId,
        basic_setting_data_id: workSettingData.basicSettingDataId,
        story_setting: workSettingData.storySettings,
        characters: workSettingData.characters,
        plot_overview: workSettingData.plotOverview,
        act1_overview: workSettingData.act1Overview,
        act2_overview: workSettingData.act2Overview,
        act3_overview: workSettingData.act3Overview,
        raw_content: workSettingData.rawContent
      };

      // 既存のデータがある場合は更新、なければ新規作成
      let response;
      if (workSettingData.id) {
        // IDを含めてデータを更新
        const updateData = {
          ...data,
          id: workSettingData.id
        };
        response = await basicSettingApi.updateBasicSetting(storyId, updateData);
      } else {
        response = await basicSettingApi.generateBasicSetting(storyId, workSettingData.basicSettingDataId);
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

  // 作品設定テキストエリアの変更ハンドラ
  const handleWorkSettingChange = (field: keyof WorkSettingData) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setWorkSettingData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  if (!storyId) {
    return <div>小説IDが指定されていません</div>;
  }

  // 基本設定データのコンテンツ
  const BasicSettingContent = () => (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>基本設定</CardTitle>
        <CardDescription>小説の基本的な設定情報</CardDescription>
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
                className="w-full border-none bg-transparent resize-none outline-none"
                value={basicSettingData}
                readOnly
                placeholder="基本設定データがここに表示されます"
                style={{ width: '100%', height: '3000px', minHeight: '400px', boxSizing: 'border-box', padding: '20px', margin: '0' }}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">基本設定がまだ作成されていません</h3>
            <p className="text-muted-foreground mb-6">
              基本設定データタブで基本設定を作成してください
            </p>
            <Button onClick={() => router.push(`/stories/basic-setting-data?id=${storyId}`)}>
              基本設定データページへ移動
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // 作品設定のコンテンツ
  const WorkSettingContent = () => {
    const [showMainSettings, setShowMainSettings] = useState(true);
    const [showRawContent, setShowRawContent] = useState(false);

    // WorldSettingSelectorと同様のスタイル
    const leftAlignedHeaderStyle = {
      display: 'flex',
      flexDirection: 'row' as const,
      justifyContent: 'flex-start',
      alignItems: 'center',
      padding: '0.75rem 1rem',
      backgroundColor: '#f0f7ff',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
      marginBottom: '1rem'
    };

    const expandIconStyle = {
      fontSize: '1rem',
      color: '#3498db',
      marginRight: '0.5rem'
    };

    const categoryTitleStyle = {
      fontSize: '1.2rem',
      fontWeight: 'bold',
      margin: 0,
      color: '#2c3e50'
    };

    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>作品設定</CardTitle>
          <CardDescription>小説の世界観や設定情報</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* グループ1: 主要設定フォーム */}
          <div className="bg-white border border-gray-200 rounded-md p-4 w-full">
            <div
              style={leftAlignedHeaderStyle}
              onClick={() => setShowMainSettings(!showMainSettings)}
            >
              <span style={expandIconStyle}>
                {showMainSettings ? '▼' : '▶'}
              </span>
              <h3 style={categoryTitleStyle}>作品設定詳細</h3>
            </div>

            {showMainSettings && (
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-md p-0 mb-4 overflow-y-auto w-full">
                  <h3 className="text-md font-medium p-4">作品世界と舞台設定</h3>
                  <textarea
                    id="story-settings"
                    className="w-full border-none bg-transparent resize-none outline-none p-4"
                    style={{ width: '100%', height: '200px', minHeight: '200px', boxSizing: 'border-box', padding: '20px', margin: '0' }}
                    placeholder="作品世界と舞台設定を入力してください"
                    value={workSettingData.storySettings}
                    onChange={handleWorkSettingChange('storySettings')}
                    rows={6}
                  />
                </div>

                <div className="bg-white border border-gray-200 rounded-md p-0 mb-4 overflow-y-auto w-full">
                  <h3 className="text-md font-medium p-4">主な登場人物</h3>
                  <textarea
                    id="characters"
                    className="w-full border-none bg-transparent resize-none outline-none p-4"
                    style={{ width: '100%', height: '200px', minHeight: '200px', boxSizing: 'border-box', padding: '20px', margin: '0' }}
                    placeholder="主な登場人物を入力してください"
                    value={workSettingData.characters}
                    onChange={handleWorkSettingChange('characters')}
                    rows={6}
                  />
                </div>

                <div className="bg-white border border-gray-200 rounded-md p-0 mb-4 overflow-y-auto w-full">
                  <h3 className="text-md font-medium p-4">あらすじ</h3>
                  <textarea
                    id="plot-overview"
                    className="w-full border-none bg-transparent resize-none outline-none p-4"
                    style={{ width: '100%', height: '200px', minHeight: '200px', boxSizing: 'border-box', padding: '20px', margin: '0' }}
                    placeholder="あらすじを入力してください"
                    value={workSettingData.plotOverview}
                    onChange={handleWorkSettingChange('plotOverview')}
                    rows={6}
                  />
                </div>

                <div className="bg-white border border-gray-200 rounded-md p-0 mb-4 overflow-y-auto w-full">
                  <h3 className="text-md font-medium p-4">第1幕</h3>
                  <textarea
                    id="act1-overview"
                    className="w-full border-none bg-transparent resize-none outline-none p-4"
                    style={{ width: '100%', height: '200px', minHeight: '200px', boxSizing: 'border-box', padding: '20px', margin: '0' }}
                    placeholder="第1幕の内容を入力してください"
                    value={workSettingData.act1Overview}
                    onChange={handleWorkSettingChange('act1Overview')}
                    rows={6}
                  />
                </div>

                <div className="bg-white border border-gray-200 rounded-md p-0 mb-4 overflow-y-auto w-full">
                  <h3 className="text-md font-medium p-4">第2幕</h3>
                  <textarea
                    id="act2-overview"
                    className="w-full border-none bg-transparent resize-none outline-none p-4"
                    style={{ width: '100%', height: '200px', minHeight: '200px', boxSizing: 'border-box', padding: '20px', margin: '0' }}
                    placeholder="第2幕の内容を入力してください"
                    value={workSettingData.act2Overview}
                    onChange={handleWorkSettingChange('act2Overview')}
                    rows={6}
                  />
                </div>

                <div className="bg-white border border-gray-200 rounded-md p-0 mb-4 overflow-y-auto w-full">
                  <h3 className="text-md font-medium p-4">第3幕</h3>
                  <textarea
                    id="act3-overview"
                    className="w-full border-none bg-transparent resize-none outline-none p-4"
                    style={{ width: '100%', height: '200px', minHeight: '200px', boxSizing: 'border-box', padding: '20px', margin: '0' }}
                    placeholder="第3幕の内容を入力してください"
                    value={workSettingData.act3Overview}
                    onChange={handleWorkSettingChange('act3Overview')}
                    rows={6}
                  />
                </div>
              </div>
            )}
          </div>

          {/* グループ2: 生データ */}
          <div className="bg-white border border-gray-200 rounded-md p-4 w-full">
            <div
              style={leftAlignedHeaderStyle}
              onClick={() => setShowRawContent(!showRawContent)}
            >
              <span style={expandIconStyle}>
                {showRawContent ? '▼' : '▶'}
              </span>
              <h3 style={categoryTitleStyle}>作品設定ロウデータ</h3>
            </div>

            {showRawContent && (
              <div className="mt-4">
                <div className="bg-white border border-gray-200 rounded-md p-0 overflow-y-auto w-full">
                  <textarea
                    id="raw-content"
                    className="w-full border-none bg-transparent resize-none outline-none p-4"
                    style={{ width: '100%', height: '400px', minHeight: '400px', boxSizing: 'border-box', padding: '20px', margin: '0' }}
                    placeholder="生成された元の内容全体"
                    value={workSettingData.rawContent}
                    onChange={handleWorkSettingChange('rawContent')}
                    rows={12}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px' }}>
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

          <div style={{ display: 'flex', flexDirection: 'row', gap: '24px' }}>
            {/* 基本設定データ（左側） */}
            <div style={{ width: '50%', position: 'relative' }}>
              <BasicSettingContent />
            </div>

            {/* 作品設定（右側） */}
            <div style={{ width: '50%', position: 'relative' }}>
              <WorkSettingContent />
            </div>
          </div>
        </div>
      )}
    </StoryProvider>
  );
}
