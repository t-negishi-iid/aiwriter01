'use client';

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
  selectedActNumber: string;
}

export default function EpisodeContentForm({
  storyId,
  selectedEpisode,
  editedContent,
  setEditedContent,
  selectedActNumber
}: EpisodeContentFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [wordCount, setWordCount] = useState<number>(1000);
  const [episodeContent, setEpisodeContent] = useState<string>("");
  const [isLoadingContent, setIsLoadingContent] = useState<boolean>(false);
  const [isSavingContent, setIsSavingContent] = useState<boolean>(false);

  // コンテキストからbasicSettingを取得
  const { basicSetting } = useStoryContext();

  // エピソード本文を取得する関数
  const fetchEpisodeContent = useCallback(async () => {
    if (!selectedEpisode) return;

    try {
      setIsLoadingContent(true);
      const response = await contentApi.getEpisodeContent(
        storyId,
        selectedActNumber,
        selectedEpisode.episode_number
      );

      if (response && response.content) {
        setEpisodeContent(response.content as string);
      } else {
        setEpisodeContent("");
        toast({
          title: "注意",
          description: "エピソード本文が見つかりませんでした。",
        });
      }
    } catch (err) {
      console.error("エピソード本文取得エラー:", err);
      toast({
        title: "エラー",
        description: "エピソード本文の取得に失敗しました。",
        variant: "destructive"
      });
      setEpisodeContent("");
    } finally {
      setIsLoadingContent(false);
    }
  }, [selectedEpisode, storyId, selectedActNumber]);

  // selectedEpisodeが変更されたときにエピソード本文を読み込む
  useEffect(() => {
    if (selectedEpisode) {
      fetchEpisodeContent();
    }
  }, [selectedEpisode, fetchEpisodeContent]);

  // エピソード概要更新ハンドラ
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
        selectedActNumber,
        selectedEpisode.episode_number,
        {
          title: selectedEpisode.title,
          content: editedContent
        }
      );

      // エピソード本文も更新
      await contentApi.updateEpisodeContent(
        storyId,
        selectedActNumber,
        selectedEpisode.episode_number,
        {
          content: episodeContent,
          raw_content: ""
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
      const generationResponse = await contentApi.createEpisodeContent(
        storyId,
        selectedActNumber,
        selectedEpisode.episode_number,
        {
          basic_setting_id: Number(basicSetting.id),
          word_count: wordCount
        }
      );

      if (generationResponse && generationResponse.content) {
        setGeneratedContent(generationResponse.content as string);
        setEpisodeContent(generationResponse.content as string);
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
  const handleApplyGenerated = async () => {
    try {
      setIsSavingContent(true);
      // エピソード本文を保存するAPIを呼び出し
      if (selectedEpisode) {
        await contentApi.updateEpisodeContent(
          storyId,
          selectedActNumber,
          selectedEpisode.episode_number,
          {
            content: episodeContent,
            raw_content: episodeContent,
          }
        );
        toast({
          title: "保存完了",
          description: "エピソード本文が保存されました。",
        });
      }
    } catch (error) {
      console.error("エピソード本文の保存に失敗:", error);
      toast({
        title: "エラー",
        description: "エピソード本文の保存に失敗しました。",
        variant: "destructive"
      });
    } finally {
      setIsSavingContent(false);
    }
  };

  // 生成されたコンテンツをエディタに適用するハンドラ
  const handleApplyGeneratedToEditor = () => {
    if (generatedContent) {
      setEpisodeContent(generatedContent);
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
              <h3 className="font-medium mb-2">エピソード概要</h3>
              <textarea
                className="w-full h-32 p-3 border rounded-md story-textarea th-200"
                value={editedContent}
                onChange={handleContentChange}
                placeholder="エピソードの概要を入力..."
                aria-label="エピソード概要"
              />
              <div className="mt-4 flex items-center gap-2">
                <Button
                  onClick={handleSaveEpisode}
                  disabled={!selectedEpisode || isSaving}
                  className="mr-4"
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
                <span className="mr-2">目標文字数：</span>
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
                <span className="ml-2">文字&nbsp;</span>
                <Button
                  onClick={handleGenerateContent}
                  disabled={isGenerating}
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
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">エピソード本文</h3>
              {isLoadingContent ? (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>読み込み中...</span>
                </div>
              ) : (
                <textarea
                  className="w-full h-96 p-3 border rounded-md story-textarea th-200"
                  value={episodeContent}
                  onChange={(e) => setEpisodeContent(e.target.value)}
                  placeholder="エピソード本文を入力..."
                  aria-label="エピソード本文"
                />
              )}
              {/* ここにエピソード本文の保存ボタンを配置 */}
              <Button
                onClick={handleApplyGenerated}
                disabled={isSavingContent}
                className="mt-4"
              >
                {isSavingContent ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    保存中...
                  </>
                ) : (
                  "エピソード本文を保存"
                )}
              </Button>
            </div>

            {/* 生成された本文UI */}
            {generatedContent && (
              <div className="border p-4 rounded-md">
                <h3 className="font-medium mb-2">生成された本文</h3>
                <textarea
                  className="w-full h-48 p-3 border rounded-md mb-2 story-textarea th-200"
                  value={generatedContent}
                  readOnly
                  aria-label="生成された本文"
                />
                <Button onClick={handleApplyGeneratedToEditor}>
                  本文として適用
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center py-10">エピソードを選択してください</p>
        )}
      </CardContent>
    </Card>
  );
}
