#!/usr/bin/env python
# -*- coding: utf-8 -*-

import requests
import json
import logging
import os
from typing import Dict, Any, Optional, Union, Generator

# ロガーの設定
logger = logging.getLogger('novel_gen')

class DifyAPI:
    """Dify APIとの通信を行うクラス"""

    def __init__(self, api_key: str, endpoint: str = "https://api.dify.ai/v1/workflows/run"):
        """
        初期化

        Args:
            api_key: APIキー
            endpoint: APIエンドポイント
        """
        self.api_key = api_key
        self.endpoint = endpoint
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    def make_request(self,
                    inputs: Dict[str, Any],
                    query: str,
                    response_mode: str = "blocking",
                    conversation_id: Optional[str] = None,
                    user: Optional[str] = None,
                    timeout: int = 60) -> Union[Dict[str, Any], requests.Response]:
        """
        APIリクエストを送信

        Args:
            inputs: 入力パラメータ
            query: クエリ文字列
            response_mode: レスポンスモード ("blocking" or "streaming")
            conversation_id: 会話ID (省略可)
            user: ユーザーID (省略可)
            timeout: タイムアウト秒数

        Returns:
            APIレスポンス（辞書またはレスポンスオブジェクト）
        """
        data = {
            "inputs": inputs,
            "query": query,
            "response_mode": response_mode
        }

        if conversation_id:
            data["conversation_id"] = conversation_id

        if user:
            data["user"] = user

        try:
            response = requests.post(
                self.endpoint,
                headers=self.headers,
                json=data,
                timeout=timeout,
                stream=(response_mode == "streaming")
            )
            response.raise_for_status()

            if response_mode == "streaming":
                return response  # ストリーミングの場合はレスポンスオブジェクトを返す
            else:
                return response.json()

        except requests.RequestException as e:
            logger.error(f"Dify API request failed: {str(e)}")
            error_info = {
                "error": str(e),
                "status_code": getattr(e.response, 'status_code', None),
                "response_text": getattr(e.response, 'text', None) if hasattr(e, 'response') else None
            }
            return error_info

    def process_streaming(self, response: requests.Response) -> Generator[Dict[str, str], None, str]:
        """
        ストリーミングレスポンスを処理

        Args:
            response: ストリーミングレスポンス

        Yields:
            チャンクごとのデータと完全なテキスト

        Returns:
            最終的な完全なテキスト
        """
        buffer = ""
        for line in response.iter_lines():
            if line:
                line = line.decode('utf-8')
                if line.startswith('data:'):
                    data = json.loads(line[5:])
                    if 'answer' in data:
                        buffer += data['answer']
                        yield {'chunk': data['answer'], 'full_text': buffer}
        return buffer


