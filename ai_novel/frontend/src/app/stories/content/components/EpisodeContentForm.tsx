'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Blocks, Loader2 } from 'lucide-react';
import { EpisodeDetail } from '@/lib/unified-api-client';
import { episodeApi, contentApi } from '@/lib/unified-api-client';
import { toast } from "@/components/ui/use-toast";
import { useStoryContext } from '@/components/story/StoryProvider';

interface EpisodeContentFormProps {
  storyId: string;
  selectedEpisode: EpisodeDetail | null;
  editedContent: string;
  setEditedContent: (content: string) => void;
  editedTitle: string;
  setEditedTitle: (title: string) => void;
  selectedActNumber: string;
}

interface FullScreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

interface FullScreenDocument extends Document {
  webkitFullscreenElement?: Element;
  msFullscreenElement?: Element;
  webkitExitFullscreen?: () => void;
  msExitFullscreen?: () => void;
}

export default function EpisodeContentForm({
  storyId,
  selectedEpisode,
  editedContent,
  setEditedContent,
  editedTitle,
  setEditedTitle,
  selectedActNumber
}: EpisodeContentFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [wordCount, setWordCount] = useState<number>(1000);
  const [episodeContent, setEpisodeContent] = useState<string>("");
  const [episodeContentTitle, setEpisodeContentTitle] = useState<string>("");
  const [isLoadingContent, setIsLoadingContent] = useState<boolean>(false);
  const [isSavingContent, setIsSavingContent] = useState<boolean>(false);
  const [titleError, setTitleError] = useState<string>('');

  // コンテキストからbasicSettingを取得
  const { basicSetting } = useStoryContext();

  // 画面表示モード（通常 or 全画面）
  const [isFullscreenEdit, setIsFullscreenEdit] = useState(false);
  const [isFullscreenContent, setIsFullscreenContent] = useState(false);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const fullscreenContentRef = useRef<HTMLDivElement>(null);

  // デバッグ用：stateの変更を確認
  useEffect(() => {
    console.log('isFullscreenEdit:', isFullscreenEdit);
  }, [isFullscreenEdit]);

  // 全画面モードの切り替え処理（汎用化）
  const toggleFullscreen = useCallback((type: 'edit' | 'content') => {
    const isCurrentlyFullscreen = type === 'edit' ? isFullscreenEdit : isFullscreenContent;
    const targetRef = type === 'edit' ? fullscreenRef : fullscreenContentRef;
    const setFullscreen = type === 'edit' ? setIsFullscreenEdit : setIsFullscreenContent;

    if (!isCurrentlyFullscreen) {
      // 全画面モードに入る
      if (targetRef.current) {
        const element = targetRef.current as FullScreenElement;
        if (element.requestFullscreen) {
          element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) { // Safari
          element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) { // IE11
          element.msRequestFullscreen();
        }
      }
      setFullscreen(true);

      // エピソード概要の場合は、選択されたエピソードの内容をセット
      if (type === 'edit' && selectedEpisode) {
        setEditedContent(selectedEpisode.content);
        setEditedTitle(selectedEpisode.title);
      }
    } else {
      // 全画面モードを解除
      const doc = document as FullScreenDocument;
      if (doc.exitFullscreen) {
        doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) { // Safari
        doc.webkitExitFullscreen();
      } else if (doc.msExitFullscreen) { // IE11
        doc.msExitFullscreen();
      }
      setFullscreen(false);
    }
  }, [isFullscreenEdit, isFullscreenContent, selectedEpisode, setEditedContent, setEditedTitle]);

  // フルスクリーン変更イベントのリスナーを追加
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as FullScreenDocument;
      const isFullscreenNow = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.msFullscreenElement
      );

      if (!isFullscreenNow) {
        if (isFullscreenEdit) setIsFullscreenEdit(false);
        if (isFullscreenContent) setIsFullscreenContent(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreenEdit, isFullscreenContent]);

  // Escキーが押されたときの処理
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isFullscreenEdit) toggleFullscreen('edit');
        if (isFullscreenContent) toggleFullscreen('content');
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isFullscreenEdit, isFullscreenContent, toggleFullscreen]);

  // エピソード本文を取得する関数
  const fetchEpisodeContent = useCallback(async () => {
    if (!selectedEpisode) return;

    setIsLoadingContent(true);
    try {
      // 正しいパラメータ（storyId, actNumber, episodeNumber）を使用
      const response = await contentApi.getEpisodeContent(
        storyId,
        selectedActNumber,
        selectedEpisode.episode_number
      );

      console.log("エピソード本文取得レスポンス:", response);

      if (response && typeof response.content === 'string') {
        setEpisodeContent(response.content);
        setEpisodeContentTitle(typeof response.title === 'string' ? response.title : "");
      } else {
        console.log("本文データが見つかりません", response);
        setEpisodeContent("");
        setEpisodeContentTitle("");
      }
    } catch (error: unknown) {
      console.error("エピソード本文の取得中にエラーが発生しました:", error);
      // エラーのタイプに応じて異なるメッセージを表示
      let errorMessage = "エピソード本文の取得中にエラーが発生しました。";
      if (error instanceof Error) {
        // エラーが404の場合は特別なメッセージを表示
        if (error.message.includes("404")) {
          errorMessage = "このエピソードの本文はまだ作成されていません。「エピソード概要から本文を生成」ボタンを使って本文を作成してください。";
        } else {
          errorMessage += ` ${error.message}`;
        }
      }
      toast({
        title: "情報",
        description: errorMessage,
        variant: error instanceof Error && error.message?.includes("404") ? "default" : "destructive",
      });
      setEpisodeContent("");
      setEpisodeContentTitle("");
    } finally {
      setIsLoadingContent(false);
    }
  }, [storyId, selectedEpisode, selectedActNumber]);
  // selectedEpisodeが変更されたときにエピソード本文を読み込む
  useEffect(() => {
    if (selectedEpisode) {
      fetchEpisodeContent();
    }
  }, [selectedEpisode, fetchEpisodeContent]);

  // エピソードタイトル更新ハンドラ
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEditedTitle(value);
    
    // バリデーション：空白チェック
    if (!value.trim()) {
      setTitleError('タイトルは必須です');
    } else {
      setTitleError('');
    }
  };

  // エピソード概要更新ハンドラ
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(e.target.value);
  };

  // エピソード本文タイトル変更ハンドラ
  const handleContentTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEpisodeContentTitle(e.target.value);
  };

  // エピソード概要保存ハンドラ
  const handleSaveEpisodeDetail = async () => {
    if (!selectedEpisode) return;

    try {
      setIsSaving(true);

      // タイプエラーを回避するために正しい型のデータを作成
      const episodeData = {
        title: editedTitle,
        content: editedContent,
        episode_number: selectedEpisode.episode_number,
        raw_content: JSON.stringify({
          title: editedTitle,
          content: editedContent
        })
      };

      // エピソード詳細APIを呼び出し - 正しいエンドポイントを使用
      const response = await episodeApi.updateEpisodeDetail(
        storyId,
        selectedEpisode.id,
        selectedEpisode.episode_number,
        episodeData
      );

      // レスポンスの確認
      if (response) {
        toast({
          title: "保存完了",
          description: "エピソード概要が保存されました。",
        });
      } else {
        // APIは成功したが結果が不明な場合
        toast({
          title: "注意",
          description: "エピソード概要の保存状態が確認できませんでした。",
        });
      }
    } catch (err) {
      console.error("エピソード概要保存エラー:", err);
      // エラーメッセージをより詳細に表示
      let errorMessage = "エピソード概要の保存に失敗しました。";
      if (err instanceof Error) {
        errorMessage += ` ${err.message}`;
      }
      toast({
        title: "エラー",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 本文生成ハンドラ
  const handleGenerateContent = async () => {
    if (!selectedEpisode || !basicSetting || !basicSetting.id) {
      console.error("選択されたエピソードまたは作品設定がありません");
      console.log("basicSetting:", basicSetting);
      toast({
        title: "エラー",
        description: "エピソード概要または作品設定が見つかりません。",
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

      if (generationResponse && typeof generationResponse.content === 'string') {
        // 生成された本文を直接エピソード本文に設定
        setEpisodeContent(generationResponse.content);
        if (typeof generationResponse.title === 'string') {
          setEpisodeContentTitle(generationResponse.title);
        }
        toast({
          title: "生成完了",
          description: "エピソード本文が生成されました。内容を確認し、必要に応じて編集してください。",
        });
      } else {
        toast({
          title: "エラー",
          description: "コンテンツ生成に失敗しました。",
          variant: "destructive"
        });
      }
    } catch (error: unknown) {
      console.error("コンテンツ生成エラー:", error);
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
    // タイトルが空の場合はエラーを表示して処理を中断
    if (!episodeContentTitle.trim()) {
      toast({
        title: "エラー",
        description: "エピソード本文タイトルを入力してください。",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSavingContent(true);
      // エピソード本文を保存するAPIを呼び出し
      if (selectedEpisode) {
        const response = await contentApi.updateEpisodeContent(
          storyId,
          selectedActNumber,
          selectedEpisode.episode_number,
          {
            title: episodeContentTitle,
            content: episodeContent,
            raw_content: JSON.stringify({
              title: episodeContentTitle,
              content: episodeContent
            })
          }
        );

        console.log("エピソード本文保存レスポンス:", response);

        // レスポンスの確認
        if (response) {
          toast({
            title: "保存完了",
            description: "エピソード本文が保存されました。",
          });
        } else {
          // APIは成功したが結果が不明な場合
          toast({
            title: "注意",
            description: "エピソード本文の保存状態が確認できませんでした。",
          });
        }
      }
    } catch (error: unknown) {
      console.error("エピソード本文の保存中にエラーが発生しました:", error);
      toast({
        title: "エラー",
        description: "エピソード本文の保存中にエラーが発生しました。",
        variant: "destructive"
      });
    } finally {
      setIsSavingContent(false);
    }
  };

  return (
    <Card className="w-full">
      <div className="mt-4 mb-4 flex items-center gap-2 p-4" style={{ margin: "10px", padding: "10px", border: "1px solid #ccc" }}>
        <Button
          onClick={handleGenerateContent}
          disabled={isGenerating}
          style={{ margin: "0 10px" }}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              生成中...
            </>
          ) : (
            "エピソード概要から本文を生成"
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

      </div>

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
            <div
              className={`card-container story-detail-container ${isFullscreenEdit
                ? "absolute top-0 left-0 right-0 bottom-0 w-screen h-screen z-[9999] overflow-auto bg-white p-4"
                : ""
                }`}
              ref={fullscreenRef}
            >
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">
                  <Blocks className="h-4 w-4 mr-2" />
                  エピソード概要
                </CardTitle>
                <div className="flex items-center gap-2">
                  {!isFullscreenEdit && (
                    <Button
                      onClick={handleSaveEpisodeDetail}
                      disabled={!selectedEpisode || isSaving || !editedTitle.trim()}
                      className="mr-2"
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
                  )}
                  <Button
                    onClick={() => toggleFullscreen('edit')}
                    variant="outline"
                  >
                    {isFullscreenEdit ? "全画面モード解除" : "全画面モード"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <input
                  type="text"
                  className={`w-full p-3 border rounded-md story-input ${titleError ? 'border-red-500' : ''}`}
                  value={editedTitle}
                  onChange={handleTitleChange}
                  placeholder="エピソードのタイトルを入力..."
                  aria-label="エピソードタイトル"
                  required
                />
                {titleError && <p className="text-red-500 text-sm mt-1">{titleError}</p>}
                <textarea
                  className={`w-full p-3 border rounded-md story-textarea ${isFullscreenEdit ? "th-1200" : "h-32 th-200"
                    }`}
                  value={editedContent}
                  onChange={handleContentChange}
                  placeholder="エピソードの概要を入力..."
                  aria-label="エピソード概要"
                />
              </CardContent>
            </div>

            <div
              className={`card-container story-detail-container ${isFullscreenContent
                ? "absolute top-0 left-0 right-0 bottom-0 w-screen h-screen z-[9999] overflow-auto bg-white p-4"
                : ""
                }`}
              ref={fullscreenContentRef}
            >
              <Card className="w-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">
                    <Blocks className="h-4 w-4 mr-2" />
                    エピソード本文
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {isFullscreenContent && (
                      <Button
                        onClick={handleApplyGenerated}
                        disabled={isSavingContent}
                        className="mr-2"
                      >
                        {isSavingContent ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            保存中...
                          </>
                        ) : (
                          "保存"
                        )}
                      </Button>
                    )}
                    <Button
                      onClick={() => toggleFullscreen('content')}
                      variant="outline"
                    >
                      {isFullscreenContent ? "全画面モード解除" : "全画面モード"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingContent ? (
                    <div className="flex justify-center items-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>読み込み中...</span>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4">
                        <label htmlFor="episode-content-title" className="block text-sm font-medium mb-1">
                          エピソード本文タイトル
                        </label>
                        <input
                          id="episode-content-title"
                          type="text"
                          className={`w-full p-3 border rounded-md story-input ${titleError ? 'border-red-500' : ''}`}
                          value={episodeContentTitle}
                          onChange={handleContentTitleChange}
                          placeholder="エピソード本文のタイトルを入力..."
                          aria-label="エピソード本文のタイトル"
                          required
                        />
                        {titleError && <p className="text-red-500 text-sm mt-1">{titleError}</p>}
                      </div>
                      <textarea
                        className={`w-full p-3 border rounded-md story-textarea ${isFullscreenContent ? "th-1200" : "h-96 th-200"}`}
                        value={episodeContent}
                        onChange={(e) => setEpisodeContent(e.target.value)}
                        placeholder="エピソード本文を入力..."
                        aria-label="エピソード本文"
                      />
                    </>
                  )}
                  {!isFullscreenContent && (
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
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <p className="text-center py-10">エピソードを選択してください</p>
        )}
      </CardContent>
    </Card>
  );
}
