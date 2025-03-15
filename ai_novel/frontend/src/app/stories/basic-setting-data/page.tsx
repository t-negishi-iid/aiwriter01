'use client';
// /stories/basic-setting-data?id={story_id}
// 小説詳細ページ　基本設定タブ

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Book } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { StoryProvider } from '@/components/story/StoryProvider';
import { StoryTabs } from '@/components/story/StoryTabs';
import { integratedSettingCreatorApi } from '@/lib/api-client';

export default function BasicSettingDataPage() {
  const searchParams = useSearchParams();
  const storyId = searchParams.get('id');
  const router = useRouter();
  const [basicSettingData, setBasicSettingData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBasicSettingData = async () => {
      if (!storyId) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await integratedSettingCreatorApi.getIntegratedSettingData(storyId);
        console.log("統合設定クリエイターデータの取得結果:", response);

        if (response && response.results && response.results.basic_setting_data) {
          // resultsとstatusのみ返ってくる
          setBasicSettingData(response.results.basic_setting_data);
        } else {
          setBasicSettingData("基本設定データはまだ作成されていません。");
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

  if (!storyId) {
    return <div>小説IDが指定されていません</div>;
  }

  return (
    <StoryProvider storyId={storyId}>
      <StoryTabs storyId={storyId} activeTab="basic-setting-data" />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>基本設定</CardTitle>
          <CardDescription>小説の基本的な設定情報</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {basicSettingData ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">基本設定データ</h3>
                <div className="flex justify-center mt-4 mb-4">
                  <Button onClick={() => router.push(`/tools/integrated-setting-creator?storyId=${storyId}`)}>
                    統合クリエイターで編集する
                  </Button>
                </div>

                {isLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">読み込み中...</span>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-4 mb-4">
                    {error}
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-md p-0 mb-4 overflow-y-auto max-h-[500px] w-full h-full">
                    <div className="w-full h-full p-5">
                      <textarea
                        id="basic-setting-data"
                        className="w-full border-none bg-transparent resize-none outline-none"
                        value={basicSettingData || "基本設定データはありません"}
                        readOnly
                        placeholder="基本設定データがここに表示されます"
                        style={{ width: '100%', height: '400px', minHeight: '400px', boxSizing: 'border-box', padding: '20px', margin: '0' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">基本設定がまだ作成されていません</h3>
              <p className="text-muted-foreground mb-6">
                基本設定を作成して、小説の世界観や登場人物を定義しましょう
              </p>
              <Button onClick={() => router.push(`/tools/integrated-setting-creator?storyId=${storyId}`)}>
                統合クリエイターで作成する
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </StoryProvider>
  );
}
