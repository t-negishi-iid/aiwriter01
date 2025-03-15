"""
Dify APIとの通信を行うクラス
"""
import json
import logging
import time
import requests
from typing import Dict, List, Any, Optional, Union
from django.conf import settings

logger = logging.getLogger(__name__)


class DifyNovelAPI:
    """
    Dify APIとの通信を行うクラス
    """
    # API設定（実際には設定ファイルから読み込む）
    #API_BASE_URL = "https://api.dify.ai/v1/completion-messages"
    API_BASE_URL = "https://api.dify.ai/v1/workflows/run"

    # APIごとの設定
    API_CONFIG = {
        'basic_setting_data': {
            'app_id': 'd4c27a11-237a-49e6-bdd3-28c410ff6f96',
            'api_key': 'app-RVzFPhndqQyflqMxkmBAx8uV'
        },
        'basic_setting': {
            'app_id': '912fa9b1-2a4a-4340-b748-427e4d538164',
            'api_key': 'app-X1e1XPXOKzot8lWteTdVCgey'
        },
        'character_detail': {
            'app_id': 'f1bb67ff-db37-49c6-b0b2-3790bcd488b3',
            'api_key': 'app-zd3lFB9WVQNBY6jMhyI6mJPl'
        },
        'plot_detail': {
            'app_id': '60eff6b9-b713-4702-9924-49d42bb47f61',
            'api_key': 'app-PYmSirQZfKrIE7mK0dtgBCww'
        },
        'episode_detail': {
            'app_id': 'e38052bf-bbde-4e50-9776-d3c2af98d30a',
            'api_key': 'app-BCSZGXvGxReumppDeWaYD8CM'
        },
        'episode_content': {
            'app_id': '0382253c-5aa6-488e-9022-2131fc268571',
            'api_key': 'app-J845W1BSeaOD3z4hKVGQ5aQu'
        },
        'title': {
            'app_id': 'b2bd1609-9fd1-4cdd-8f95-4f2b32bcdf75',
            'api_key': 'app-wOwBxUnKb9kA8BYqQinc8Mb9'
        }
    }

    def __init__(self, timeout: int = 60, max_retries: int = 3, retry_delay: int = 5):
        """
        コンストラクタ

        Args:
            timeout: リクエストのタイムアウト時間（秒）
            max_retries: リトライ回数
            retry_delay: リトライ間隔（秒）
        """
        self.timeout = timeout
        self.max_retries = max_retries
        self.retry_delay = retry_delay

    def _get_headers(self, api_type: str) -> Dict[str, str]:
        """
        リクエストヘッダーを取得

        Args:
            api_type: API種別

        Returns:
            Dict[str, str]: ヘッダー
        """
        api_config = self.API_CONFIG.get(api_type)
        if not api_config:
            raise ValueError(f"Unsupported API type: {api_type}")

        return {
            "Authorization": f"Bearer {api_config['api_key']}",
            "Content-Type": "application/json"
        }

    def _make_api_request(
        self,
        api_type: str,
        inputs: Dict[str, Any],
        user_id: str,
        blocking: bool = True
    ) -> Dict[str, Any]:
        """
        APIリクエストを実行

        Args:
            api_type: API種別
            inputs: 入力データ
            user_id: ユーザーID
            blocking: ブロッキングモード（同期処理）

        Returns:
            Dict[str, Any]: レスポンス
        """
        headers = self._get_headers(api_type)
        api_config = self.API_CONFIG.get(api_type)

        if not api_config:
            error_message = f"Unsupported API type: {api_type}"
            logger.error(error_message)
            return {"error": error_message}

        # リクエストデータの準備
        request_data = {
            "inputs": inputs,
            "user": user_id,
            "response_mode": "blocking" if blocking else "streaming"
        }

        retries = 0
        last_error = None

        while retries < self.max_retries:
            try:
                response = requests.post(
                    self.API_BASE_URL,
                    headers=headers,
                    json=request_data,
                    timeout=self.timeout  # タイムアウト値をインスタンス変数に変更
                )

                # エラーチェック
                if response.status_code >= 400:
                    error_message = f"API request failed with status code {response.status_code}: {response.text}"
                    logger.error(error_message)
                    return {"error": error_message}

                # レスポンス処理
                return self._process_response(response.json())

            except requests.RequestException as e:
                logger.warning(f"API request attempt {retries + 1} failed: {str(e)}")
                last_error = str(e)
                retries += 1
                if retries < self.max_retries:
                    time.sleep(self.retry_delay)

        # 全てのリトライが失敗
        logger.error(f"All API request attempts failed: {last_error}")
        return {"error": f"API request failed after {self.max_retries} attempts: {last_error}"}

    def _process_response(self, response_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        レスポンスの処理

        Args:
            response_data: レスポンスデータ

        Returns:
            Dict[str, Any]: 処理済みレスポンス
        """
        try:
            # ワークフローAPIのレスポンス形式に対応
            if "data" in response_data and "outputs" in response_data["data"]:
                result = response_data["data"]["outputs"].get("result", "")
                return {"result": result}


            # その他の形式
            return response_data
        except Exception as e:
            logger.error(f"Failed to process response: {str(e)}")
            return {"error": f"Failed to process response: {str(e)}"}

    def create_basic_setting(
        self,
        basic_setting_data: str,
        user_id: str,
        blocking: bool = True
    ) -> Dict[str, Any]:
        """
        基本設定を生成

        Args:
            basic_setting_data: 基本設定データ
            user_id: ユーザーID
            blocking: ブロッキングモード（同期処理）

        Returns:
            Dict[str, Any]: 生成結果
        """
        # 入力データの準備
        inputs = {
            "basic_setting_data": basic_setting_data
        }

        return self._make_api_request("basic_setting", inputs, user_id, blocking)

    def create_character_detail(
        self,
        basic_setting: str,
        character_data: Dict[str, str],
        user_id: str,
        blocking: bool = True
    ) -> Dict[str, Any]:
        """
        キャラクター詳細を生成

        Args:
            basic_setting: 基本設定
            character_data: キャラクターデータ（名前、役割）
            user_id: ユーザーID
            blocking: ブロッキングモード（同期処理）

        Returns:
            Dict[str, Any]: レスポンス
        """
        inputs = {
            "basic_setting": basic_setting,
            "character_name": character_data.get("name", ""),
            "character_role": character_data.get("role", "")
        }

        return self._make_api_request("character_detail", inputs, user_id, blocking)

    def create_plot_detail(
        self,
        basic_setting: str,
        character_details: List[Dict[str, Any]],
        user_id: str,
        blocking: bool = True
    ) -> Dict[str, Any]:
        """
        あらすじ詳細を生成

        Args:
            basic_setting: 基本設定
            character_details: キャラクター詳細リスト
            user_id: ユーザーID
            blocking: ブロッキングモード（同期処理）

        Returns:
            Dict[str, Any]: レスポンス
        """
        # キャラクター詳細を文字列にシリアライズ
        character_details_str = json.dumps(character_details, ensure_ascii=False)

        inputs = {
            "basic_setting": basic_setting,
            "character_details": character_details_str
        }

        return self._make_api_request("plot_detail", inputs, user_id, blocking)

    def create_episode_details(
        self,
        basic_setting: str,
        character_details: List[Dict[str, Any]],
        plot_details: List[Dict[str, Any]],
        target_plot: Dict[str, Any],
        episode_count: int,
        user_id: str,
        blocking: bool = True
    ) -> Dict[str, Any]:
        """
        エピソード詳細を生成

        Args:
            basic_setting: 基本設定
            character_details: キャラクター詳細リスト
            plot_details: あらすじ詳細リスト
            target_plot: ターゲットとなるあらすじ詳細
            episode_count: エピソード数
            user_id: ユーザーID
            blocking: ブロッキングモード（同期処理）

        Returns:
            Dict[str, Any]: レスポンス
        """
        # データをシリアライズ
        character_details_str = json.dumps(character_details, ensure_ascii=False)
        plot_details_str = json.dumps(plot_details, ensure_ascii=False)
        target_plot_str = json.dumps(target_plot, ensure_ascii=False)

        inputs = {
            "basic_setting": basic_setting,
            "character_details": character_details_str,
            "plot_details": plot_details_str,
            "target_plot": target_plot_str,
            "episode_count": str(episode_count)
        }

        return self._make_api_request("episode_detail", inputs, user_id, blocking)

    def create_episode_content(
        self,
        basic_setting: str,
        character_details: List[Dict[str, Any]],
        plot_details: List[Dict[str, Any]],
        episode_detail: str,
        word_count: int,
        user_id: str,
        blocking: bool = True
    ) -> Dict[str, Any]:
        """
        エピソード本文を生成

        Args:
            basic_setting: 基本設定
            character_details: キャラクター詳細リスト
            plot_details: あらすじ詳細リスト
            episode_detail: エピソード詳細
            word_count: 文字数
            user_id: ユーザーID
            blocking: ブロッキングモード（同期処理）

        Returns:
            Dict[str, Any]: レスポンス
        """
        # データをシリアライズ
        character_details_str = json.dumps(character_details, ensure_ascii=False)
        plot_details_str = json.dumps(plot_details, ensure_ascii=False)

        inputs = {
            "basic_setting": basic_setting,
            "character_details": character_details_str,
            "plot_details": plot_details_str,
            "episode_detail": episode_detail,
            "word_count": str(word_count)
        }

        return self._make_api_request("episode_content", inputs, user_id, blocking)

    def generate_title(
        self,
        basic_setting: str,
        character_details: List[Dict[str, Any]],
        plot_details: List[Dict[str, Any]],
        target_content: str,
        target_type: str,
        user_id: str,
        blocking: bool = True
    ) -> Dict[str, Any]:
        """
        タイトルを生成

        Args:
            basic_setting: 基本設定
            character_details: キャラクター詳細リスト
            plot_details: あらすじ詳細リスト
            target_content: ターゲットコンテンツ
            target_type: ターゲットタイプ（episode, act, novel）
            user_id: ユーザーID
            blocking: ブロッキングモード（同期処理）

        Returns:
            Dict[str, Any]: レスポンス
        """
        # データをシリアライズ
        character_details_str = json.dumps(character_details, ensure_ascii=False)
        plot_details_str = json.dumps(plot_details, ensure_ascii=False)

        inputs = {
            "basic_setting": basic_setting,
            "character_details": character_details_str,
            "plot_details": plot_details_str,
            "target_content": target_content,
            "target_type": target_type
        }

        return self._make_api_request("title", inputs, user_id, blocking)
