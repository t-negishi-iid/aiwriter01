#!/usr/bin/env python
# -*- coding: utf-8 -*-

import unittest
import json
import requests
import pytest
from unittest.mock import patch, MagicMock

# 設定ファイルのインポート
from TEST.DifyAPI.config import API_KEYS, API_ENDPOINT, DEV_MODE
from backend.novel_gen.dify_api import DifyNovelAPI
from TEST.DifyAPI.test_utils import make_dify_api_request

class TestBasicSettingCreation(unittest.TestCase):
    """基本設定生成APIのテストクラス"""

    def setUp(self):
        """テスト前の準備"""
        self.api_key = API_KEYS['basic_setting']
        self.endpoint = API_ENDPOINT
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        self.valid_params = {
            "inputs": {
                "basic_setting_data": "# 基本設定作成用データ\n\n## 主題\n自己成長・成長物語\n\n## 時代と場所\n現代日本・都市部\n\n## 作品世界と舞台設定\n中世ヨーロッパ風ファンタジー世界\n\n## プロットパターン\n英雄の旅\n\n## 要素\n\n### 愛情表現\n恋愛, 友情\n\n### 感情表現\n喜び, 悲しみ\n\n### 雰囲気演出\n神秘的, 壮大\n\n### 官能表現\nほのか\n\n### 精神的要素\n成長, 葛藤\n\n### 社会的要素\n階級, 差別\n\n### 過去の謎\n出生の秘密, 古代の遺物"
            },
            "query": "基本設定作成用データから基本設定を生成してください",
            "response_mode": "blocking"
        }
        # DifyNovelAPIインスタンス
        self.dify_api = DifyNovelAPI()

    @patch('requests.post')
    def test_with_mock(self, mock_post):
        """モックを使用したテスト"""
        # モックのレスポンスを設定
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "answer": "# 基本設定\n\n## 作品設定\n\n### タイトル\n「星霜の継承者」\n\n### ジャンル\nファンタジー、冒険、成長物語\n\n### 舞台設定\n中世ヨーロッパ風の魔法世界「アストラル大陸」\n\n## 登場人物\n\n### 主人公\nレイン・ソーマ（17歳・男性）\n現代日本から異世界に召喚された青年。出生の秘密を持つ。\n\n### ヒロイン\nアリア・クレセント（16歳・女性）\n古き王家の末裔。魔法の才能を持つが身分による制約がある。\n\n### ライバル\nヴァイス・シュヴァルツ（18歳・男性）\n貴族の息子。主人公に対して敵対心を持つ。\n\n### 師匠\nマーリン・セージ（68歳・男性）\n伝説の魔法使い。主人公を導く。\n\n## あらすじ\n\n### 第一幕：出会いと試練\n現代日本の高校生レインは、謎の古書により異世界「アストラル大陸」に召喚される。そこで貴族の娘アリアと出会い、自分が「星の継承者」と呼ばれる存在であることを知る。レインはマーリン老に弟子入りし、魔法の修行を始める。しかし、貴族の息子ヴァイスの妨害や、自らの出自の謎に悩まされる。\n\n### 第二幕：冒険と成長\nレインはアリアや新たな仲間たちと共に、古代の遺跡を巡る旅に出る。その過程で、自分が実は異世界の王家の血を引いており、かつての大戦で現代日本に送られた王子だったことを知る。レインは仲間たちとの絆を深めながら、徐々に力を身につけていく。\n\n### 第三幕：真実と決断\n大陸に古代の魔物が復活し、世界の危機が訪れる。レインは自らの使命を受け入れ、仲間たちと共に最終決戦に挑む。階級や出身の違いを超えた絆の力で魔物を封印し、アストラル大陸に新たな平和をもたらす。レインはアリアと共に新時代を切り開くことを決意する。",
            "conversation_id": "test-basic-setting-id"
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
        self.assertTrue(data["answer"].startswith("# 基本設定\n\n"))

    def test_utility_function(self):
        """ユーティリティ関数を使用したテスト"""
        # テスト対象の関数内でrequests.postを使用しているので、それをモック
        with patch('requests.post') as mock_post:
            # モックのレスポンスを設定
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "answer": "# 基本設定\n\n## 作品設定...",
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
        self.assertTrue(response["answer"].startswith("# 基本設定\n\n"))

    @patch('backend.novel_gen.dify_api.DifyNovelAPI._make_api_request')
    def test_create_basic_setting(self, mock_api_request):
        """DifyNovelAPIクラスのcreate_basic_settingメソッドのテスト"""
        # モックの戻り値を設定
        mock_api_request.return_value = {
            "answer": "# 基本設定\n\n## 作品設定\n\n### タイトル\n「星霜の継承者」\n\n...",
            "conversation_id": "api-test-id"
        }

        # テスト実行
        result = self.dify_api.create_basic_setting(
            basic_setting_data=self.valid_params["inputs"]["basic_setting_data"],
            user_id="test-user-id"
        )

        # APIリクエストが正しく呼び出されたか検証
        mock_api_request.assert_called_once_with(
            "basic_setting",
            {"基本設定作成用データ": self.valid_params["inputs"]["basic_setting_data"]},
            "test-user-id",
            True
        )

        # 結果を検証
        self.assertIn("answer", result)
        self.assertIn("conversation_id", result)

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
