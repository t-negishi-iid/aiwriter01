// ActDetailList.tsx で選択中の ActDetail.raw_contentを表示するtextareaを実装する
import { useStoryContext } from '@/components/story/StoryProvider';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { episodeApi, EpisodeDetail } from '@/lib/unified-api-client';
import { Loader2 } from 'lucide-react';

export default function EpisodesForm() {
  const { selectedAct, story } = useStoryContext();
  const [episodeCount, setEpisodeCount] = useState(10);
  const [episodes, setEpisodes] = useState<EpisodeDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEpisodeCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      // 1から30の範囲に制限
      setEpisodeCount(Math.min(Math.max(value, 1), 30));
    }
  };

  // 選択された幕が変更されたときにエピソード一覧を取得
  useEffect(() => {
    if (selectedAct && story?.id) {
      console.log(`幕が選択されました: ${selectedAct.act_number}幕 - ${selectedAct.title}`);
      console.log(`エピソード取得開始: ストーリーID=${story.id}, 幕番号=${selectedAct.act_number}`);
      
      setIsLoading(true);
      setError('');
      
      episodeApi.getActEpisodes(story.id, selectedAct.act_number)
        .then(response => {
          console.log(`エピソード取得成功: ${response.results.length}件のエピソードを取得しました`);
          setEpisodes(response.results);
        })
        .catch(err => {
          console.error('エピソード取得エラー:', err);
          setError(`エピソードの取得に失敗しました: ${err.message || '未知のエラー'}`);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // 選択された幕がない場合は空のエピソード一覧をセット
      console.log('幕が選択されていないか、ストーリー情報がありません');
      setEpisodes([]);
    }
  }, [selectedAct, story?.id]);

  return (
    <Card className={selectedAct ? 'border-primary' : 'border-gray-200'}>
      <CardHeader className="bg-gray-50">
        <CardTitle className="flex items-center">
          {selectedAct ? (
            <>
              <span className="text-primary font-bold">{selectedAct.act_number}幕:</span> 
              <span className="ml-2">{selectedAct.title}</span>
            </>
          ) : (
            '左のリストから幕を選択してください'
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="w-full px-4 pb-4">
        <div className="w-full">
          <div className="w-full flex items-center mt-2 mb-4">
            <button
              onClick={() => { }}
              className="px-3 py-1.5 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
              disabled={!selectedAct}
            >
              幕をエピソードに分割する
            </button>
            <label className="ml-4">エピソード数（1-30）</label>
            <input
              type="number"
              className="ml-2 w-16 p-1 border rounded"
              placeholder="数"
              value={episodeCount}
              onChange={handleEpisodeCountChange}
              min={1}
              max={30}
              disabled={!selectedAct}
            />
          </div>
          {selectedAct ? (
            <Textarea
              value={selectedAct.raw_content || ''}
              readOnly
              className="w-full story-textarea th-200"
            />
          ) : (
            <div className="flex justify-center items-center h-32 bg-gray-50 border rounded-md">
              <p className="text-gray-500">左のリストから幕を選択すると、内容が表示されます</p>
            </div>
          )}
        </div>

        {/* エピソード一覧表示 */}
        <div className="mt-6">
          <h3 className="text-lg font-medium border-b pb-2 mb-4">エピソード一覧</h3>
          
          {!selectedAct && (
            <div className="p-6 text-center border rounded-md bg-gray-50">
              <p className="text-gray-500">左のリストから幕を選択すると、エピソード一覧が表示されます</p>
            </div>
          )}
          
          {selectedAct && isLoading && (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
              <span className="text-gray-600">エピソードを読み込み中...</span>
            </div>
          )}
          
          {selectedAct && error && (
            <div className="p-4 border border-red-300 bg-red-50 rounded-md text-red-800">
              <h4 className="font-bold mb-1">エラーが発生しました</h4>
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          {selectedAct && !isLoading && !error && episodes.length === 0 && (
            <div className="p-6 text-center border border-dashed rounded-md">
              <p className="text-gray-600">この幕にはまだエピソードがありません</p>
              <p className="text-gray-500 text-sm mt-1">「幕をエピソードに分割する」ボタンをクリックして、エピソードを作成してください</p>
            </div>
          )}
          
          {selectedAct && !isLoading && !error && episodes.length > 0 && (
            <ul className="space-y-4">
              {episodes.map((episode) => (
                <li key={episode.id} className="border p-4 rounded-md hover:bg-gray-50 transition-colors">
                  <div className="font-medium text-primary">
                    エピソード {episode.episode_number}: {episode.title}
                  </div>
                  <div className="text-sm text-gray-700 mt-2">
                    {episode.content ? (
                      episode.content.length > 100 ? 
                        `${episode.content.substring(0, 100)}...` : 
                        episode.content
                    ) : (
                      <span className="text-gray-400">内容がありません</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
