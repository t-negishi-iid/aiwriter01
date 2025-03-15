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
import { basicSettingApi, plotApi } from '@/lib/api-client';
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// あらすじデータの型定義
interface ActData {
  id?: number;
  story_id?: string;
  act_number: number;
  title: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export default function PlotPage() {
  const searchParams = useSearchParams();
  const storyId = searchParams.get('id');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [basicSettingData, setBasicSettingData] = useState<any>(null);
  const [acts, setActs] = useState<ActData[]>([]);
  const [selectedAct, setSelectedAct] = useState<ActData | null>(null);

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
    const fetchData = async () => {
      if (!storyId) return;

      setIsLoading(true);
      setError(null);

      try {
        // 基本設定データを取得
        const basicSettingResponse = await basicSettingApi.getBasicSetting(storyId);
        setBasicSettingData(basicSettingResponse);

        // あらすじデータを取得
        const plotResponse = await plotApi.getPlot(storyId);
        if (plotResponse && Array.isArray(plotResponse)) {
          setActs(plotResponse);
          if (plotResponse.length > 0) {
            setSelectedAct(plotResponse[0]);
          }
        }
      } catch (err) {
        console.error("データ取得エラー:", err);
        setError("データの取得に失敗しました。");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [storyId]);

  // あらすじ保存ハンドラ
  const handleSaveAct = async () => {
    if (!storyId || !selectedAct) {
      toast({
        title: "エラー",
        description: "あらすじデータがありません。",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        ...selectedAct,
        story_id: storyId
      };

      let response;
      if (selectedAct.id) {
        response = await plotApi.updateAct(storyId, selectedAct.id, data);
      }

      // あらすじリストを更新
      const updatedActs = await plotApi.getPlot(storyId);
      if (updatedActs && Array.isArray(updatedActs)) {
        setActs(updatedActs);
        
        // 更新したあらすじを選択
        const updatedAct = updatedActs.find(a => a.id === response.id);
        if (updatedAct) {
          setSelectedAct(updatedAct);
        }
      }

      toast({
        title: "成功",
        description: "あらすじが保存されました。",
      });
    } catch (err) {
      console.error("あらすじ保存エラー:", err);
      toast({
        title: "エラー",
        description: "あらすじの保存に失敗しました。",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // あらすじ生成ハンドラ
  const handleGeneratePlot = async () => {
    if (!storyId) {
      toast({
        title: "エラー",
        description: "小説IDが指定されていません。",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      await plotApi.createPlot(storyId);
      
      toast({
        title: "成功",
        description: "あらすじ生成タスクが開始されました。生成完了までしばらくお待ちください。",
      });
      
      // 5秒後にあらすじデータを再取得
      setTimeout(async () => {
        try {
          const plotResponse = await plotApi.getPlot(storyId);
          if (plotResponse && Array.isArray(plotResponse)) {
            setActs(plotResponse);
            if (plotResponse.length > 0) {
              setSelectedAct(plotResponse[0]);
            }
          }
        } catch (e) {
          console.error("あらすじデータ再取得エラー:", e);
        }
      }, 5000);
      
    } catch (err) {
      console.error("あらすじ生成エラー:", err);
      toast({
        title: "エラー",
        description: "あらすじの生成に失敗しました。",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // あらすじ選択ハンドラ
  const handleSelectAct = (act: ActData) => {
    setSelectedAct(act);
  };

  // あらすじフィールド変更ハンドラ
  const handleActChange = (field: keyof ActData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (selectedAct) {
      setSelectedAct({
        ...selectedAct,
        [field]: e.target.value
      });
    }
  };

  if (!storyId) {
    return <div>小説IDが指定されていません</div>;
  }

  return (
    <StoryProvider storyId={storyId}>
      <StoryTabs storyId={storyId} activeTab="plot" />
      
      {isMobile ? (
        // モバイル表示：タブで切り替え
        <Tabs defaultValue="basic-plot" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic-plot">基本設定のあらすじ</TabsTrigger>
            <TabsTrigger value="plot-detail">あらすじ詳細</TabsTrigger>
          </TabsList>

          <div className="flex space-x-4 mt-4 mb-4">
            <Button 
              onClick={handleGeneratePlot} 
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : 'あらすじ生成'}
            </Button>
            <Button 
              onClick={handleSaveAct} 
              disabled={isSaving || !selectedAct}
              className="ml-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : 'あらすじ保存'}
            </Button>
          </div>

          <TabsContent value="basic-plot">
            <Card className="w-full h-full">
              <CardHeader>
                <CardTitle>基本設定のあらすじ</CardTitle>
                <CardDescription>小説の基本設定に含まれるあらすじ情報</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">読み込み中...</span>
                  </div>
                ) : basicSettingData && basicSettingData.plot ? (
                  <div className="bg-white border border-gray-200 rounded-md p-0 mb-4 overflow-y-auto max-h-[500px] w-full h-full">
                    <div className="w-full h-full p-5">
                      <textarea
                        className="w-full border-none bg-transparent resize-none outline-none"
                        value={basicSettingData.plot}
                        readOnly
                        placeholder="基本設定のあらすじ情報"
                        style={{ width: '100%', minHeight: '400px', boxSizing: 'border-box', padding: '20px', margin: '0' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">基本設定のあらすじ情報がありません</h3>
                    <p className="text-muted-foreground mb-6">
                      基本設定タブであらすじ情報を作成してください
                    </p>
                    <Button onClick={() => router.push(`/stories/basic-setting?id=${storyId}`)}>
                      基本設定ページへ移動
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {basicSettingData && basicSettingData.structure && (
              <Card className="w-full h-full mt-6">
                <CardHeader>
                  <CardTitle>全体構成</CardTitle>
                  <CardDescription>小説の全体構成</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-md p-0 mb-4 overflow-y-auto max-h-[500px] w-full h-full">
                    <div className="w-full h-full p-5">
                      <textarea
                        className="w-full border-none bg-transparent resize-none outline-none"
                        value={basicSettingData.structure}
                        readOnly
                        placeholder="全体構成情報"
                        style={{ width: '100%', minHeight: '400px', boxSizing: 'border-box', padding: '20px', margin: '0' }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="plot-detail">
            <Card className="w-full h-full">
              <CardHeader>
                <CardTitle>あらすじ詳細</CardTitle>
                <CardDescription>各幕のあらすじ詳細</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">読み込み中...</span>
                  </div>
                ) : acts.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {acts.map((act) => (
                        <Button 
                          key={act.id} 
                          variant={selectedAct?.id === act.id ? "default" : "outline"}
                          className="w-full"
                          onClick={() => handleSelectAct(act)}
                        >
                          {act.act_number}幕
                        </Button>
                      ))}
                    </div>
                    
                    {selectedAct && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-1">タイトル</label>
                          <input
                            type="text"
                            className="w-full p-2 border rounded-md"
                            value={selectedAct.title}
                            onChange={handleActChange('title')}
                            placeholder="幕のタイトル"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">詳細</label>
                          <textarea
                            className="w-full min-h-[400px] p-2 border rounded-md"
                            value={selectedAct.description}
                            onChange={handleActChange('description')}
                            placeholder="幕の詳細な内容"
                          />
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">あらすじがまだ作成されていません</h3>
                    <p className="text-muted-foreground mb-6">
                      「あらすじ生成」ボタンをクリックして、あらすじを自動生成してください
                    </p>
                    <Button onClick={handleGeneratePlot}>
                      あらすじ生成
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        // PC表示：左右に並べる
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px' }}>
          <div className="flex space-x-4">
            <Button 
              onClick={handleGeneratePlot} 
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : 'あらすじ生成'}
            </Button>
            <Button 
              onClick={handleSaveAct} 
              disabled={isSaving || !selectedAct}
              className="ml-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : 'あらすじ保存'}
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', gap: '24px' }}>
            {/* 左側：基本設定のあらすじと全体構成 */}
            <div style={{ width: '50%', position: 'relative' }}>
              <Card className="w-full h-full mb-6">
                <CardHeader>
                  <CardTitle>基本設定のあらすじ</CardTitle>
                  <CardDescription>小説の基本設定に含まれるあらすじ情報</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLoading ? (
                    <div className="flex justify-center items-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2">読み込み中...</span>
                    </div>
                  ) : basicSettingData && basicSettingData.plot ? (
                    <div className="bg-white border border-gray-200 rounded-md p-0 mb-4 overflow-y-auto max-h-[300px] w-full">
                      <div className="w-full h-full p-5">
                        <textarea
                          className="w-full border-none bg-transparent resize-none outline-none"
                          value={basicSettingData.plot}
                          readOnly
                          placeholder="基本設定のあらすじ情報"
                          style={{ width: '100%', minHeight: '200px', boxSizing: 'border-box', padding: '20px', margin: '0' }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">基本設定のあらすじ情報がありません</h3>
                      <p className="text-muted-foreground mb-6">
                        基本設定タブであらすじ情報を作成してください
                      </p>
                      <Button onClick={() => router.push(`/stories/basic-setting?id=${storyId}`)}>
                        基本設定ページへ移動
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {basicSettingData && basicSettingData.structure && (
                <Card className="w-full h-full">
                  <CardHeader>
                    <CardTitle>全体構成</CardTitle>
                    <CardDescription>小説の全体構成</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-md p-0 mb-4 overflow-y-auto max-h-[300px] w-full">
                      <div className="w-full h-full p-5">
                        <textarea
                          className="w-full border-none bg-transparent resize-none outline-none"
                          value={basicSettingData.structure}
                          readOnly
                          placeholder="全体構成情報"
                          style={{ width: '100%', minHeight: '200px', boxSizing: 'border-box', padding: '20px', margin: '0' }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* 右側：あらすじ詳細 */}
            <div style={{ width: '50%', position: 'relative' }}>
              <Card className="w-full h-full">
                <CardHeader>
                  <CardTitle>あらすじ詳細</CardTitle>
                  <CardDescription>各幕のあらすじ詳細</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoading ? (
                    <div className="flex justify-center items-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2">読み込み中...</span>
                    </div>
                  ) : acts.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {acts.map((act) => (
                          <Button 
                            key={act.id} 
                            variant={selectedAct?.id === act.id ? "default" : "outline"}
                            className="w-full"
                            onClick={() => handleSelectAct(act)}
                          >
                            {act.act_number}幕
                          </Button>
                        ))}
                      </div>
                      
                      {selectedAct && (
                        <>
                          <div>
                            <label className="block text-sm font-medium mb-1">タイトル</label>
                            <input
                              type="text"
                              className="w-full p-2 border rounded-md"
                              value={selectedAct.title}
                              onChange={handleActChange('title')}
                              placeholder="幕のタイトル"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">詳細</label>
                            <textarea
                              className="w-full min-h-[400px] p-2 border rounded-md"
                              value={selectedAct.description}
                              onChange={handleActChange('description')}
                              placeholder="幕の詳細な内容"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">あらすじがまだ作成されていません</h3>
                      <p className="text-muted-foreground mb-6">
                        「あらすじ生成」ボタンをクリックして、あらすじを自動生成してください
                      </p>
                      <Button onClick={handleGeneratePlot}>
                        あらすじ生成
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </StoryProvider>
  );
}