class DifyNovelAPI:
    """小説執筆支援用のDify APIラッパークラス"""

    # APIキーの辞書
    API_KEYS = {
        "basic_setting_data": "app-RVzFPhndqQyflqMxkmBAx8uV",
        "basic_setting": "app-X1e1XPXOKzot8lWteTdVCgey",
        "character_detail": "app-zd3lFB9WVQNBY6jMhyI6mJPl",
        "plot_detail": "app-PYmSirQZfKrIE7mK0dtgBCww",
        "episode_detail": "app-BCSZGXvGxReumppDeWaYD8CM",
        "episode_content": "app-J845W1BSeaOD3z4hKVGQ5aQu",
        "title": "app-wOwBxUnKb9kA8BYqQinc8Mb9"
    }

    # クレジット消費量の辞書
    CREDIT_COSTS = {
        "basic_setting_data": 0,
        "basic_setting": 1,
        "character_detail": 2,
        "plot_detail": 2,
        "episode_detail": 3,
        "episode_content": 4,
        "title_episode": 1,
        "title_act": 1,
        "title_novel": 3
    }

    def __init__(self, endpoint: str = "https://api.dify.ai/v1/workflows/run"):
        """
        初期化

        Args:
            endpoint: APIエンドポイント
        """
        self.endpoint = endpoint
        # 環境変数からAPIキーを読み込む場合は以下のように実装
        # self.API_KEYS = {
        #     "basic_setting_data": os.getenv("DIFY_API_KEY_BASIC_SETTING_DATA"),
        #     ...
        # }

    def _make_api_request(self, api_type: str, inputs: Dict[str, Any], user_id: Optional[str] = None, check_credit: bool = False) -> Dict[str, Any]:
        """
        APIリクエストを実行する内部メソッド

        Args:
            api_type: API種別（キー取得用）
            inputs: 入力パラメータ
            user_id: ユーザーID
            check_credit: クレジットチェックを行うかどうか

        Returns:
            APIレスポンス（辞書型）
        """
        # クレジットのチェック
        if check_credit and user_id:
            if not self.check_credit(user_id, api_type):
                return {"error": "クレジット不足", "status_code": 400}

        api_key = self.API_KEYS.get(api_type)
        if not api_key:
            return {"error": f"無効なAPI種別: {api_type}", "status_code": 400}

        api = DifyAPI(api_key, self.endpoint)

        # APIによって適切なクエリを選択
        query_map = {
            "basic_setting_data": "これらの設定から基本設定作成用データを作成してください",
            "basic_setting": "基本設定作成用データから基本設定を作成してください",
            "character_detail": "基本設定からキャラクター詳細を生成してください",
            "plot_detail": "基本設定とキャラクター詳細からあらすじ詳細を生成してください",
            "episode_detail": "あらすじ詳細から第一幕のエピソード詳細を生成してください",
            "episode_content": "エピソード詳細から本文を執筆してください",
            "title": "コンテンツにふさわしいタイトルを生成してください"
        }

        query = query_map.get(api_type, "リクエスト処理を行います")

        # ブロッキングモードで実行
        response = api.make_request(
            inputs=inputs,
            query=query,
            response_mode="blocking"
        )

        # レスポンスのログ記録
        logger.debug(f"API response: {json.dumps(response, ensure_ascii=False, indent=2)}")
        return response

    def create_basic_setting_data(self, inputs: Dict[str, Any], user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        基本設定作成用データを作成

        Args:
            inputs: 入力パラメータ（主題、時代と場所など）
            user_id: ユーザーID（省略可）

        Returns:
            APIレスポンス
        """
        # 入力パラメータのマッピング
        api_inputs = {
            "theme": inputs.get("theme", ""),
            "time_and_place": inputs.get("time_and_place", ""),
            "works_settings": inputs.get("works_settings", ""),
            "love_expression": inputs.get("love_expression", ""),
            "emotion_expression": inputs.get("emotion_expression", ""),
            "mood_expression": inputs.get("mood_expression", ""),
            "sensual_expression": inputs.get("sensual_expression", ""),
            "mentality_expression": inputs.get("mentality_expression", ""),
            "social_expression": inputs.get("social_expression", ""),
            "past_mystery": inputs.get("past_mystery", ""),
            "plot_pattern": inputs.get("plot_pattern", "")
        }

        return self._make_api_request(
            "basic_setting_data",
            api_inputs,
            user_id,
            True
        )

    def create_basic_setting(self, basic_setting_data: str, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        基本設定を作成

        Args:
            basic_setting_data: 基本設定作成用データ
            user_id: ユーザーID（省略可）

        Returns:
            APIレスポンス（辞書型）
        """
        return self._make_api_request(
            "basic_setting",
            {"基本設定作成用データ": basic_setting_data},
            user_id,
            True
        )

    def create_character_detail(self, basic_setting: str, character: str, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        キャラクター詳細を作成

        Args:
            basic_setting: 基本設定
            character: 登場人物設定（1人分）
            user_id: ユーザーID（省略可）

        Returns:
            APIレスポンス（辞書型）
        """
        return self._make_api_request(
            "character_detail",
            {
                "基本設定": basic_setting,
                "登場人物設定": character
            },
            user_id,
            True
        )

    def create_plot_detail(self, basic_setting: str, character_details: list, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        あらすじ詳細を作成

        Args:
            basic_setting: 基本設定
            character_details: 全登場人物の詳細設定（リスト形式）
            user_id: ユーザーID（省略可）

        Returns:
            APIレスポンス（辞書型）
        """
        # テスト対応: JSONの文字列が渡されていればリストに変換
        if isinstance(character_details, str):
            try:
                character_details_data = json.loads(character_details)
            except:
                character_details_data = character_details
        else:
            character_details_data = character_details

        return self._make_api_request(
            "plot_detail",
            {
                "basic_setting": basic_setting,
                "character_details": json.dumps(character_details_data, ensure_ascii=False)
            },
            user_id,
            True
        )

    def create_episode_detail(self, basic_setting: str, character_details: str,
                             outline_details: str, episodes: str, episode_num: int,
                             user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        幕内エピソード詳細を作成

        Args:
            basic_setting: 基本設定
            character_details: 全登場人物の詳細設定
            outline_details: 3幕分のあらすじ詳細
            episodes: エピソード化する1幕分のあらすじ
            episode_num: エピソード数
            user_id: ユーザーID（省略可）

        Returns:
            APIレスポンス（辞書型）
        """
        return self._make_api_request(
            "episode_detail",
            {
                "基本設定": basic_setting,
                "キャラクター詳細": character_details,
                "あらすじ詳細": outline_details,
                "エピソード化する幕のあらすじ": episodes,
                "エピソード数": episode_num
            },
            user_id,
            True
        )

    def create_episode_content(self, basic_setting: str, character_details: str,
                              episodes: str, episode_summary: str, length_of_episode: int,
                              user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        エピソード本文を執筆

        Args:
            basic_setting: 基本設定
            character_details: 全登場人物の詳細設定
            episodes: 3幕分のあらすじ詳細
            episode_summary: 執筆する1エピソード分の概要
            length_of_episode: 執筆するエピソードの文字数
            user_id: ユーザーID（省略可）

        Returns:
            APIレスポンス（辞書型）
        """
        return self._make_api_request(
            "episode_content",
            {
                "基本設定": basic_setting,
                "全登場人物の詳細設定": character_details,
                "3幕分のあらすじ詳細": episodes,
                "執筆する1エピソード分の概要": episode_summary,
                "執筆するエピソードの文字数": length_of_episode
            },
            user_id,
            True
        )

    def create_title(self, basic_setting: str, character_details: str,
                    episodes: str, article: str, title_type: str = "title_episode",
                    user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        タイトルを作成

        Args:
            basic_setting: 基本設定
            character_details: 全登場人物の詳細設定
            episodes: 3幕分のあらすじ詳細
            article: タイトルを生成するテキスト（エピソード本文など）
            title_type: タイトルの種類（"title_episode", "title_act", "title_novel"）
            user_id: ユーザーID（省略可）

        Returns:
            APIレスポンス（辞書型）
        """
        return self._make_api_request(
            "title",
            {
                "基本設定": basic_setting,
                "全登場人物の詳細設定": character_details,
                "3幕分のあらすじ詳細": episodes,
                "ターゲット文章": article
            },
            user_id,
            True
        )

    def check_credit(self, user_id: int, api_type: str) -> bool:
        """
        クレジットの確認と消費

        Args:
            user_id: ユーザーID
            api_type: API種別

        Returns:
            クレジットが十分にある場合はTrue、そうでない場合はFalse
        """
        # ここでユーザーのクレジット確認と消費の処理を実装
        # 実際の実装では、データベースからユーザーのクレジット残高を取得して
        # 必要なクレジットと比較し、十分であれば消費する

        required_credit = self.CREDIT_COSTS.get(api_type, 0)

        # 仮の実装（実際にはデータベース処理が必要）
        return True
