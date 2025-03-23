// ActDetailList.tsx で選択中の ActDetail.raw_contentを表示するtextareaを実装する
import { useStoryContext } from '@/components/story/StoryProvider';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function EpisodesForm() {
  const { selectedAct } = useStoryContext();
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {selectedAct ? `${selectedAct.act_number}幕: ${selectedAct.title}` : 'エピソード詳細'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <h4 className="text-sm font-semibold text-gray-500 mb-1">幕の詳細内容</h4>
          <Textarea
            value={selectedAct.raw_content || ''}
            readOnly
            className="w-full h-96 resize-none bg-gray-50"
          />
        </div>
      </CardContent>
    </Card>
  );
}
