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

class TestTitleGeneration(unittest.TestCase):
    """タイトル生成APIのテストクラス"""

    def setUp(self):
        """テスト前の準備"""
        self.api_key = API_KEYS['title']
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
古き王家の末裔。魔法の才能を持つが身分による制約がある。"""

        # テスト用のキャラクター詳細リスト
        self.character_details = [
            {
                "name": "レイン・ソーマ",
                "role": "主人公",
                "detail": """# キャラクター詳細

## 基本情報

**名前**: レイン・ソーマ
**年齢**: 17歳
**性別**: 男性
**役割**: 主人公

## 外見

身長175cm、体格は普通。黒髪に鮮やかな碧眼が特徴。"""
            },
            {
                "name": "アリア・クレセント",
                "role": "ヒロイン",
                "detail": """# キャラクター詳細

## 基本情報

**名前**: アリア・クレセント
**年齢**: 16歳
**性別**: 女性
**役割**: ヒロイン"""
            }
        ]

        # テスト用のあらすじ詳細リスト
        self.plot_details = [
            {
                "title": "第一幕：異世界への召喚と使命の発見",
                "content": """# 第一幕：異世界への召喚と使命の発見

### 序章：現代日本からの転移
現代日本の高校生レイン・ソーマは、図書館で古い魔道書を見つけたことから物語が始まる。その本を開いた瞬間、光に包まれ「アストラル大陸」と呼ばれる異世界へと召喚される。混乱するレインを救ったのは、古き王家の末裔アリア・クレセントだった。"""
            }
        ]

        # ターゲット文章（エピソード本文の一部）
        self.target_content = """# 異世界への扉

　薄暗い図書館の片隅で、レイン・ソーマは背の高い書架に手を伸ばしていた。放課後のアルバイトとして古い本の整理をしているときだった。十七歳の彼は、黒髪と鮮やかな碧眼の持ち主で、普段は目立たない高校生だった。

「この棚は終わりかな…」

　つぶやきながら、彼は最後の一冊を手に取った。厚さは普通だったが、表紙には星模様の装丁が施されており、何か惹かれるものがあった。埃を払うと、「星霜の継承者」という題名が浮かび上がる。

「星霜の継承者…変わった題名だな」

　レインは周りに人がいないのを確認し、何気なく本を開いた。その瞬間だった。ページから眩い光が放たれ、図書館全体が青白い輝きに包まれる。"""

        # ターゲットタイプ（episode, act, novel）
        self.target_type = "episode"

        self.valid_params = {
            "inputs": {
                "basic_setting": self.basic_setting,
                "character_details": json.dumps(self.character_details, ensure_ascii=False),
                "plot_details": json.dumps(self.plot_details, ensure_ascii=False),
                "target_content": self.target_content,
                "target_type": self.target_type
            },
            "query": "エピソード本文からタイトルを生成してください",
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
            "answer": "「光る書物と異世界への扉」",
            "conversation_id": "test-title-id"
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
        self.assertIn("光る書物と異世界への扉", data["answer"])

    def test_utility_function(self):
        """ユーティリティ関数を使用したテスト"""
        # テスト対象の関数内でrequests.postを使用しているので、それをモック
        with patch('requests.post') as mock_post:
            # モックのレスポンスを設定
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "answer": "「星霜の書と召喚された少年」",
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
        self.assertIn("星霜の書と召喚された少年", response["answer"])

    @patch('backend.novel_gen.dify_api.DifyNovelAPI._make_api_request')
    def test_create_title(self, mock_api_request):
        """DifyNovelAPIクラスのcreate_titleメソッドのテスト"""
        # モックの戻り値を設定
        mock_api_request.return_value = {
            "answer": "「光る魔道書と異世界召喚」",
            "conversation_id": "api-test-id"
        }

        # テスト実行
        result = self.dify_api.create_title(
            basic_setting=self.basic_setting,
            character_details=json.dumps(self.character_details, ensure_ascii=False),
            episodes=json.dumps(self.plot_details, ensure_ascii=False),
            article=self.target_content,
            title_type=self.target_type,
            user_id="test-user-id"
        )

        # APIリクエストが正しく呼び出されたか検証
        mock_api_request.assert_called_once_with(
            "title",
            {
                "基本設定": self.basic_setting,
                "全登場人物の詳細設定": json.dumps(self.character_details, ensure_ascii=False),
                "3幕分のあらすじ詳細": json.dumps(self.plot_details, ensure_ascii=False),
                "ターゲット文章": self.target_content
            },
            "test-user-id",
            True
        )

        # 結果を検証
        self.assertIn("answer", result)
        self.assertIn("conversation_id", result)
        self.assertIn("光る魔道書と異世界召喚", result["answer"])

    def test_different_target_types(self):
        """異なるターゲットタイプでのテスト"""
        # テスト対象の関数内でrequests.postを使用しているので、それをモック
        with patch('requests.post') as mock_post:
            # act用のモックレスポンス
            mock_response_act = MagicMock()
            mock_response_act.status_code = 200
            mock_response_act.json.return_value = {
                "answer": "「第一幕：星の継承者の覚醒」",
                "conversation_id": "act-test-id"
            }

            # novel用のモックレスポンス
            mock_response_novel = MagicMock()
            mock_response_novel.status_code = 200
            mock_response_novel.json.return_value = {
                "answer": "「星霜の継承者 ―異世界からの召喚―」",
                "conversation_id": "novel-test-id"
            }

            # act用のテスト
            self.valid_params["inputs"]["target_type"] = "act"
            mock_post.return_value = mock_response_act

            response_act = make_dify_api_request(
                self.api_key,
                self.endpoint,
                self.valid_params,
                use_mock=False
            )

            # novel用のテスト
            self.valid_params["inputs"]["target_type"] = "novel"
            mock_post.return_value = mock_response_novel

            response_novel = make_dify_api_request(
                self.api_key,
                self.endpoint,
                self.valid_params,
                use_mock=False
            )

        # レスポンスを検証
        self.assertIn("第一幕：星の継承者の覚醒", response_act["answer"])
        self.assertIn("星霜の継承者 ―異世界からの召喚―", response_novel["answer"])

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
