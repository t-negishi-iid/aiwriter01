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

    def __init__(self, timeout: int = 300, max_retries: int = 3, retry_delay: int = 5):
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

    """
    ブロッキングモード API呼び出し

    """

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

        # デバッグ用にリクエストデータの内容をログに出力
        logger.debug(f"DEBUG - _make_api_request - api_type: {api_type}")
        logger.debug(f"DEBUG - _make_api_request - request_data: {json.dumps(request_data)[:500]}")

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
            # デバッグ用にレスポンスデータの内容を詳細にログ出力
            logger.debug(f"DEBUG - _process_response - response_data type: {type(response_data)}")
            logger.debug(f"DEBUG - _process_response - response_data keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Not a dict'}")
            logger.debug(f"DEBUG - _process_response - full response_data: {json.dumps(response_data)[:1000]}")

            # エラーチェック
            if (isinstance(response_data, dict) and
                "data" in response_data and
                "error" in response_data["data"] and
                response_data["data"]["error"]):
                # APIから返されたエラーをそのまま返す
                error_message = response_data["data"]["error"]
                logger.error(f"API returned error: {error_message}")
                return {"error": f"APIエラー: {error_message}"}

            # レート制限エラーチェック
            if (isinstance(response_data, dict) and
                "data" in response_data and
                "status" in response_data["data"] and
                response_data["data"]["status"] == "failed"):
                # 失敗ステータスの場合は詳細なエラーメッセージを返す
                error_message = "APIリクエストが失敗しました"
                if "error" in response_data["data"] and response_data["data"]["error"]:
                    error_message = response_data["data"]["error"]
                logger.error(f"DEBUG - _process_response - API request failed: {error_message}")
                return {"error": f"API実行失敗: {error_message}"}

            # ワークフローAPIのレスポンス形式に対応
            if (isinstance(response_data, dict) and
                "data" in response_data and
                "outputs" in response_data["data"]):
                # outputsがNoneの場合はエラーとして扱う
                if response_data["data"]["outputs"] is None:
                    logger.error("DEBUG - _process_response - outputs is None")
                    return {"error": "APIレスポンスのoutputsがNullです"}

                result = response_data["data"]["outputs"].get("result", "")
                logger.debug(f"DEBUG - _process_response - extracted result (first 200 chars): {result[:200]}")
                return {"result": result}

            # その他の形式
            logger.debug(f"DEBUG - _process_response - using original response format")
            return response_data
        except Exception as e:
            logger.error(f"Failed to process response: {str(e)}")
            return {"error": f"Failed to process response: {str(e)}"}


    """

    アプリケーションメソッド
    実際にDifyのAPIを呼び出して
    サービスを

    """
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
        character_data: str,
        user_id: str,
        blocking: bool = True
    ) -> Dict[str, Any]:
        """
        キャラクター詳細を生成

        Args:
            basic_setting: 基本設定
            character_data: キャラクターデータ（raw_content）
            user_id: ユーザーID
            blocking: ブロッキングモード（同期処理）

        Returns:
            Dict[str, Any]: レスポンス
        """
        inputs = {
            "basic_setting": basic_setting,
            "character": character_data,
        }

        return self._make_api_request("character_detail", inputs, user_id, blocking)

    def create_plot_detail(
        self,
        basic_setting: str,
        all_characters: str,
        user_id: str,
        blocking: bool = True
    ) -> Dict[str, Any]:
        """
        あらすじ詳細を生成

        Args:
            basic_setting: 基本設定 : str
            all_characters: 全キャラクター詳細（str）
            user_id: ユーザーID
            blocking: ブロッキングモード（同期処理）

        Returns:
            Dict[str, Any]: レスポンス
        """
        inputs = {
            "basic_setting": basic_setting,
            "all_characters": all_characters
        }

        # デバッグ用にパラメータの先頭200文字をログに出力
        logger.debug(f"DEBUG - create_plot_detail - basic_setting (first 200 chars): {basic_setting[:200]}")
        logger.debug(f"DEBUG - create_plot_detail - all_characters (first 200 chars): {all_characters[:200]}")

        return self._make_api_request("plot_detail", inputs, user_id, blocking)

    def create_episode_details(
        self,
        basic_setting: str,
        all_characters_list: List[Dict[str, Any]],
        all_act_details_list: List[Dict[str, Any]],
        target_act_detail: Dict[str, Any],
        episode_count: int,
        user_id: str,
        blocking: bool = True
    ) -> Dict[str, Any]:
        """
        エピソード詳細を生成

        Args:
            basic_setting: 基本設定 : str
            all_characters_list: キャラクター詳細リスト
            all_act_details: 幕詳細リスト
            target_act_detail: ターゲットとなる幕詳細
            episode_count: 分割するエピソード数
            user_id: ユーザーID
            blocking: ブロッキングモード（同期処理）

        Returns:
            Dict[str, Any]: レスポンス
        """
        # データをシリアライズ
        all_characters_str = json.dumps(all_characters_list, ensure_ascii=False)
        all_act_details_str = json.dumps(all_act_details_list, ensure_ascii=False)
        target_act_detail_str = json.dumps(target_act_detail, ensure_ascii=False)

        inputs = {
            "basic_setting": basic_setting,
            "all_characters": all_characters_str,
            "all_act_details": all_act_details_str,
            "target_act_detail": target_act_detail_str,
            "episode_count": str(episode_count)
        }

        return self._make_api_request("episode_detail", inputs, user_id, blocking)

    def create_episode_content(
        self,
        basic_setting: str,
        all_characters_list: List[Dict[str, Any]],
        all_episode_details_list: List[Dict[str, Any]],
        target_episode_detail: Dict[str, Any],
        act_number: int,
        episode_number: int,
        word_count: int,
        user_id: str,
        blocking: bool = True
    ) -> Dict[str, Any]:
        """
        エピソード本文を生成

        Args:
            basic_setting: 基本設定
            all_characters_list: キャラクター詳細リスト
            all_episode_details_list: エピソード詳細リスト
            target_episode_detail: ターゲットとなるエピソード詳細
            act_number: 幕番号
            episode_number: エピソード番号
            word_count: 文字数
            user_id: ユーザーID
            blocking: ブロッキングモード（同期処理）

        Returns:
            Dict[str, Any]: レスポンス
        """
        # データをシリアライズ
        all_characters_str = json.dumps(all_characters_list, ensure_ascii=False)
        all_episode_details_str = json.dumps(all_episode_details_list, ensure_ascii=False)

        inputs = {
            "basic_setting": basic_setting,
            "all_characters": all_characters_str,
            "all_episode_details": all_episode_details_str,
            "target_episode_detail": target_episode_detail,
            "act_number": str(act_number),
            "episode_number": str(episode_number),
            "word_count": str(word_count)
        }

        return self._make_api_request("episode_content", inputs, user_id, blocking)

    def generate_title(
        self,
        basic_setting: str,
        all_characters_list: List[Dict[str, Any]],
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
            all_characters_list: キャラクター詳細リスト
            plot_details: あらすじ詳細リスト
            target_content: ターゲットコンテンツ
            target_type: ターゲットタイプ（episode, act, novel）
            user_id: ユーザーID
            blocking: ブロッキングモード（同期処理）

        Returns:
            Dict[str, Any]: レスポンス
        """
        # データをシリアライズ
        all_characters_str = json.dumps(all_characters_list, ensure_ascii=False)
        plot_details_str = json.dumps(plot_details, ensure_ascii=False)

        inputs = {
            "basic_setting": basic_setting,
            "all_characters": all_characters_str,
            "plot_details": plot_details_str,
            "target_content": target_content,
            "target_type": target_type
        }

        return self._make_api_request("title", inputs, user_id, blocking)
