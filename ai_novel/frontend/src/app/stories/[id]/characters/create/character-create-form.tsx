'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { createCharacterDetail } from '@/lib/api-client';
import { Loader2 } from 'lucide-react';

// キャラクター作成フォームのバリデーションスキーマ
const characterFormSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  role: z.string().min(1, '役割は必須です'),
  age: z.string().optional(),
  gender: z.string().optional(),
  appearance: z.string().optional(),
  personality: z.string().optional(),
  background: z.string().optional(),
  motivation: z.string().optional(),
  relationship: z.string().optional(),
  development: z.string().optional(),
});

type CharacterFormValues = z.infer<typeof characterFormSchema>;

interface CharacterCreateFormProps {
  storyId: number;
}

export default function CharacterCreateForm({ storyId }: CharacterCreateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // フォームの初期化
  const form = useForm<CharacterFormValues>({
    resolver: zodResolver(characterFormSchema),
    defaultValues: {
      name: '',
      role: '',
      age: '',
      gender: '',
      appearance: '',
      personality: '',
      background: '',
      motivation: '',
      relationship: '',
      development: '',
    },
  });

  // フォーム送信処理
  const onSubmit = async (data: CharacterFormValues) => {
    setIsSubmitting(true);
    try {
      // APIを呼び出してキャラクター詳細を作成
      const response = await createCharacterDetail(storyId, {
        ...data,
        raw_content: JSON.stringify(data), // 生データとしてJSONを保存
      });

      toast({
        title: 'キャラクターを作成しました',
        description: `${data.name}のキャラクター詳細が正常に作成されました。`,
      });

      // 作成したキャラクターの詳細ページに遷移
      router.push(`/stories/${storyId}/characters/${response.id}`);
      router.refresh();
    } catch (error) {
      console.error('キャラクター作成エラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: 'キャラクターの作成中にエラーが発生しました。もう一度お試しください。',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // AIによるキャラクター詳細生成
  const generateCharacterDetail = async () => {
    const name = form.getValues('name');
    const role = form.getValues('role');

    if (!name || !role) {
      toast({
        title: '入力が不足しています',
        description: 'キャラクター名と役割は必須です。',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      // TODO: AIによるキャラクター詳細生成APIを呼び出す
      // 実装例:
      // const generatedData = await generateCharacterWithAI(storyId, { name, role });
      // form.setValue('age', generatedData.age || '');
      // form.setValue('gender', generatedData.gender || '');
      // form.setValue('appearance', generatedData.appearance || '');
      // form.setValue('personality', generatedData.personality || '');
      // form.setValue('background', generatedData.background || '');
      // form.setValue('motivation', generatedData.motivation || '');
      // form.setValue('relationship', generatedData.relationship || '');
      // form.setValue('development', generatedData.development || '');

      // 仮実装（実際にはAPIからのレスポンスを使用）
      setTimeout(() => {
        form.setValue('age', '25歳');
        form.setValue('gender', '男性');
        form.setValue('appearance', '身長180cm、黒髪、鋭い目つき。常に整った服装を心がけている。');
        form.setValue('personality', '冷静沈着で論理的。困難な状況でも冷静さを失わない。一方で、親しい人には優しさを見せる。');
        form.setValue('background', '名門大学を卒業後、大手企業に就職。しかし、ある事件をきっかけに現在の道を選ぶことになった。');
        form.setValue('motivation', '過去の出来事から、真実を追求することに人生をかけている。');
        form.setValue('relationship', '主人公とは幼馴染の関係。時に対立することもあるが、根底では強い信頼関係がある。');
        form.setValue('development', '物語を通じて、自分の信念と向き合い、成長していく。最終的には自分の過去と和解する。');

        toast({
          title: 'キャラクター詳細を生成しました',
          description: '生成された内容を確認し、必要に応じて編集してください。',
        });
      }, 2000);

    } catch (error) {
      console.error('キャラクター詳細生成エラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: 'キャラクター詳細の生成中にエラーが発生しました。もう一度お試しください。',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>名前 *</FormLabel>
                <FormControl>
                  <Input placeholder="キャラクターの名前" {...field} />
                </FormControl>
                <FormDescription>
                  キャラクターのフルネームを入力してください。
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>役割 *</FormLabel>
                <FormControl>
                  <Input placeholder="主人公、ヒロイン、敵役など" {...field} />
                </FormControl>
                <FormDescription>
                  物語内でのキャラクターの役割を入力してください。
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>年齢</FormLabel>
                <FormControl>
                  <Input placeholder="20代前半、17歳など" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>性別</FormLabel>
                <FormControl>
                  <Input placeholder="男性、女性など" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-center my-4">
          <Button
            type="button"
            variant="secondary"
            onClick={generateCharacterDetail}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                生成中...
              </>
            ) : (
              'AIでキャラクター詳細を生成'
            )}
          </Button>
        </div>

        <div className="space-y-6">
          <FormField
            control={form.control}
            name="appearance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>外見</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="キャラクターの外見的特徴を記述してください。"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="personality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>性格</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="キャラクターの性格や気質について記述してください。"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="background"
            render={({ field }) => (
              <FormItem>
                <FormLabel>背景</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="キャラクターの過去や背景について記述してください。"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="motivation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>動機</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="キャラクターの動機や目標について記述してください。"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="relationship"
            render={({ field }) => (
              <FormItem>
                <FormLabel>他キャラクターとの関係</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="他のキャラクターとの関係性について記述してください。"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="development"
            render={({ field }) => (
              <FormItem>
                <FormLabel>キャラクター成長</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="物語を通じてのキャラクターの成長や変化について記述してください。"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/stories/${storyId}/characters`)}
          >
            キャンセル
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              'キャラクターを保存'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
