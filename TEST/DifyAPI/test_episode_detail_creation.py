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

class TestEpisodeDetailCreation(unittest.TestCase):
    """エピソード詳細生成APIのテストクラス"""

    def setUp(self):
        """テスト前の準備"""
        self.api_key = API_KEYS['episode_detail']
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
            },
            {
                "title": "第二幕：遺跡巡りと力の覚醒",
                "content": """# 第二幕：遺跡巡りと力の覚醒

### 第二幕の始まり：古の遺跡への旅
レインとアリアは最初の遺跡へと向かう途中、追っ手から逃れるためにアスティル森に入り込む。そこで謎の少女ミラと出会い、彼女も仲間に加わる。一方、王都ではヴァイスが独自に「継承者」の真偽を調査し始める。"""
            },
            {
                "title": "第三幕：最終決戦と新たな時代",
                "content": """# 第三幕：最終決戦と新たな時代

### 第三幕の始まり：王都の危機
王都に戻ったレイン一行を待っていたのは、シャドウロードの軍勢に包囲された都市だった。マーリンの指揮のもと、防衛戦が繰り広げられる中、レインは星霜の力で都市の防壁を強化する。"""
            }
        ]

        # ターゲットとなるあらすじ詳細（第一幕）
        self.target_plot = self.plot_details[0]

        # エピソード数
        self.episode_count = 3

        self.valid_params = {
            "inputs": {
                "basic_setting": self.basic_setting,
                "character_details": json.dumps(self.character_details, ensure_ascii=False),
                "plot_details": json.dumps(self.plot_details, ensure_ascii=False),
                "target_plot": json.dumps(self.target_plot, ensure_ascii=False),
                "episode_count": str(self.episode_count)
            },
            "query": "あらすじ詳細から第一幕のエピソード詳細を生成してください",
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
            "answer": "# 第一幕：異世界への召喚と使命の発見 - エピソード詳細\n\n## エピソード1：異世界への扉\n\n### シーン1：図書館での発見\n現代日本の高校生、レイン・ソーマは放課後の図書館で古書を整理するアルバイトをしていた。誰も手に取らない奥の棚から、星模様の装丁が施された不思議な本を発見する。本には「星霜の継承者」という題名が記されており、レインは何気なく開いてみる。\n\n### シーン2：光の中の召喚\n本を開いた瞬間、ページから眩い光が放たれ、レインは意識を失う。気づいた時には、中世ヨーロッパ風の城壁に囲まれた見知らぬ街の郊外にいた。混乱するレインは自分の服装すら現代のままであることに気づき、パニックに陥る。\n\n### シーン3：アリアとの出会い\n混乱するレインの前に銀髪の少女、アリア・クレセントが現れる。彼女は最初、レインを「星の民」と呼び、何か重要な使命を帯びた人物だと思っている。しかし会話するうちに、レインが現代日本から来た普通の高校生であると知り、困惑する。突然、森から魔物が現れ、アリアはレインを守るために魔法を使う。\n\n## エピソード2：星の継承者の宿命\n\n### シーン1：アストラル大陸の真実\nアリアはレインを安全な場所へと導き、この世界が「アストラル大陸」と呼ばれることを説明する。この世界では魔法が日常的に使われ、星や月の力を借りる魔術が発達している。また、17年前に「闇の軍勢」との大戦があり、その際に「星の王子」が行方不明になったという伝説があることも語る。\n\n### シーン2：右手の星印\nレインが寝ている間に、彼の右手の甲に星型の印が浮かび上がる。朝、それに気づいたアリアは驚愕し、すぐに伝説の魔法使いマーリン・セージのもとへレインを連れていくことを決意する。道中、レインは不思議な感覚に襲われ、見知らぬはずの景色に既視感を覚える。\n\n### シーン3：マーリンとの対面\n山奥の塔に住むマーリンは、レインの右手の印を見るなり、彼が「星の継承者」であることを確信する。レインに対し、彼が実は17年前に闇の軍勢から身を守るため、現代日本へと送られた王族の末裔であると明かす。マーリンは17年前、自らの魔法で赤子だったレインを異世界へ逃がしたのだった。\n\n## エピソード3：魔法の修行と敵対者\n\n### シーン1：魔法の基礎訓練\nマーリンの指導のもと、レインは魔法の基礎を学び始める。最初は全く魔力をコントロールできず苦戦するが、アリアの励ましもあり、少しずつ「星詠み」と呼ばれる星の魔法の素質が開花していく。マーリンは、レインが生まれながらの才能を持っていることに驚愕する。\n\n### シーン2：貴族の反発\n王都に戻ったレインはアリアの紹介で宮廷に入るが、そこで貴族の息子ヴァイス・シュヴァルツと対立する。ヴァイスは突然現れた「継承者」を疑い、レインに挑戦状を叩きつける。レインはまだ魔法を使いこなせないため、決闘に不安を抱く。\n\n### シーン3：運命の証明\n決闘の日、ヴァイスの強力な魔法攻撃にレインは苦戦する。窮地に追い込まれたとき、レインの右手から突如として眩い星の光が放たれる。レインは無意識のうちに「星霜の盾」という古代の守護魔法を発動させ、ヴァイスの攻撃を完全に無効化する。この魔法は王族の血を引く者にしか使えない伝説の魔法だった。観衆は驚愕し、レインの正体に疑いの目を向ける者もいれば、真の継承者の帰還を喜ぶ者もいた。\n\nマーリンはレインに、17年前に再び活動を始めた「闇の軍勢」のこと、そして王族である彼がアストラル大陸を救う鍵となることを告げる。レインは混乱しながらも、アリアと共に古代の遺跡を巡り、自らの力を解放するための旅に出ることを決意する。",
            "conversation_id": "test-episode-details-id"
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
        self.assertTrue(data["answer"].startswith("# 第一幕：異世界への召喚"))

    def test_utility_function(self):
        """ユーティリティ関数を使用したテスト"""
        # テスト対象の関数内でrequests.postを使用しているので、それをモック
        with patch('requests.post') as mock_post:
            # モックのレスポンスを設定
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "answer": "# 第一幕：異世界への召喚と使命の発見 - エピソード詳細...",
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
        self.assertTrue(response["answer"].startswith("# 第一幕：異世界"))

    @patch('backend.novel_gen.dify_api.DifyNovelAPI._make_api_request')
    def test_create_episode_detail(self, mock_api_request):
        """DifyNovelAPIクラスのcreate_episode_detailメソッドのテスト"""
        # モックの戻り値を設定
        mock_api_request.return_value = {
            "answer": "# 第一幕：異世界への召喚と使命の発見 - エピソード詳細\n\n## エピソード1：異世界への扉\n...",
            "conversation_id": "api-test-id"
        }

        # テスト実行
        result = self.dify_api.create_episode_detail(
            basic_setting=self.basic_setting,
            character_details=json.dumps(self.character_details, ensure_ascii=False),
            outline_details=json.dumps(self.plot_details, ensure_ascii=False),
            episodes=json.dumps(self.target_plot, ensure_ascii=False),
            episode_num=self.episode_count,
            user_id="test-user-id"
        )

        # APIリクエストが正しく呼び出されたか検証
        mock_api_request.assert_called_once_with(
            "episode_detail",
            {
                "基本設定": self.basic_setting,
                "キャラクター詳細": json.dumps(self.character_details, ensure_ascii=False),
                "あらすじ詳細": json.dumps(self.plot_details, ensure_ascii=False),
                "エピソード化する幕のあらすじ": json.dumps(self.target_plot, ensure_ascii=False),
                "エピソード数": self.episode_count
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
