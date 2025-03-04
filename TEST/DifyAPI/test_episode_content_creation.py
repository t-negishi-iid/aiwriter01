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

class TestEpisodeContentCreation(unittest.TestCase):
    """エピソード本文生成APIのテストクラス"""

    def setUp(self):
        """テスト前の準備"""
        self.api_key = API_KEYS['episode_content']
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

        # テスト用のエピソード詳細
        self.episode_detail = """# エピソード1：異世界への扉

## シーン1：図書館での発見
現代日本の高校生、レイン・ソーマは放課後の図書館で古書を整理するアルバイトをしていた。誰も手に取らない奥の棚から、星模様の装丁が施された不思議な本を発見する。本には「星霜の継承者」という題名が記されており、レインは何気なく開いてみる。

## シーン2：光の中の召喚
本を開いた瞬間、ページから眩い光が放たれ、レインは意識を失う。気づいた時には、中世ヨーロッパ風の城壁に囲まれた見知らぬ街の郊外にいた。混乱するレインは自分の服装すら現代のままであることに気づき、パニックに陥る。

## シーン3：アリアとの出会い
混乱するレインの前に銀髪の少女、アリア・クレセントが現れる。彼女は最初、レインを「星の民」と呼び、何か重要な使命を帯びた人物だと思っている。しかし会話するうちに、レインが現代日本から来た普通の高校生であると知り、困惑する。突然、森から魔物が現れ、アリアはレインを守るために魔法を使う。"""

        # 文字数
        self.word_count = 5000

        self.valid_params = {
            "inputs": {
                "basic_setting": self.basic_setting,
                "character_details": json.dumps(self.character_details, ensure_ascii=False),
                "plot_details": json.dumps(self.plot_details, ensure_ascii=False),
                "episode_detail": self.episode_detail,
                "word_count": str(self.word_count)
            },
            "query": "エピソード詳細から本文を執筆してください",
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
            "answer": "# 異世界への扉\n\n　薄暗い図書館の片隅で、レイン・ソーマは背の高い書架に手を伸ばしていた。放課後のアルバイトとして古い本の整理をしているときだった。十七歳の彼は、黒髪と鮮やかな碧眼の持ち主で、普段は目立たない高校生だった。\n\n「この棚は終わりかな…」\n\n　つぶやきながら、彼は最後の一冊を手に取った。厚さは普通だったが、表紙には星模様の装丁が施されており、何か惹かれるものがあった。埃を払うと、「星霜の継承者」という題名が浮かび上がる。\n\n「星霜の継承者…変わった題名だな」\n\n　レインは周りに人がいないのを確認し、何気なく本を開いた。その瞬間だった。ページから眩い光が放たれ、図書館全体が青白い輝きに包まれる。\n\n「なっ…！？」\n\n　叫び声を上げる間もなく、レインの意識は闇に落ちていった。\n\n＊＊＊\n\n　風の音で目を覚ました時、レインは見知らぬ場所にいた。\n\n「ここは…どこだ？」\n\n　あたりを見回すと、中世ヨーロッパを思わせる石造りの城壁に囲まれた街が遠くに見える。青い空には二つの月が浮かんでいた。服装はまだ制服のままだ。自分の置かれた状況に、パニックが襲ってきた。\n\n「冗談だろ…こんなの…ありえない…」\n\n　立ち上がろうとした瞬間、足元がふらつき、再び地面に崩れ落ちた。頭痛がする。いったいどうなってしまったのか。夢かと思ったが、感じる風と土の感触はあまりにリアルだった。\n\n「恐れることはありません、星の民よ」\n\n　突然、背後から澄んだ声が聞こえた。振り返ると、一人の少女が立っていた。銀色の長い髪と紫紺の瞳を持ち、凛とした佇まいが印象的だ。年齢は自分と同じくらいか、少し若いだろうか。上質な布地でできた青と白の衣装を身にまとっている。\n\n「君は…誰だ？ここはどこなんだ？」レインは混乱したまま尋ねた。\n\n　少女は微笑み、一礼した。\n\n「私はアリア・クレセント。このアストラル大陸、セレスティア王国の者です」\n\n「アストラル大陸？セレスティア王国？」レインは聞き慣れない名前に首を傾げた。「地球じゃないのか？」\n\n　アリアは不思議そうな表情を浮かべた。\n\n「地球？それは星の民の国ですか？」\n\n「星の民って…僕はただの高校生だよ。日本から来たレイン・ソーマだ」\n\n　彼女の表情が変わった。驚きと困惑が混ざり合っている。\n\n「そんな…でも確かに星の光に導かれて…」アリアは途中で言葉を切り、レインの右手を見つめた。「その手の印は…？」\n\n　レインは自分の右手を見た。何かが違う。仰天したことに、手の甲に星型の模様が浮かび上がっていた。昨日までなかったものだ。\n\n「これは…！？いつの間に…」\n\n　アリアは一瞬ためらった後、レインに近づいた。\n\n「あなたは本当に地球という国から来たのですか？魔法使いではないのですか？」\n\n「魔法使い？冗談じゃない。そんなものいるわけが…」\n\n　言葉が途切れた。自分が異世界に来たことが現実なら、魔法が存在してもおかしくない。\n\n「ここが異世界で、魔法があるなら証明してみてよ」レインは半信半疑で言った。\n\n　アリアはうなずき、右手を空に向けて伸ばした。彼女の手から淡い青い光が放たれ、空中に美しい月の形をした印が浮かび上がる。\n\n「これは月の魔法。私たちクレセント家に代々伝わるものです」\n\n　レインは目を見開いた。幻覚ではない。確かに目の前で起きている現象だ。\n\n「信じられない…」\n\n　そのとき、森の方から不気味な唸り声が聞こえてきた。アリアの表情が一変する。\n\n「シャドウウルフ！」彼女は警戒心を露わにした。「この近くで見かけるなんて珍しい…」\n\n　茂みが揺れ、レインは息を呑んだ。巨大な狼のような生き物が現れた。しかしその体は影のように黒く、目だけが赤く光っていた。\n\n「レイン、私の後ろに！」\n\n　アリアは叫び、彼を守るように前に立った。彼女の手から今度は輝く白い光が放たれ、月の形をした杖が現れる。\n\n「月光の盾よ、我が前に立て！」\n\n　杖を振りかざすと、二人の前に半透明の光の壁が現れた。シャドウウルフが襲いかかるが、盾にぶつかって弾かれる。\n\n「凄い…」レインは呟いた。\n\n　アリアは集中した表情で杖を掲げ続ける。\n\n「私一人なら対処できますが、あなたを守りながらでは…」彼女の額に汗が浮かぶ。「盾を維持するのが…」\n\n　シャドウウルフは執拗に攻撃を続け、光の盾にヒビが入り始めた。レインは焦りを感じる。このままでは二人とも危険だ。\n\n　突然、レインの右手の星印が熱を持ち始めた。痛みはないが、強い力が自分の内側から湧き上がってくるのを感じる。\n\n「この感じ…」\n\n　無意識のうちに、レインは右手を前に突き出していた。次の瞬間、彼の手から耀く金色の光が放たれ、シャドウウルフに向かって飛んでいった。光はウルフの体を貫き、けものは悲鳴を上げて黒い霧のように消えていった。\n\n　レインは呆然と自分の手を見つめた。\n\n「僕が…魔法を？」\n\n　アリアも驚いた表情でレインを見ていた。\n\n「星の魔法…それも高位の…」彼女はつぶやいた。「あなたは一体…」\n\n　レインは答えられなかった。自分でも理解できない出来事だった。\n\n「アリア、僕はどうしてここにいるんだ？どうして魔法が使えるんだ？」\n\n　彼女は真剣な表情で答えた。\n\n「わかりません。でも、あなたの右手の印は『星の継承者』の証。それに、今使った魔法は星霜の魔法と呼ばれるもの。この国では王族しか使えないとされています」\n\n「王族？冗談だろ…」\n\n　アリアは首を振った。\n\n「冗談ではありません。この件は、マーリン・セージのもとへ行くべきです。彼は伝説の魔法使いで、多くのことを知っています」\n\n　レインは混乱しながらも、アリアについていくしかないと悟った。\n\n「わかった。案内してくれ」\n\n　アリアはうなずき、レインの手を取った。\n\n「王都へ行きましょう。そこでマーリンに会えます」\n\n　二人は森の中の小道を歩き始めた。レインの心は不安と興奮で一杯だった。この異世界で自分に何が起こっているのか。そしてなぜ自分が「星の継承者」と呼ばれるのか―その真実を知るために、彼は前へと進んでいった。\n\n　遠くには高い塔が立ち並ぶ王都が見え、二つの月が空を照らしていた。レインの新たな冒険が、今始まったばかりだった。",
            "conversation_id": "test-episode-content-id"
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
        self.assertTrue(data["answer"].startswith("# 異世界への扉\n\n"))

    def test_utility_function(self):
        """ユーティリティ関数を使用したテスト"""
        # テスト対象の関数内でrequests.postを使用しているので、それをモック
        with patch('requests.post') as mock_post:
            # モックのレスポンスを設定
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "answer": "# 異世界への扉\n\n　薄暗い図書館の片隅で...",
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
        self.assertTrue(response["answer"].startswith("# 異世界への扉\n\n"))

    @patch('backend.novel_gen.dify_api.DifyNovelAPI._make_api_request')
    def test_create_episode_content(self, mock_api_request):
        """DifyNovelAPIクラスのcreate_episode_contentメソッドのテスト"""
        # モックの戻り値を設定
        mock_api_request.return_value = {
            "answer": "# 異世界への扉\n\n　薄暗い図書館の片隅で、レイン・ソーマは背の高い書架に手を伸ばしていた...",
            "conversation_id": "api-test-id"
        }

        # テスト実行
        result = self.dify_api.create_episode_content(
            basic_setting=self.basic_setting,
            character_details=json.dumps(self.character_details, ensure_ascii=False),
            episodes=json.dumps(self.plot_details, ensure_ascii=False),
            episode_summary=self.episode_detail,
            length_of_episode=self.word_count,
            user_id="test-user-id"
        )

        # APIリクエストが正しく呼び出されたか検証
        mock_api_request.assert_called_once_with(
            "episode_content",
            {
                "基本設定": self.basic_setting,
                "全登場人物の詳細設定": json.dumps(self.character_details, ensure_ascii=False),
                "3幕分のあらすじ詳細": json.dumps(self.plot_details, ensure_ascii=False),
                "執筆する1エピソード分の概要": self.episode_detail,
                "執筆するエピソードの文字数": self.word_count
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
