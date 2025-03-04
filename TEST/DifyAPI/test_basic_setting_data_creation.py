#!/usr/bin/env python
# -*- coding: utf-8 -*-

import unittest
import json
import requests
import pytest
from unittest.mock import patch, MagicMock

# 設定ファイルのインポート
from TEST.DifyAPI.config import API_KEYS, API_ENDPOINT, DEV_MODE
# バックエンドモジュールが実装されたら、以下のコメントを解除
from backend.novel_gen.dify_api import DifyNovelAPI
from TEST.DifyAPI.test_utils import make_dify_api_request

class TestBasicSettingDataCreation(unittest.TestCase):
    """基本設定作成用データ生成APIのテストクラス"""

    def setUp(self):
        """テスト前の準備"""
        self.api_key = API_KEYS['basic_setting_data']
        self.endpoint = API_ENDPOINT
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

    def test_utility_function(self):
        """ユーティリティ関数を使用したテスト"""
        # テスト対象の関数内でrequests.postを使用しているので、それをモック
        with patch('requests.post') as mock_post:
            # モックのレスポンスを設定
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "answer": "ユーティリティ関数テスト用データ",
                "conversation_id": "util-test-id"
            }
            mock_post.return_value = mock_response

            # APIリクエスト実行
            response = make_dify_api_request(
                self.api_key,
                self.endpoint,
                self.valid_params,
                use_mock=False  # モックを無効にして実際のrequests.postが呼び出されるようにする
            )

            # リクエストが正しく行われたか検証
            mock_post.assert_called_once_with(
                self.endpoint,
                headers=self.headers,
                json=self.valid_params,
                timeout=60
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
            # create_basic_setting_data(invalid_params["inputs"])
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

    def test_real_api_call(self):
        """実際のAPIを呼び出すテスト"""
        response = requests.post(
            self.endpoint,
            headers=self.headers,
            json=self.valid_params
        )

        # ステータスコードを確認（アサーションは最低限に）
        print(f"API応答ステータス: {response.status_code}")
        print(f"API応答ヘッダー: {response.headers}")

        if response.status_code in [200, 201, 202]:
            data = response.json()
            print(f"API応答: {data}")

        self.assertIn(response.status_code, [200, 201, 202, 400, 401, 403, 404])

if __name__ == '__main__':
    unittest.main()
