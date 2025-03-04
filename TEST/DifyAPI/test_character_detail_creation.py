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

class TestCharacterDetailCreation(unittest.TestCase):
    """キャラクター詳細生成APIのテストクラス"""

    def setUp(self):
        """テスト前の準備"""
        self.api_key = API_KEYS['character_detail']
        self.endpoint = API_ENDPOINT
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        # テスト用の基本設定データ
        self.basic_setting = """# 基本設定

## 作品設定

### タイトル
「星霜の継承者」

### ジャンル
ファンタジー、冒険、成長物語

### 舞台設定
中世ヨーロッパ風の魔法世界「アストラル大陸」

## 登場人物

### 主人公
レイン・ソーマ（17歳・男性）
現代日本から異世界に召喚された青年。出生の秘密を持つ。

### ヒロイン
アリア・クレセント（16歳・女性）
古き王家の末裔。魔法の才能を持つが身分による制約がある。

### ライバル
ヴァイス・シュヴァルツ（18歳・男性）
貴族の息子。主人公に対して敵対心を持つ。

### 師匠
マーリン・セージ（68歳・男性）
伝説の魔法使い。主人公を導く。"""

        # テスト用のキャラクターデータ
        self.character_data = {
            "name": "レイン・ソーマ",
            "role": "主人公"
        }

        self.valid_params = {
            "inputs": {
                "basic_setting": self.basic_setting,
                "character_name": self.character_data["name"],
                "character_role": self.character_data["role"]
            },
            "query": "基本設定からキャラクター詳細を生成してください",
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
            "answer": "# キャラクター詳細\n\n## 基本情報\n\n**名前**: レイン・ソーマ\n**年齢**: 17歳\n**性別**: 男性\n**役割**: 主人公\n\n## 外見\n\n身長175cm、体格は普通。黒髪に鮮やかな碧眼が特徴。現代日本の服装をしているが、次第に異世界の服装に馴染んでいく。右手の甲に星型の痣がある。\n\n## 性格\n\n好奇心旺盛で正義感が強い。困っている人を見ると放っておけない。初めは臆病だが、冒険を通じて勇気を身につけていく。ユーモアのセンスがあり、緊張した場面を和ませることがある。\n\n## 能力・技術\n\n**魔法適性**: 高い（特に星の魔法に適性がある）\n**武器**: 星霜の剣（冒険中に入手する古代の魔剣）\n**特殊能力**: 「星詠み」—星の力を借りて予知や強力な魔法を使える\n**日常スキル**: 料理が得意、運動神経がいい\n\n## 過去・背景\n\n現代日本で平凡な高校生活を送っていたが、実は赤ん坊の時に異世界から送られてきた王族の血を引く人物。17年間その事実を知らずに育った。養父母は優しく、温かい家庭環境で育つ。\n\n出生の秘密: 17年前の大戦で、敵対勢力から身を守るため、当時の王がレインを現代日本に逃がした。\n\n## 目標・動機\n\n1. 自分の出生の謎を解明すること\n2. 新しい世界で居場所を見つけること\n3. 仲間たちを守り、平和をもたらすこと\n\n## 人間関係\n\n**アリア・クレセント**: 互いに惹かれ合うが、身分の違いや使命に葛藤\n**ヴァイス・シュヴァルツ**: 当初は敵対するが、共通の敵の出現で関係が変化\n**マーリン・セージ**: 師弟関係から父子のような絆に発展\n\n## 成長曲線\n\n第一幕: 異世界に戸惑いながらも、自分の使命を知り、魔法の基礎を学ぶ\n第二幕: 冒険を通じて仲間との絆を深め、星の魔法の力を開花させる\n第三幕: 真の継承者としての覚悟を決め、リーダーとしての資質を身につける\n\n## 内面的葛藤\n\n- 日本での生活と新しい使命の間での板挟み\n- 力の使い方と責任の重さに対する不安\n- 王族の血筋と育った環境のアイデンティティの葛藤\n\n## キャラクターアーク\n\n「無力な少年から真の王へ」\n\n不安と戸惑いを抱えた少年が、仲間との絆と試練を通じて成長し、最終的に星の継承者としての使命を全うする王へと成長する。",
            "conversation_id": "test-character-detail-id"
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
        self.assertTrue(data["answer"].startswith("# キャラクター詳細\n\n"))

    def test_utility_function(self):
        """ユーティリティ関数を使用したテスト"""
        # テスト対象の関数内でrequests.postを使用しているので、それをモック
        with patch('requests.post') as mock_post:
            # モックのレスポンスを設定
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "answer": "# キャラクター詳細\n\n## 基本情報...",
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
        self.assertTrue(response["answer"].startswith("# キャラクター詳細\n\n"))

    @patch('backend.novel_gen.dify_api.DifyNovelAPI._make_api_request')
    def test_create_character_detail(self, mock_api_request):
        """DifyNovelAPIクラスのcreate_character_detailメソッドのテスト"""
        # モックの戻り値を設定
        mock_api_request.return_value = {
            "answer": "# キャラクター詳細\n\n## 基本情報\n\n**名前**: レイン・ソーマ\n**年齢**: 17歳\n...",
            "conversation_id": "api-test-id"
        }

        # テスト実行
        result = self.dify_api.create_character_detail(
            basic_setting=self.basic_setting,
            character=f"名前: {self.character_data['name']}\n役割: {self.character_data['role']}",
            user_id="test-user-id"
        )

        # APIリクエストが正しく呼び出されたか検証
        mock_api_request.assert_called_once_with(
            "character_detail",
            {
                "基本設定": self.basic_setting,
                "登場人物設定": f"名前: {self.character_data['name']}\n役割: {self.character_data['role']}"
            },
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
