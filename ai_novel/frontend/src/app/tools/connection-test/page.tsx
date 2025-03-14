/**
 * API接続テストページ
 * バックエンドとの疎通確認をシンプルに行うためのユーティリティページ
 */

'use client'

import { useState, useEffect } from 'react'
import { connectivityApi } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function ConnectionTestPage() {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [lastChecked, setLastChecked] = useState<string | null>(null)

  const checkConnection = async () => {
    setStatus('testing')
    setMessage('接続を確認中...')

    try {
      const response = await connectivityApi.isLive()

      if (response.success && response.data && response.data.results === 'live') {
        setStatus('success')
        setMessage('バックエンドAPIに正常に接続できました！')
      } else {
        setStatus('error')
        setMessage(`接続エラー: ${response.message || '予期せぬエラー'}`)
      }
    } catch (error) {
      setStatus('error')
      setMessage(`接続エラー: ${error instanceof Error ? error.message : '予期せぬエラー'}`)
    }

    setLastChecked(new Date().toLocaleString('ja-JP'))
  }

  // ページロード時に自動的に接続チェック
  useEffect(() => {
    checkConnection()
  }, [])

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">API接続テスト</h1>

      <Card className="w-full max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>バックエンドAPI疎通確認</CardTitle>
          <CardDescription>
            バックエンドAPIサーバーとの接続状態を確認します
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium">接続状態:</h3>
              {lastChecked && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  最終確認: {lastChecked}
                </p>
              )}
            </div>

            <Badge
              className={`px-3 py-1 ${status === 'idle' ? 'bg-gray-500' :
                  status === 'testing' ? 'bg-yellow-500' :
                    status === 'success' ? 'bg-green-500' :
                      'bg-red-500'
                }`}
            >
              {
                status === 'idle' ? '未確認' :
                  status === 'testing' ? '確認中' :
                    status === 'success' ? '接続済み' :
                      'エラー'
              }
            </Badge>
          </div>

          <div className="p-4 rounded-md bg-gray-100 dark:bg-gray-800">
            <p>{message}</p>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            onClick={checkConnection}
            disabled={status === 'testing'}
            className="w-full"
          >
            {status === 'testing' ? '確認中...' : '接続を再確認'}
          </Button>
        </CardFooter>
      </Card>

      <div className="mt-8 text-center text-gray-500 dark:text-gray-400">
        <p>エンドポイント: /api/is_live/</p>
        <p className="text-xs mt-2">このツールはフロントエンドとバックエンドの疎通確認のためのものです</p>
      </div>
    </div>
  )
}
