'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import { BasicSetting } from '../lib/types';

interface BasicSettingBlockProps {
  basicSetting: BasicSetting | null;
}

export function BasicSettingBlock({ basicSetting }: BasicSettingBlockProps) {
  if (!basicSetting) return null;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <BookOpen className="h-5 w-5 mr-2" />
          基本設定のあらすじ
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <h3 className="text-sm font-medium" id="act1-label">第1幕</h3>
            <textarea
              className="w-full text-sm text-gray-600 p-2 rounded border border-gray-200 bg-gray-50"
              style={{ lineHeight: '1.8', width: '100%', height: '300px', minHeight: '100px', boxSizing: 'border-box', padding: '20px', margin: '0' }}
              value={basicSetting.act1_overview || '未設定'}
              readOnly
              rows={3}
              aria-labelledby="act1-label"
              title="第1幕のあらすじ"
            />
          </div>
          <div>
            <h3 className="text-sm font-medium" id="act2-label">第2幕</h3>
            <textarea
              className="w-full text-sm text-gray-600 p-2 rounded border border-gray-200 bg-gray-50"
              style={{ lineHeight: '1.8', width: '100%', height: '300px', minHeight: '100px', boxSizing: 'border-box', padding: '20px', margin: '0' }}
              value={basicSetting.act2_overview || '未設定'}
              readOnly
              rows={3}
              aria-labelledby="act2-label"
              title="第2幕のあらすじ"
            />
          </div>
          <div>
            <h3 className="text-sm font-medium" id="act3-label">第3幕</h3>
            <textarea
              className="w-full text-sm text-gray-600 p-2 rounded border border-gray-200 bg-gray-50"
              style={{ lineHeight: '1.8', width: '100%', height: '300px', minHeight: '100px', boxSizing: 'border-box', padding: '20px', margin: '0' }}
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
