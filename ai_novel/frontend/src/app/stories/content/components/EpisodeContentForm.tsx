'use client';

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { EpisodeDetail } from '@/lib/unified-api-client';
import { episodeApi, contentApi } from '@/lib/unified-api-client';
import { toast } from "@/components/ui/use-toast";
import { useStoryContext } from '@/components/story/StoryProvider';

interface EpisodeContentFormProps {
  storyId: string;
  selectedEpisode: EpisodeDetail | null;
  editedContent: string;
  setEditedContent: (content: string) => void;
}

export default function EpisodeContentForm({
  storyId,
  selectedEpisode,
  editedContent,
  setEditedContent
}: EpisodeContentFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [wordCount, setWordCount] = useState<number>(1000);

  // コンテキストからbasicSettingを取得
  const { basicSetting } = useStoryContext();

  // エピソード本文更新ハンドラ
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(e.target.value);
  };

  // エピソード保存ハンドラ
  const handleSaveEpisode = async () => {
    if (!selectedEpisode) return;

    try {
      setIsSaving(true);

      // エピソード更新APIを呼び出し
      await episodeApi.updateEpisode(
        storyId,
        selectedEpisode.act_number,
        selectedEpisode.episode_number,
        {
          title: selectedEpisode.title,
          content: editedContent
        }
      );

      toast({
        title: "保存完了",
        description: "エピソードが保存されました。",
      });
    } catch (err) {
      console.error("エピソード保存エラー:", err);
      toast({
        title: "エラー",
        description: "エピソードの保存に失敗しました。",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 本文生成ハンドラ
  const handleGenerateContent = async () => {
    if (!selectedEpisode || !basicSetting || !basicSetting.id) {
      console.error("選択されたエピソードまたは基本設定がありません");
      console.log("basicSetting:", basicSetting);
      toast({
        title: "エラー",
        description: "エピソードまたは基本設定が見つかりません。",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      
      // エピソード本文生成APIを呼び出し
      const generationResponse = await contentApi.generateEpisodeContent(
        basicSetting.id.toString(),
        storyId,
        selectedEpisode.act_number,
        selectedEpisode.episode_number,
        { word_count: wordCount }
      );
      
      if (generationResponse && generationResponse.content) {
        setGeneratedContent(generationResponse.content);
      } else {
        toast({
          title: "エラー",
          description: "コンテンツ生成に失敗しました。",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error("コンテンツ生成エラー:", err);
      toast({
        title: "エラー",
        description: "エピソードの本文生成に失敗しました。",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 生成されたコンテンツを適用するハンドラ
  const handleApplyGenerated = () => {
    if (generatedContent) {
      setEditedContent(generatedContent);
      setGeneratedContent("");
      toast({
        title: "適用完了",
        description: "生成されたコンテンツが適用されました。",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {selectedEpisode
            ? `${selectedEpisode.episode_number}話: ${selectedEpisode.title}`
            : 'エピソードが選択されていません'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {selectedEpisode ? (
          <div className="space-y-4">
            {/* エピソード本文編集エリア */}
            <div>
              <h3 className="font-medium mb-2">エピソード本文</h3>
              <textarea
                className="w-full h-96 p-3 border rounded-md"
                value={editedContent}
                onChange={handleContentChange}
                placeholder="エピソードの本文を入力..."
                aria-label="エピソード本文"
              />
            </div>

            {/* 本文生成UI */}
            <div className="border p-4 rounded-md">
              <h3 className="font-medium mb-2">本文を生成</h3>
              <div className="flex items-center mb-4">
                <span className="mr-2">目標文字数:</span>
                <input
                  type="number"
                  min="500"
                  max="5000"
                  step="100"
                  value={wordCount}
                  onChange={(e) => setWordCount(Number(e.target.value))}
                  className="w-24 p-2 border rounded-md"
                  aria-label="目標文字数"
                />
                <span className="ml-2">文字</span>
              </div>
              <Button
                onClick={handleGenerateContent}
                disabled={isGenerating}
                className="mb-4"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    生成中...
                  </>
                ) : (
                  "本文を生成"
                )}
              </Button>

              {generatedContent && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">生成されたコンテンツ</h4>
                  <textarea
                    className="w-full h-48 p-3 border rounded-md mb-2"
                    value={generatedContent}
                    readOnly
                    aria-label="生成されたコンテンツ"
                  />
                  <Button onClick={handleApplyGenerated}>
                    このコンテンツを適用
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">エピソードを選択してください</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={handleSaveEpisode}
          disabled={!selectedEpisode || isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              保存中...
            </>
          ) : (
            "保存"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
