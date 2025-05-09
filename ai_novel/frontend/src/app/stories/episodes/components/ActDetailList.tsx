// /stories/episodes?id={storyId}
// ストーリー内の1幕、2幕、3幕を読み込んで、raw_contentをtextareaに表示する

import { useState, useEffect } from 'react';
import { unifiedFetchApi, ActDetail, ApiError } from '@/lib/unified-api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Blocks, Ungroup, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useStoryContext } from '@/components/story/StoryProvider';

interface ActDetailListProps {
  storyId: number;
}

export const ActDetailList = ({ storyId }: ActDetailListProps) => {
  const [acts, setActs] = useState<ActDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const { setSelectedAct } = useStoryContext();

  useEffect(() => {
    const fetchActDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        // 幕一覧を取得するためのエンドポイント
        const response = await unifiedFetchApi<{
          count: number;
          next: string | null;
          previous: string | null;
          results: ActDetail[];
        }>(`/stories/${storyId}/acts/`);

        // DRFのページネーションレスポンスからresultsを取得
        if (response && response.results) {
          setActs(response.results);
        } else {
          setActs([]);
        }
      } catch (error) {
        console.error('幕詳細の取得中にエラーが発生しました:', error);
        setError(error as ApiError);
      } finally {
        setLoading(false);
      }
    };

    if (storyId) {
      fetchActDetails();
    }
  }, [storyId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md text-red-800">
        <h3 className="font-bold mb-2">エラーが発生しました</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  if (acts.length === 0) {
    return (
      <div className="p-4 border border-gray-200 bg-gray-50 rounded-md">
        <p className="text-center text-gray-500">この物語にはまだ幕が作成されていません。</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          <Blocks className="h-6 w-6" />
          各幕の設定
        </h2>
      </div>
      {acts.map((act) => (
        <Card key={act.id} className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold">
              {act.act_number}幕: {act.title}
              {/* 幕を選択するボタンを付ける。押すとそのActでsetSelectedActtする。 */}
              <Button
                onClick={() => setSelectedAct(act)}
                className="ml-2 float-right x-r-20"
              >
                <Ungroup className="h-6 w-6" />
                分割
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="w-full px-4 pb-4">
            <div className="w-full">
              <Textarea
                value={act.raw_content || ''}
                readOnly
                className="w-full resize-none story-textarea th-200"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
