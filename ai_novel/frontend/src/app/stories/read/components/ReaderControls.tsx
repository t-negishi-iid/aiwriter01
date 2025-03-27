"use client";

import React, { useState } from 'react';

interface ReaderControlsProps {
  fontSize: number;
  onChangeFontSize: (size: number) => void;
  isVertical: boolean;
  onToggleWritingMode: () => void;
  theme: string;
  onChangeTheme: (theme: string) => void;
}

export default function ReaderControls({
  fontSize,
  onChangeFontSize,
  isVertical,
  onToggleWritingMode,
  theme,
  onChangeTheme
}: ReaderControlsProps) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowSettings(prev => !prev)}
        className="p-2 rounded-full bg-white/80 shadow-md hover:bg-gray-200 dark:bg-gray-800/80 dark:hover:bg-gray-700"
        aria-label="表示設定"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </button>
      
      {/* 設定メニュー */}
      {showSettings && (
        <div className="absolute right-0 top-12 bg-white dark:bg-gray-800 shadow-lg rounded-lg border p-4 w-64 z-20">
          <div className="space-y-4">
            {/* フォントサイズ設定 */}
            <div>
              <h4 className="text-sm font-medium mb-2">文字サイズ</h4>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => onChangeFontSize(Math.max(12, fontSize - 2))}
                  className="p-1 border rounded"
                  aria-label="文字を小さくする"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
                <span className="mx-2">{fontSize}px</span>
                <button
                  onClick={() => onChangeFontSize(Math.min(24, fontSize + 2))}
                  className="p-1 border rounded"
                  aria-label="文字を大きくする"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              </div>
            </div>
            
            {/* 書き方向設定 */}
            <div>
              <h4 className="text-sm font-medium mb-2">書き方向</h4>
              <button
                onClick={onToggleWritingMode}
                className="w-full p-2 border rounded flex items-center justify-between"
              >
                <span>{isVertical ? '縦書き' : '横書き'}</span>
                <span className="text-xs bg-gray-200 dark:bg-gray-700 rounded px-2 py-1">
                  {isVertical ? '縦' : '横'}
                </span>
              </button>
            </div>
            
            {/* テーマ設定 */}
            <div>
              <h4 className="text-sm font-medium mb-2">背景テーマ</h4>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onChangeTheme('light')}
                  className={`p-2 border rounded aspect-square ${
                    theme === 'light' ? 'ring-2 ring-blue-500' : ''
                  }`}
                  aria-label="ライトテーマ"
                >
                  <div className="w-full h-full bg-white"></div>
                </button>
                <button
                  onClick={() => onChangeTheme('sepia')}
                  className={`p-2 border rounded aspect-square ${
                    theme === 'sepia' ? 'ring-2 ring-blue-500' : ''
                  }`}
                  aria-label="セピアテーマ"
                >
                  <div className="w-full h-full bg-amber-50"></div>
                </button>
                <button
                  onClick={() => onChangeTheme('dark')}
                  className={`p-2 border rounded aspect-square ${
                    theme === 'dark' ? 'ring-2 ring-blue-500' : ''
                  }`}
                  aria-label="ダークテーマ"
                >
                  <div className="w-full h-full bg-gray-900"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
