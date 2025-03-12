"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Save, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BasicSettingData } from "@/lib/types"

// 基本設定作成用データのスキーマ
const formSchema = z.object({
  genre: z.string().min(1, "ジャンルは必須項目です"),
  theme: z.string().min(1, "テーマは必須項目です"),
  setting: z.string().min(1, "舞台設定は必須項目です"),
  era: z.string().min(1, "時代は必須項目です"),
  emotions: z.string().min(1, "情緒的要素は必須項目です"),
  plot_type: z.string().min(1, "プロットタイプは必須項目です"),
  mystery: z.string().min(1, "過去の謎は必須項目です"),
  additional_info: z.string().optional(),
})

// ジャンル選択肢
const genreOptions = [
  { value: "fantasy", label: "ファンタジー" },
  { value: "scifi", label: "SF" },
  { value: "mystery", label: "ミステリー" },
  { value: "romance", label: "恋愛" },
  { value: "horror", label: "ホラー" },
  { value: "adventure", label: "冒険" },
  { value: "historical", label: "歴史" },
  { value: "slice_of_life", label: "日常" },
  { value: "action", label: "アクション" },
  { value: "thriller", label: "サスペンス" },
]

// プロットタイプ選択肢
const plotTypeOptions = [
  { value: "heroic_journey", label: "英雄の旅" },
  { value: "overcoming_the_monster", label: "怪物との戦い" },
  { value: "rags_to_riches", label: "成り上がり" },
  { value: "quest", label: "探求" },
  { value: "voyage_and_return", label: "旅と帰還" },
  { value: "comedy", label: "喜劇" },
  { value: "tragedy", label: "悲劇" },
  { value: "rebirth", label: "再生" },
  { value: "mystery", label: "謎解き" },
  { value: "rebellion", label: "反抗" },
]

interface BasicSettingDataFormProps {
  storyId: string;
  onSubmit: (data: BasicSettingData) => void;
  initialData?: Partial<BasicSettingData>;
}

export function BasicSettingDataForm({ storyId, onSubmit, initialData }: BasicSettingDataFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // フォーム初期化
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      genre: initialData?.genre || "",
      theme: initialData?.theme || "",
      setting: initialData?.setting || "",
      era: initialData?.era || "",
      emotions: initialData?.emotions || "",
      plot_type: initialData?.plot_type || "",
      mystery: initialData?.mystery || "",
      additional_info: initialData?.additional_info || "",
    },
  })

  // フォーム送信ハンドラ
  async function handleFormSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      await onSubmit(values)
    } catch (error) {
      console.error("フォーム送信エラー:", error)
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* ジャンル */}
        <FormField
          control={form.control}
          name="genre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ジャンル</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="ジャンルを選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {genreOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                物語のジャンルを選択してください。これにより全体的な雰囲気や方向性が決まります。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* テーマ */}
        <FormField
          control={form.control}
          name="theme"
          render={({ field }) => (
            <FormItem>
              <FormLabel>テーマ</FormLabel>
              <FormControl>
                <Input
                  placeholder="例: 成長、復讐、愛と喪失など"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                物語を通して探求したい中心的なテーマを入力してください。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 舞台設定 */}
        <FormField
          control={form.control}
          name="setting"
          render={({ field }) => (
            <FormItem>
              <FormLabel>舞台設定</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="例: 近未来の東京、中世ヨーロッパの小さな村など"
                  disabled={isSubmitting}
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                物語の舞台となる場所や環境について詳しく説明してください。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 時代 */}
        <FormField
          control={form.control}
          name="era"
          render={({ field }) => (
            <FormItem>
              <FormLabel>時代</FormLabel>
              <FormControl>
                <Input
                  placeholder="例: 現代、江戸時代、2050年など"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                物語が展開される時代を指定してください。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 情緒的要素 */}
        <FormField
          control={form.control}
          name="emotions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>情緒的要素</FormLabel>
              <FormControl>
                <Input
                  placeholder="例: 希望、絶望、憧れ、郷愁など"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                物語で強調したい感情や雰囲気を入力してください。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* プロットタイプ */}
        <FormField
          control={form.control}
          name="plot_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>プロットタイプ</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="プロットタイプを選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {plotTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                物語の基本的な構造や展開パターンを選択してください。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 過去の謎 */}
        <FormField
          control={form.control}
          name="mystery"
          render={({ field }) => (
            <FormItem>
              <FormLabel>過去の謎</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="例: 主人公の出生の秘密、村に伝わる伝説の真相など"
                  disabled={isSubmitting}
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                物語の中で明らかになる謎や秘密について説明してください。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 追加情報 */}
        <FormField
          control={form.control}
          name="additional_info"
          render={({ field }) => (
            <FormItem>
              <FormLabel>追加情報（オプション）</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="その他、物語に取り入れたい要素や注意点があれば入力してください"
                  disabled={isSubmitting}
                  rows={5}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                AI生成時に考慮してほしい追加情報があれば入力してください。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 送信ボタン */}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              基本設定を生成
            </>
          )}
        </Button>
      </form>
    </Form>
  )
}
