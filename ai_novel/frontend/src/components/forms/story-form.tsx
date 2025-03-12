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
  description: z.string().optional(),
})

interface StoryFormProps {
  onSubmit: (data: z.infer<typeof formSchema>) => void
  defaultValues?: Partial<z.infer<typeof formSchema>>
  isSubmitting?: boolean
}

export function StoryForm({ onSubmit, defaultValues, isSubmitting = false }: StoryFormProps) {
  const [submitting, setSubmitting] = useState(isSubmitting)

  // フォーム初期化
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: defaultValues?.title || "",
      description: defaultValues?.description || "",
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
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
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
                  {...field}
                />
              </FormControl>
              <FormDescription>
                ストーリーの仮タイトルを入力してください。
                後からAIによって良いタイトルが提案されます。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 概要 */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>概要（オプション）</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="ストーリーの概要や希望する要素を入力"
                  rows={4}
                  disabled={submitting}
                  {...field}
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
        <Button type="submit" disabled={submitting} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          ストーリーを作成
        </Button>
      </form>
    </Form>
  )
}
