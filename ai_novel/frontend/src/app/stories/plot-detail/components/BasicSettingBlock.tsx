'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import { BasicSetting } from '../lib/types';

interface BasicSettingBlockProps {
  basicSetting: BasicSetting | null;
}

export function BasicSettingBlock({ basicSetting }: BasicSettingBlockProps) {
  if (!basicSetting) return null;

  const plot = basicSetting.plot || {};
  
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
            <h3 className="text-sm font-medium">第1幕</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-3">
              {plot.act1 || '未設定'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium">第2幕</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-3">
              {plot.act2 || '未設定'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium">第3幕</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-3">
              {plot.act3 || '未設定'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
