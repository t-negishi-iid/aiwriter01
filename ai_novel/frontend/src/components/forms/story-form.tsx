"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

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
  defaultValues?: Partial<z.infer<typeof formSchema>>
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
              <FormControl>
                <Input
                  placeholder="ストーリーのタイトルを入力"
                  disabled={submitting}
                  data-testid="title-input"
                  {...field}
                  className="story-input"
                />
              </FormControl>
              <FormDescription>
                ストーリーのタイトルを入力してください。
              </FormDescription>
              <FormMessage />
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
              <FormControl>
                <Textarea
                  placeholder="ストーリーのキャッチコピーを入力"
                  disabled={submitting}
                  data-testid="catchphrase-input"
                  {...field}
                  className="story-textarea th-50"
                />
              </FormControl>
              <FormDescription>
                ストーリーを一言で表すキャッチコピーがあれば入力してください。
              </FormDescription>
              <FormMessage />
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
              <FormDescription>
                ストーリーの概要や希望する要素があれば入力してください。
                AI生成の参考にされます。
              </FormDescription>
              <FormMessage />
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
