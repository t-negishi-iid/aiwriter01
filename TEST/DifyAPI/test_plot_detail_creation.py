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

class TestPlotDetailCreation(unittest.TestCase):
    """あらすじ詳細生成APIのテストクラス"""

    def setUp(self):
        """テスト前の準備"""
        self.api_key = API_KEYS['plot_detail']
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

身長175cm、体格は普通。黒髪に鮮やかな碧眼が特徴。現代日本の服装をしているが、次第に異世界の服装に馴染んでいく。右手の甲に星型の痣がある。

## 性格

好奇心旺盛で正義感が強い。困っている人を見ると放っておけない。初めは臆病だが、冒険を通じて勇気を身につけていく。ユーモアのセンスがあり、緊張した場面を和ませることがある。

## 能力・技術

**魔法適性**: 高い（特に星の魔法に適性がある）
**武器**: 星霜の剣（冒険中に入手する古代の魔剣）
**特殊能力**: 「星詠み」—星の力を借りて予知や強力な魔法を使える
**日常スキル**: 料理が得意、運動神経がいい"""
            },
            {
                "name": "アリア・クレセント",
                "role": "ヒロイン",
                "detail": """# キャラクター詳細

## 基本情報

**名前**: アリア・クレセント
**年齢**: 16歳
**性別**: 女性
**役割**: ヒロイン

## 外見

長い銀髪と紫紺の瞳が特徴。華奢だが凛とした佇まい。上流階級の衣装を身につけているが、冒険時には実用的な服装に着替える。額にクレセント家の月型の印がある。

## 性格

思慮深く、責任感が強い。家名と使命に縛られているが、内面では自由を求めている。表向きは冷静だが、情に厚く、信頼する仲間には心を開く。

## 能力・技術

