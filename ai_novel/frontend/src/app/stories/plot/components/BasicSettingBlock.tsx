'use client';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Blocks, Edit } from 'lucide-react';
import { BasicSetting } from '../lib/types';

interface BasicSettingBlockProps {
  basicSetting: BasicSetting | null;
  onEditAct?: (act: number) => void;
}

export function BasicSettingBlock({ basicSetting, onEditAct }: BasicSettingBlockProps) {
  if (!basicSetting) return null;

  const handleEditClick = async (act: number) => {
    if (onEditAct) {
      onEditAct(act);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Blocks className="h-5 w-5 mr-2" />
          基本設定のあらすじ
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <div className="relative mb-1">
              <h3 className="text-sm font-medium" id="act1-label">第1幕</h3>
              {onEditAct && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 absolute top-0 right-0"
                  onClick={() => handleEditClick(1)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  <span className="text-xs">編集</span>
                </Button>
              )}
            </div>
            <textarea
              className="w-full text-sm text-gray-600 p-2 rounded border border-gray-200 bg-gray-50 story-textarea th-300"
              value={basicSetting.act1_overview || '未設定'}
              readOnly
              rows={3}
              aria-labelledby="act1-label"
              title="第1幕のあらすじ"
            />
          </div>
          <div>
            <div className="relative mb-1">
              <h3 className="text-sm font-medium" id="act2-label">第2幕</h3>
              {onEditAct && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 absolute top-0 right-0"
                  onClick={() => handleEditClick(2)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  <span className="text-xs">編集</span>
                </Button>
              )}
            </div>
            <textarea
              className="w-full text-sm text-gray-600 p-2 rounded border border-gray-200 bg-gray-50 story-textarea th-300"
              value={basicSetting.act2_overview || '未設定'}
              readOnly
              rows={3}
              aria-labelledby="act2-label"
              title="第2幕のあらすじ"
            />
          </div>
          <div>
            <div className="relative mb-1">
              <h3 className="text-sm font-medium" id="act3-label">第3幕</h3>
              {onEditAct && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 absolute top-0 right-0"
                  onClick={() => handleEditClick(3)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  <span className="text-xs">編集</span>
                </Button>
              )}
            </div>
            <textarea
              className="w-full text-sm text-gray-600 p-2 rounded border border-gray-200 bg-gray-50 story-textarea th-300"
              value={basicSetting.act3_overview || '未設定'}
              readOnly
              rows={3}
              aria-labelledby="act3-label"
              title="第3幕のあらすじ"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
