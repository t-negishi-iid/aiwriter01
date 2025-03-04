#!/usr/bin/env python
# -*- coding: utf-8 -*-

import unittest
import json
import requests
from unittest.mock import patch, MagicMock

# バックエンドモジュールが実装されたら、以下のコメントを解除
# from ai_novel.backend.novel_gen.dify_api import DifyNovelAPI
from ai_novel.backend.tests.DifyAPI.test_utils import make_dify_api_request

class TestBasicSettingDataCreation(unittest.TestCase):
    """基本設定作成用データ生成APIのテストクラス"""

    def setUp(self):
        """テスト前の準備"""
        self.api_key = "app-RVzFPhndqQyflqMxkmBAx8uV"
        self.endpoint = "https://api.dify.ai/v1/chat-messages"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        self.valid_params = {
            "inputs": {
                "主題": "自己成長・成長物語",
                "時代と場所": "現代日本・都市部",
                "作品世界と舞台設定": "中世ヨーロッパ風ファンタジー世界",
                "プロットパターン": "英雄の旅",
                "愛情表現": ["恋愛", "友情"],
                "感情表現": ["喜び", "悲しみ"],
                "雰囲気演出": ["神秘的", "壮大"],
                "官能表現": ["ほのか"],
                "精神的要素": ["成長", "葛藤"],
                "社会的要素": ["階級", "差別"],
                "過去の謎": ["出生の秘密", "古代の遺物"]
            },
            "query": "これらの設定から基本設定作成用データを作成してください",
            "response_mode": "blocking"
        }

    @patch('requests.post')
    def test_with_mock(self, mock_post):
        """モックを使用したテスト"""
        # モックのレスポンスを設定
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "answer": "テスト用基本設定作成用データ",
            "conversation_id": "test-conv-id"
        }
        mock_post.return_value = mock_response

        # APIリクエスト実行
        response = requests.post(
            self.endpoint,
            headers=self.headers,
            json=self.valid_params
        )

        # モックが正しく呼び出されたか検証
        mock_post.assert_called_once_with(
            self.endpoint,
            headers=self.headers,
            json=self.valid_params
        )

        # レスポンスを検証
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["answer"], "テスト用基本設定作成用データ")

    @patch('ai_novel.backend.tests.DifyAPI.test_utils.make_dify_api_request')
    def test_utility_function(self, mock_make_request):
        """ユーティリティ関数を使用したテスト"""
        # モックの戻り値を設定
        mock_make_request.return_value = {
            "answer": "ユーティリティ関数テスト用データ",
            "conversation_id": "util-test-id"
        }

        # ユーティリティ関数を使用してリクエスト
        response = make_dify_api_request(
            self.api_key,
            self.endpoint,
            self.valid_params
        )

        # 関数が正しく呼び出されたか検証
        mock_make_request.assert_called_once_with(
            self.api_key,
            self.endpoint,
            self.valid_params
        )

        # レスポンスを検証
        self.assertEqual(response["answer"], "ユーティリティ関数テスト用データ")

    def test_missing_required_param(self):
        """必須パラメータが欠けている場合のテスト"""
        # 主題パラメータを削除
        invalid_params = self.valid_params.copy()
        invalid_params["inputs"] = invalid_params["inputs"].copy()
        del invalid_params["inputs"]["主題"]

        with self.assertRaises(Exception):
            # バックエンドモジュールが実装されたら、以下を使用
            # dify_api = DifyNovelAPI()
            # dify_api.create_basic_setting_data(invalid_params["inputs"])
            # 代わりに直接APIリクエスト
            try:
                response = requests.post(
                    self.endpoint,
                    headers=self.headers,
                    json=invalid_params,
                    timeout=5  # 短いタイムアウトを設定
                )
                response.raise_for_status()
            except (requests.RequestException, requests.HTTPError) as e:
                raise Exception(f"APIリクエストエラー: {str(e)}")

    def test_invalid_api_key(self):
        """無効なAPIキーを使用した場合のテスト"""
        invalid_headers = {
            "Authorization": "Bearer invalid-api-key",
            "Content-Type": "application/json"
        }

        with self.assertRaises(requests.HTTPError):
            response = requests.post(
                self.endpoint,
                headers=invalid_headers,
                json=self.valid_params,
                timeout=5
            )
            response.raise_for_status()

    @unittest.skip("実際のAPIを呼び出すため、通常テストではスキップ")
    def test_real_api_call(self):
        """実際のAPIを呼び出すテスト（通常はスキップ）"""
        response = requests.post(
            self.endpoint,
            headers=self.headers,
            json=self.valid_params
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('answer', data)
        # レスポンスの内容を検証するアサーションを追加
        print(f"API応答: {data['answer'][:100]}...")  # 応答の最初の100文字を表示

if __name__ == '__main__':
    unittest.main()