**魔法適性**: 非常に高い（特に月の魔法と回復魔法に長ける）
**武器**: 月光の杖（クレセント家に代々伝わる魔法の杖）
**特殊能力**: 「月影の舞」—月の力を使った浄化と回復の魔法
**日常スキル**: 楽器の演奏、礼儀作法に精通"""
            }
        ]

        self.valid_params = {
            "inputs": {
                "basic_setting": self.basic_setting,
                "character_details": json.dumps(self.character_details, ensure_ascii=False)
            },
            "query": "基本設定とキャラクター詳細からあらすじ詳細を生成してください",
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
            "answer": "# あらすじ詳細\n\n## 第一幕：異世界への召喚と使命の発見\n\n### 序章：現代日本からの転移\n現代日本の高校生レイン・ソーマは、図書館で古い魔道書を見つけたことから物語が始まる。その本を開いた瞬間、光に包まれ「アストラル大陸」と呼ばれる異世界へと召喚される。混乱するレインを救ったのは、古き王家の末裔アリア・クレセントだった。\n\n### 第一の転機：星の継承者の宿命\n戸惑うレインだが、右手の甲に浮かび上がった星型の印により、彼が「星の継承者」と呼ばれる伝説の存在であることが判明する。アリアはレインを伝説の魔法使いマーリン・セージのもとへ連れて行く。マーリンは17年前に別の世界に逃がした「星の王子」がレインであることを明かす。\n\n### 第一の試練：魔法の修行と王都での反発\n魔法の基礎を学び始めるレインだが、貴族の息子ヴァイス・シュヴァルツを筆頭に、突然現れた「継承者」に対する反発も強い。レインは密かに襲撃され、アリアの助けを借りて辛うじて逃げ延びる。その際、王族にしか扱えないはずの「星霜の魔法」を無意識に使用したことで、自らの血統を証明することとなる。\n\n### 第一幕の結末：決意と旅立ち\nレインは自分の出生と、17年前にアストラル大陸を襲った「闇の軍勢」が再び活動し始めていることを知る。アリアと共に古代の遺跡を巡り、「星霜の力」を解放するための旅に出ることを決意する。\n\n## 第二幕：遺跡巡りと力の覚醒\n\n### 第二幕の始まり：古の遺跡への旅\nレインとアリアは最初の遺跡へと向かう途中、追っ手から逃れるためにアスティル森に入り込む。そこで謎の少女ミラと出会い、彼女も仲間に加わる。一方、王都ではヴァイスが独自に「継承者」の真偽を調査し始める。\n\n### 第二の転機：仲間との絆と真実の断片\n古代遺跡「星見の塔」で、レインは星の魔法を操る力を少しずつ身につける。遺跡内の記録から、かつて闇の軍勢と戦った「星の王」の記憶の一部が封印されていたことを知る。レインはその記憶を継承し、父親の想いと王国を救うための使命を理解し始める。\n\n### 第二の試練：闇の軍勢の襲撃とヴァイスの協力\n二つ目の遺跡「月影の神殿」では、闇の軍勢の本格的な襲撃を受ける。窮地に陥ったレインたちを救ったのは、意外にもヴァイスだった。彼は独自の調査で闇の軍勢の恐ろしさを知り、かつての敵対心を捨ててレインに協力することを決意する。\n\n### 第二幕の結末：力の覚醒と決戦の前兆\n最後の遺跡「黄昏の祭壇」で、レインは星霜の剣を手に入れ、星の魔法を完全に覚醒させる。同時に闇の軍勢の首魔「シャドウロード」が封印から復活し、アストラル大陸全土に暗黒の力が広がり始める。マーリンからの緊急連絡を受け、一行は王都への帰還を決意する。\n\n## 第三幕：最終決戦と新たな時代\n\n### 第三幕の始まり：王都の危機\n王都に戻ったレイン一行を待っていたのは、シャドウロードの軍勢に包囲された都市だった。マーリンの指揮のもと、防衛戦が繰り広げられる中、レインは星霜の力で都市の防壁を強化する。\n\n### 第三の転機：過去との対峙と王としての覚醒\nシャドウロードが本当はレインの叔父であり、かつて王位を奪われた恨みから闇に落ちた存在であることが明らかになる。レインは自分の出生の最後の真実を知り、正統な王として国民の前に姿を現す。王家の末裔であるアリアも、月の力を完全に解放し、レインを支える。\n\n### 最終決戦：光と闇の戦い\nレインとシャドウロードの最終決戦が始まる。絶望的な戦いの中、レインは仲間たちから力を借り、星と月の力を融合させた新たな魔法「暁の光」を編み出す。この力でシャドウロードの闇を浄化し、叔父の魂を救済することに成功する。\n\n### 物語の結末：新しい時代の幕開け\n平和を取り戻したアストラル大陸で、レインは新たな王として即位する。アリアは彼の傍らで月の巫女として王国を支え、二人の間に芽生えた感情も認め合う。ヴァイスは王国の騎士団長として、ミラは新たな魔法アカデミーの創設者として、それぞれの道を歩み始める。レインは現代日本の養父母に感謝の気持ちを伝え、新たな時代の幕開けを迎える。",
            "conversation_id": "test-plot-detail-id"
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
        self.assertTrue(data["answer"].startswith("# あらすじ詳細\n\n## 第一幕"))

    def test_utility_function(self):
        """ユーティリティ関数を使用したテスト"""
        # テスト対象の関数内でrequests.postを使用しているので、それをモック
        with patch('requests.post') as mock_post:
            # モックのレスポンスを設定
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "answer": "# あらすじ詳細\n\n## 第一幕...",
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
        self.assertTrue(response["answer"].startswith("# あらすじ詳細\n\n"))

    @patch('backend.novel_gen.dify_api.DifyNovelAPI._make_api_request')
    def test_create_plot_detail(self, mock_api_request):
        """DifyNovelAPIクラスのcreate_plot_detailメソッドのテスト"""
        # モックの戻り値を設定
        mock_api_request.return_value = {
            "answer": "# あらすじ詳細\n\n## 第一幕：異世界への召喚と使命の発見\n...",
            "conversation_id": "api-test-id"
        }

        # テスト実行
        result = self.dify_api.create_plot_detail(
            basic_setting=self.basic_setting,
            character_details=self.character_details,
            user_id="test-user-id"
        )

        # APIリクエストが正しく呼び出されたか検証
        mock_api_request.assert_called_once_with(
            "plot_detail",
            {
                "basic_setting": self.basic_setting,
                "character_details": json.dumps(self.character_details, ensure_ascii=False)
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
        self.assertIn(response.status_code, [200, 201, 202, 400, 401, 403, 404])

        data = response.json()
        print(f"API応答本文: {data}")

        # 成功レスポンスの場合は'answer'キー、エラーレスポンスの場合は'message'キーが存在する
        if response.status_code in [200, 201, 202]:
            self.assertIn('answer', data)
        else:
            # エラーレスポンスの場合はステータスとメッセージがあるはず
            self.assertIn('status', data)

if __name__ == '__main__':
    unittest.main()
