"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Save, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BasicSettingData } from "@/lib/types"

// 基本設定作成用データのスキーマ
const formSchema = z.object({
  genre: z.string().min(1, "ジャンルは必須項目です"),
  theme: z.string().min(1, "テーマは必須項目です"),
  setting: z.string().min(1, "舞台設定は必須項目です"),
  era: z.string().min(1, "時代は必須項目です"),
  emotions: z.array(z.string()).min(1, "情緒的要素は必須項目です"),
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

// テーマ選択肢
const themeOptions = [
  { value: "self_growth", label: "自己成長・成長物語" },
  { value: "love_and_bonds", label: "愛と絆" },
  { value: "justice_and_ethics", label: "正義と倫理" },
  { value: "revenge_and_redemption", label: "復讐と救済" },
  { value: "technology_and_humanity", label: "技術と人間性" },
  { value: "struggle_against_society", label: "社会の歪みとの闘い" },
]

// 舞台設定選択肢
const settingOptions = [
  { value: "digital_dystopia", label: "デジタルディストピア設定" },
  { value: "post_apocalypse", label: "ポストアポカリプス設定" },
  { value: "urban_fantasy", label: "アーバンファンタジー設定" },
]

// 時代と場所選択肢
const eraOptions = [
  { value: "modern_japan", label: "現代日本・都市部（2010年代〜現在）" },
  { value: "modern_america", label: "現代アメリカ・大都市（2000年代〜現在）" },
  { value: "fantasy_world", label: "ファンタジー世界（時代設定なし）" },
  { value: "near_future_japan", label: "近未来日本（2030年代〜2050年代）" },
  { value: "sengoku_japan", label: "戦国時代日本（1467年〜1615年）" },
  { value: "meiji_taisho_japan", label: "明治・大正時代日本（1868年〜1926年）" },
]

// 情緒的要素選択肢
const emotionsOptions = [
  { value: "love_expression", label: "愛情表現（純愛、初恋、片思い等）" },
  { value: "emotional_expression", label: "感情表現（純情さ、友情、憎しみ等）" },
  { value: "atmosphere", label: "雰囲気演出（ホラー、ミステリアス、ファンタジー等）" },
  { value: "sensual_expression", label: "官能的表現（エロティシズム、グロテスク等）" },
  { value: "spiritual_elements", label: "精神的要素（思索性、宗教性、倫理性等）" },
  { value: "social_elements", label: "社会的要素（リアリズム、社会性、政治性等）" },
]

// プロットタイプ選択肢
const plotTypeOptions = [
  { value: "heroic_journey", label: "英雄の旅" },
  { value: "tragic_fall", label: "悲劇的転落" },
  { value: "revenge_story", label: "復讐譚" },
  { value: "love_story", label: "恋愛成就" },
  { value: "self_discovery", label: "自己発見" },
  { value: "salvation_story", label: "救済物語" },
]

// 過去の謎選択肢
const mysteryOptions = [
  { value: "trauma_mystery", label: "トラウマの謎" },
  { value: "lost_memory", label: "失われた記憶" },
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
      emotions: initialData?.emotions || [],
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
                  <SelectTrigger data-test="genre-select">
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
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger data-test="theme-select">
                    <SelectValue placeholder="テーマを選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {themeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                物語を通して探求したい中心的なテーマを選択してください。
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
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger data-test="setting-select">
                    <SelectValue placeholder="舞台設定を選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {settingOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                物語の舞台となる場所や環境を選択してください。
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
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger data-test="era-select">
                    <SelectValue placeholder="時代を選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {eraOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                物語が展開される時代を選択してください。
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
              <Select
                onValueChange={(value) => {
                  field.onChange([value]);
                }}
                value={field.value?.[0] || ""}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger data-test="emotions-select">
                    <SelectValue placeholder="情緒的要素を選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {emotionsOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                物語で強調したい感情や雰囲気を選択してください。
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
                  <SelectTrigger data-test="plot_type-select">
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
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger data-test="mystery-select">
                    <SelectValue placeholder="過去の謎を選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {mysteryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                物語の中で明らかになる謎や秘密のタイプを選択してください。
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
