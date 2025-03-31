"use client"

import { useState, useEffect, useCallback } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Save, Sparkles, XCircle, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { unifiedStoryApi } from "@/lib/unified-api-client"

// ストーリー作成用のスキーマ
const formSchema = z.object({
  title: z.string().min(1, {
    message: "タイトルは必須項目です",
  }),
  catchphrase: z.string().optional(),
  summary: z.string().optional(),
})

interface StoryFormProps {
  onSubmit: (data: z.infer<typeof formSchema>) => void
  defaultValues?: Partial<z.infer<typeof formSchema>> & { id?: number | string }
  isSubmitting?: boolean
  submitButtonText?: string
  cancelButton?: React.ReactNode
}

export function StoryForm({
  onSubmit,
  defaultValues,
  isSubmitting = false,
  submitButtonText = "ストーリーを作成",
  cancelButton
}: StoryFormProps) {
  const [submitting, setSubmitting] = useState(isSubmitting)

  // タイトル関連の状態
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([])
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false)
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false)
  const [originalTitle, setOriginalTitle] = useState("")

  // キャッチコピー関連の状態
  const [catchphraseSuggestions, setCatchphraseSuggestions] = useState<string[]>([])
  const [isGeneratingCatchphrases, setIsGeneratingCatchphrases] = useState(false)
  const [showCatchphraseSuggestions, setShowCatchphraseSuggestions] = useState(false)
  const [originalCatchphrase, setOriginalCatchphrase] = useState("")

  // 概要関連の状態
  const [summarySuggestion, setSummarySuggestion] = useState<string>("")
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [showSummarySuggestion, setShowSummarySuggestion] = useState(false)
  const [originalSummary, setOriginalSummary] = useState("")

  // フォーム初期化
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: defaultValues?.title || "",
      catchphrase: defaultValues?.catchphrase || "",
      summary: defaultValues?.summary || "",
    },
  })

  // フォーム送信ハンドラ
  async function handleFormSubmit(values: z.infer<typeof formSchema>) {
    setSubmitting(true)
    try {
      await onSubmit(values)
    } catch (error) {
      console.error("フォーム送信エラー:", error)
      setSubmitting(false)
    }
  }

  // タイトル候補Box表示ハンドラ
  const handleShowTitleSuggestionsBox = () => {
    if (!showTitleSuggestions) {
      // 初回表示時に元のタイトルを保存
      setOriginalTitle(form.getValues('title'));
    }
    setShowTitleSuggestions(true);
  };

  // タイトル候補生成ハンドラ
  const handleGenerateTitleSuggestions = async () => {
    setIsGeneratingTitles(true)
    try {
      // APIからタイトル候補を取得
      const storyId = defaultValues?.id;

      // 数値IDがない場合は処理をスキップ
      if (!storyId || isNaN(Number(storyId))) {
        console.error("タイトル候補生成には有効なstory_idが必要です");
        setIsGeneratingTitles(false);
        return;
      }

      // 基本設定データの準備
      const basicSettingData = JSON.stringify({
        title: form.getValues('title'),
        catchphrase: form.getValues('catchphrase'),
        summary: form.getValues('summary')
      });

      const response = await unifiedStoryApi.generateTitleOrCatchphrase(storyId, {
        basic_setting: basicSettingData,
        target_content: "タイトル",
        title_type: "タイトル"
      });

      // レスポンスデータを直接使用する
      if (response && response.titles) {
        // レスポンスが文字列の場合はJSONとしてパース
        let titleArray: string[] = [];
        
        if (typeof response.titles === 'string') {
          try {
            titleArray = JSON.parse(response.titles);
          } catch (e) {
            console.error("タイトル候補のパースに失敗:", e);
            titleArray = [response.titles]; // パース失敗時は文字列をそのまま1つの候補として使用
          }
        } else if (Array.isArray(response.titles)) {
          titleArray = response.titles;
        } else {
          titleArray = [String(response.titles)];
        }
        
        // 成功した場合は、タイトルリストを設定する
        setTitleSuggestions(titleArray);
      } else {
        console.error("タイトル候補取得エラー: レスポンスデータが不正です");
      }
    } catch (error) {
      console.error("タイトル候補生成エラー:", error);
    } finally {
      setIsGeneratingTitles(false);
    }
  };

  // タイトル候補選択ハンドラ
  const handleSelectTitle = (title: string) => {
    form.setValue('title', title);
    // Box表示は維持する
  };

  // タイトルリセットハンドラ
  const handleResetTitle = () => {
    form.setValue('title', originalTitle);
  };

  // タイトル候補Boxを閉じるハンドラ
  const handleCloseTitleSuggestions = () => {
    setShowTitleSuggestions(false);
  };

  // キャッチコピー候補Box表示ハンドラ
  const handleShowCatchphraseSuggestionsBox = () => {
    if (!showCatchphraseSuggestions) {
      // 初回表示時に元のキャッチコピーを保存
      setOriginalCatchphrase(form.getValues('catchphrase') || "");
    }
    setShowCatchphraseSuggestions(true);
  };

  // キャッチコピー候補生成ハンドラ
  const handleGenerateCatchphraseSuggestions = async () => {
    setIsGeneratingCatchphrases(true)
    try {
      // APIからキャッチコピー候補を取得
      const storyId = defaultValues?.id;

      // 数値IDがない場合は処理をスキップ
      if (!storyId || isNaN(Number(storyId))) {
        console.error("キャッチコピー候補生成には有効なstory_idが必要です");
        setIsGeneratingCatchphrases(false);
        return;
      }

      // 基本設定データの準備
      const basicSettingData = JSON.stringify({
        title: form.getValues('title'),
        catchphrase: form.getValues('catchphrase'),
        summary: form.getValues('summary')
      });

      const response = await unifiedStoryApi.generateTitleOrCatchphrase(storyId, {
        basic_setting: basicSettingData,
        target_content: "キャッチコピー",
        title_type: "キャッチコピー"
      });

      // レスポンスデータを直接使用する
      if (response && response.titles) {
        // レスポンスが文字列の場合はJSONとしてパース
        let catchphraseArray: string[] = [];
        
        if (typeof response.titles === 'string') {
          try {
            catchphraseArray = JSON.parse(response.titles);
          } catch (e) {
            console.error("キャッチコピー候補のパースに失敗:", e);
            catchphraseArray = [response.titles]; // パース失敗時は文字列をそのまま1つの候補として使用
          }
        } else if (Array.isArray(response.titles)) {
          catchphraseArray = response.titles;
        } else {
          catchphraseArray = [String(response.titles)];
        }
        
        // 成功した場合は、キャッチコピーリストを設定する
        setCatchphraseSuggestions(catchphraseArray);
      } else {
        console.error("キャッチコピー候補取得エラー: レスポンスデータが不正です");
      }
    } catch (error) {
      console.error("キャッチコピー候補生成エラー:", error);
    } finally {
      setIsGeneratingCatchphrases(false);
    }
  };

  // キャッチコピー候補選択ハンドラ
  const handleSelectCatchphrase = (catchphrase: string) => {
    form.setValue('catchphrase', catchphrase);
    // Box表示は維持する
  };

  // キャッチコピーリセットハンドラ
  const handleResetCatchphrase = () => {
    form.setValue('catchphrase', originalCatchphrase);
  };

  // キャッチコピー候補Boxを閉じるハンドラ
  const handleCloseCatchphraseSuggestions = () => {
    setShowCatchphraseSuggestions(false);
  };

  // 概要候補Box表示ハンドラ
  const handleShowSummarySuggestionsBox = () => {
    if (!showSummarySuggestion) {
      // 初回表示時に元の概要を保存
      setOriginalSummary(form.getValues('summary') || "");
    }
    setShowSummarySuggestion(true);
  };

  // 概要候補生成ハンドラ
  const handleGenerateSummarySuggestions = async () => {
    setIsGeneratingSummary(true);
    try {
      // APIから概要候補を取得
      const storyId = defaultValues?.id;

      // 数値IDがない場合は処理をスキップ
      if (!storyId || isNaN(Number(storyId))) {
        console.error("概要候補生成には有効なstory_idが必要です");
        setIsGeneratingSummary(false);
        return;
      }

      // 概要生成APIを呼び出し
      const response = await unifiedStoryApi.generateSummary(storyId, {
        target_content: form.getValues('title') + "\n" + form.getValues('catchphrase'),
        word_count: 100 // 概要の長さを100語に設定
      });

      // レスポンスデータを処理
      if (response && response.summary) {
        // 概要は1つだけなので文字列をそのまま使用
        setSummarySuggestion(response.summary);
      } else {
        console.error("概要候補取得エラー: レスポンスデータが不正です");
      }
    } catch (error) {
      console.error("概要候補生成エラー:", error);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // 概要候補選択ハンドラ
  const handleSelectSummary = (summary: string) => {
    form.setValue('summary', summary);
    // Box表示は維持する
  };

  // 概要リセットハンドラ
  const handleResetSummary = () => {
    form.setValue('summary', originalSummary);
  };

  // 概要候補Boxを閉じるハンドラ
  const handleCloseSummarySuggestions = () => {
    setShowSummarySuggestion(false);
  };

  // 有効なstory_idがあるかをチェックする関数
  const hasValidStoryId = useCallback(() => {
    const storyId = defaultValues?.id;
    return storyId !== undefined && !isNaN(Number(storyId));
  }, [defaultValues]);

  useEffect(() => {
    console.log("StoryForm defaultValues:", defaultValues);
    console.log("hasValidStoryId result:", hasValidStoryId());
  }, [defaultValues, hasValidStoryId]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8" data-testid="story-form">
        {/* タイトル */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>タイトル</FormLabel>
              <div className="space-y-4">
                <FormControl>
                  <Input
                    placeholder="ストーリーのタイトルを入力"
                    disabled={submitting}
                    data-testid="title-input"
                    {...field}
                    className="story-input"
                  />
                </FormControl>
                {hasValidStoryId() && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleShowTitleSuggestionsBox}
                    disabled={submitting}
                    className="w-full"
                    data-testid="show-title-suggestions-button"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    タイトル候補生成
                  </Button>
                )}

                {showTitleSuggestions && (
                  <Card className="mt-4">
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">タイトル候補</h3>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={handleCloseTitleSuggestions}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            閉じる
                          </Button>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={handleGenerateTitleSuggestions}
                            disabled={isGeneratingTitles}
                            className="flex-1"
                          >
                            <Sparkles className="mr-2 h-4 w-4" />
                            {isGeneratingTitles ? "生成中..." : "候補を生成"}
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleResetTitle}
                            className="flex-shrink-0"
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            リセット
                          </Button>
                        </div>

                        <div className="grid gap-2 mt-2">
                          {titleSuggestions.length > 0 ? (
                            titleSuggestions.map((title, index) => (
                              <div key={index} className="flex items-center justify-between border p-2 rounded">
                                <div className="flex items-center space-x-2">
                                  <Label className="cursor-pointer">{title}</Label>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleSelectTitle(title)}
                                >
                                  選択
                                </Button>
                              </div>
                            ))
                          ) : (
                            <div className="text-center text-muted-foreground py-2">
                              「候補を生成」ボタンをクリックして、タイトル候補を生成してください
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <FormDescription>
                  ストーリーのタイトルを入力してください。
                </FormDescription>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {/* キャッチコピー */}
        <FormField
          control={form.control}
          name="catchphrase"
          render={({ field }) => (
            <FormItem>
              <FormLabel>キャッチコピー（オプション）</FormLabel>
              <div className="space-y-4">
                <FormControl>
                  <Textarea
                    placeholder="ストーリーのキャッチコピーを入力"
                    disabled={submitting}
                    data-testid="catchphrase-input"
                    {...field}
                    className="story-textarea th-50"
                  />
                </FormControl>
                {hasValidStoryId() && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleShowCatchphraseSuggestionsBox}
                    disabled={submitting}
                    className="w-full"
                    data-testid="show-catchphrase-suggestions-button"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    キャッチコピー候補生成
                  </Button>
                )}

                {showCatchphraseSuggestions && (
                  <Card className="mt-4">
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">キャッチコピー候補</h3>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={handleCloseCatchphraseSuggestions}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            閉じる
                          </Button>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={handleGenerateCatchphraseSuggestions}
                            disabled={isGeneratingCatchphrases}
                            className="flex-1"
                          >
                            <Sparkles className="mr-2 h-4 w-4" />
                            {isGeneratingCatchphrases ? "生成中..." : "候補を生成"}
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleResetCatchphrase}
                            className="flex-shrink-0"
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            リセット
                          </Button>
                        </div>

                        <div className="grid gap-2 mt-2">
                          {catchphraseSuggestions.length > 0 ? (
                            catchphraseSuggestions.map((catchphrase, index) => (
                              <div key={index} className="flex items-center justify-between border p-2 rounded">
                                <div className="flex items-center space-x-2">
                                  <Label className="cursor-pointer">{catchphrase}</Label>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleSelectCatchphrase(catchphrase)}
                                >
                                  選択
                                </Button>
                              </div>
                            ))
                          ) : (
                            <div className="text-center text-muted-foreground py-2">
                              「候補を生成」ボタンをクリックして、キャッチコピー候補を生成してください
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <FormDescription>
                  ストーリーを一言で表すキャッチコピーがあれば入力してください。
                </FormDescription>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {/* 概要 */}
        <FormField
          control={form.control}
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>概要（オプション）</FormLabel>
              <div className="space-y-4">
                <FormControl>
                  <Textarea
                    placeholder="ストーリーの概要や希望する要素を入力"
                    rows={4}
                    disabled={submitting}
                    data-testid="summary-input"
                    {...field}
                    className="story-textarea th-100"
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleShowSummarySuggestionsBox}
                  disabled={submitting}
                  className="w-full"
                  data-testid="show-summary-suggestions-button"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  概要候補生成
                </Button>

                {showSummarySuggestion && (
                  <Card className="mt-4">
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">概要候補</h3>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={handleCloseSummarySuggestions}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            閉じる
                          </Button>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={handleGenerateSummarySuggestions}
                            disabled={isGeneratingSummary}
                            className="flex-1"
                          >
                            <Sparkles className="mr-2 h-4 w-4" />
                            {isGeneratingSummary ? "生成中..." : "候補を生成"}
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleResetSummary}
                            className="flex-shrink-0"
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            リセット
                          </Button>
                        </div>

                        <div className="grid gap-2 mt-2">
                          {summarySuggestion ? (
                            <div className="flex items-center justify-between border p-2 rounded">
                              <div className="flex items-center space-x-2">
                                <Label className="cursor-pointer">{summarySuggestion}</Label>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => handleSelectSummary(summarySuggestion)}
                              >
                                選択
                              </Button>
                            </div>
                          ) : (
                            <div className="text-center text-muted-foreground py-2">
                              「候補を生成」ボタンをクリックして、概要候補を生成してください
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <FormDescription>
                  ストーリーの概要や希望する要素があれば入力してください。
                  AI生成の参考にされます。
                </FormDescription>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {/* 送信ボタン */}
        <div className="flex justify-between items-center gap-4">
          {cancelButton && <div data-testid="cancel-button-container">{cancelButton}</div>}
          <Button
            type="submit"
            disabled={submitting}
            className={cancelButton ? "flex-1" : "w-full"}
            data-testid="submit-button"
          >
            <Save className="mr-2 h-4 w-4" />
            {submitting ? "処理中..." : submitButtonText}
          </Button>
        </div>
      </form>
    </Form>
  )
}
