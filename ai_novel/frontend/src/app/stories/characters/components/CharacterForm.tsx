import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CharacterData } from '../lib/types';
import { Loader2 } from 'lucide-react';
import { fetchApi } from '@/lib/api-client';
import { toast } from '@/components/ui/use-toast';

interface CharacterFormProps {
  character: CharacterData | null;
  onSave: (character: CharacterData) => Promise<void>;
  onCancel: () => void;
  onDelete?: (characterId: number) => Promise<void>;
  storyId: string | null;
  isSaving: boolean;
}

export function CharacterForm({
  character,
  onSave,
  onCancel,
  onDelete,
  storyId,
  isSaving
}: CharacterFormProps) {
  const [formData, setFormData] = useState<CharacterData>({
    id: character?.id,
    storyId: storyId,
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
    raw_content: character?.raw_content,
  });
  const [isGeneratingDetail, setIsGeneratingDetail] = useState(false);

  // キャラクターが変更されたら、フォームデータを更新
  useEffect(() => {
    if (character) {
      setFormData({
        id: character.id,
        storyId: storyId,
        name: character.name || '',
        role: character.role || '',
        age: character.age || '',
        gender: character.gender || '',
        appearance: character.appearance || '',
        personality: character.personality || '',
        background: character.background || '',
        motivation: character.motivation || '',
        relationship: character.relationship || '',
        development: character.development || '',
        raw_content: character.raw_content,
      });
    } else {
      // 新規作成時は初期化
      setFormData({
        id: undefined,
        storyId: storyId,
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
      });
    }
  }, [character, storyId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  const handleDelete = async () => {
    if (!character?.id) return;

    // 確認ダイアログ
    if (window.confirm('このキャラクターを削除してもよろしいですか？')) {
      await onDelete?.(character.id);
    }
  };

  // 詳細生成処理
  const handleGenerateDetail = async () => {
    if (!character?.id || !storyId) return;

    try {
      setIsGeneratingDetail(true);

      // 詳細生成APIを呼び出す
      const response = await fetchApi(`/stories/${storyId}/create-character-detail/`, {
        method: 'POST',
        body: JSON.stringify({ character_id: character.id })
      });

      // 成功したら、フォームデータを更新
      if (response) {
        setFormData(prev => ({
          ...prev,
          appearance: response.appearance || prev.appearance,
          personality: response.personality || prev.personality,
          background: response.background || prev.background,
          motivation: response.motivation || prev.motivation,
          relationship: response.relationship || prev.relationship,
          development: response.development || prev.development,
          raw_content: response.raw_content || prev.raw_content
        }));

        toast({
          title: "詳細生成完了",
          description: "キャラクターの詳細情報を生成しました",
        });
      }
    } catch (error) {
      console.error('キャラクター詳細生成エラー:', error);
      toast({
        variant: "destructive",
        title: "エラー",
        description: "キャラクター詳細の生成に失敗しました",
      });
    } finally {
      setIsGeneratingDetail(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-between space-x-4 pt-4">
        <div>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
          >
            キャンセル
          </Button>

          <Button
            type="submit"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              '保存'
            )}
          </Button>
          {character?.id && onDelete && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isSaving}
            >
              削除
            </Button>
          )}
          {character?.id && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleGenerateDetail}
              disabled={isGeneratingDetail || isSaving}
              className="ml-2"
            >
              {isGeneratingDetail ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                '詳細を生成'
              )}
            </Button>
          )}
        </div>

      </div>

      {/* 名前と役割をシンプルに表示 */}
      <div className="space-y-2 mb-4">
        <div>
          <p className="text-md">
            <strong>名前</strong>：{formData.name}
          </p>
        </div>

        <div>
          <p className="text-md">
            <strong>役割</strong>：{formData.role}
          </p>
        </div>
      </div>

      {/* 以下のフィールドは当面使用しないためコメントアウト */}
      {/* 
      <div className="space-y-4">
        <div>
          <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
            年齢
          </label>
          <input
            type="text"
            id="age"
            name="age"
            value={formData.age || ''}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ width: '100%', padding: '5px', margin: '0' }}
          />
        </div>

        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
            性別
          </label>
          <input
            type="text"
            id="gender"
            name="gender"
            value={formData.gender || ''}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ width: '100%', padding: '5px', margin: '0' }}
          />
        </div>
      </div>
      */}

      {/* 以下のフィールドは当面使用しないためコメントアウト */}
      {/* 
      <div className="space-y-4">
        <div>
          <label htmlFor="personality" className="block text-sm font-medium text-gray-700 mb-1">
            性格
          </label>
          <textarea
            id="personality"
            name="personality"
            value={formData.personality}
            onChange={handleChange}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ width: '100%', height: '100px', minHeight: '100px', boxSizing: 'border-box', padding: '20px', margin: '0' }}
          />
        </div>

        <div>
          <label htmlFor="appearance" className="block text-sm font-medium text-gray-700 mb-1">
            外見
          </label>
          <textarea
            id="appearance"
            name="appearance"
            value={formData.appearance}
            onChange={handleChange}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ width: '100%', height: '100px', minHeight: '100px', boxSizing: 'border-box', padding: '20px', margin: '0' }}
          />
        </div>

        <div>
          <label htmlFor="background" className="block text-sm font-medium text-gray-700 mb-1">
            背景
          </label>
          <textarea
            id="background"
            name="background"
            value={formData.background}
            onChange={handleChange}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ width: '100%', height: '100px', minHeight: '100px', boxSizing: 'border-box', padding: '20px', margin: '0' }}
          />
        </div>

        <div>
          <label htmlFor="motivation" className="block text-sm font-medium text-gray-700 mb-1">
            動機
          </label>
          <textarea
            id="motivation"
            name="motivation"
            value={formData.motivation || ''}
            onChange={handleChange}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ width: '100%', height: '100px', minHeight: '100px', boxSizing: 'border-box', padding: '20px', margin: '0' }}
          />
        </div>

        <div>
          <label htmlFor="relationship" className="block text-sm font-medium text-gray-700 mb-1">
            関係性
          </label>
          <textarea
            id="relationship"
            name="relationship"
            value={formData.relationship || ''}
            onChange={handleChange}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ width: '100%', height: '100px', minHeight: '100px', boxSizing: 'border-box', padding: '20px', margin: '0' }}
          />
        </div>

        <div>
          <label htmlFor="development" className="block text-sm font-medium text-gray-700 mb-1">
            発展/成長
          </label>
          <textarea
            id="development"
            name="development"
            value={formData.development || ''}
            onChange={handleChange}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ width: '100%', height: '100px', minHeight: '100px', boxSizing: 'border-box', padding: '20px', margin: '0' }}
          />
        </div>
      </div>
      */}

      <div>
        <label htmlFor="raw_content" className="block text-sm font-medium text-gray-700 mb-1">
          詳細設定
        </label>
        <textarea
          id="raw_content"
          name="raw_content"
          value={formData.raw_content || ''}
          onChange={handleChange}
          rows={3}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ width: '100%', height: '300px', minHeight: '100px', boxSizing: 'border-box', padding: '20px', margin: '0' }}
        />
      </div>

    </form>
  );
}
