"""
Dify APIとのストリーミング通信を行うクラス
"""
import json
import logging
import time
import requests
from typing import Dict, List, Any, Optional, Union, Generator, Iterator

from django.conf import settings

logger = logging.getLogger(__name__)


class DifyStreamingAPI:
    """
    Dify APIとのストリーミング通信を行うクラス
    """
    # API設定（実際には設定ファイルから読み込む）
    API_BASE_URL = "https://api.dify.ai/v1/workflows/run"

    # APIごとの設定 - dify_api.pyと同じ設定を使用
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
            "Content-Type": "application/json",
            "Accept": "text/event-stream"  # ストリーミングモード用にAcceptヘッダーを追加
        }

    """
    ストリーミングモード API呼び出し
    """

    def _make_streaming_request(
        self,
        api_type: str,
        inputs: Dict[str, Any],
        user_id: str
    ) -> Iterator[Dict[str, Any]]:
        """
        ストリーミングAPIリクエストを実行

        Args:
            api_type: API種別
            inputs: 入力データ
            user_id: ユーザーID

        Yields:
            Dict[str, Any]: ストリーミングレスポンスの各チャンク
        """
        headers = self._get_headers(api_type)
        api_config = self.API_CONFIG.get(api_type)

        if not api_config:
            error_message = f"Unsupported API type: {api_type}"
            logger.error(error_message)
            yield {"error": error_message}
            return

        # リクエストデータの準備 - 常にストリーミングモードを使用
        request_data = {
            "inputs": inputs,
            "user": user_id,
            "response_mode": "streaming"
        }

        retries = 0
        last_error = None

        while retries < self.max_retries:
            try:
                # ストリーミングモードでリクエスト - stream=Trueを設定
                with requests.post(
                    self.API_BASE_URL,
                    headers=headers,
                    json=request_data,
                    timeout=self.timeout,
                    stream=True  # ストリーミングモードを有効化
                ) as response:
                    # エラーチェック
                    if response.status_code >= 400:
                        error_message = f"API request failed with status code {response.status_code}: {response.text}"
                        logger.error(error_message)
                        yield {"error": error_message}
                        return

                    # ストリーミングレスポンスの処理
                    yield from self._process_streaming_response(response)
                    return

            except requests.RequestException as e:
                logger.warning(f"API request attempt {retries + 1} failed: {str(e)}")
                last_error = str(e)
                retries += 1
                if retries < self.max_retries:
                    time.sleep(self.retry_delay)

        # 全てのリトライが失敗
        logger.error(f"All API request attempts failed: {last_error}")
        yield {"error": f"API request failed after {self.max_retries} attempts: {last_error}"}

    def _process_streaming_response(self, response: requests.Response) -> Iterator[Dict[str, Any]]:
        """
        ストリーミングレスポンスを処理する

        Args:
            response: リクエストのレスポンスオブジェクト

        Yields:
            Dict[str, Any]: パースされたレスポンスチャンク
        """
        for line in response.iter_lines():
            if not line:
                continue

            try:
                decoded_line = line.decode('utf-8')
                
                # SSEフォーマットの処理（'data: ' プレフィックスがある場合）
                if decoded_line.startswith('data: '):
                    data_str = decoded_line[6:]  # 'data: ' を削除
                    
                    # ストリーム終了マーカー
                    if data_str == "[DONE]":
                        yield {"end_of_stream": True}
                        continue
                    
                    # JSON解析
                    data = json.loads(data_str)
                    
                    # 最後のチャンクの場合、data->outputs->resultからMarkdown内容を抽出
                    if "data" in data and "outputs" in data["data"] and "result" in data["data"]["outputs"]:
                        # 最終データとして結果を設定
                        data["final_data"] = data["data"]["outputs"]["result"]
                        
                    yield data
                else:
                    # 非SSE形式の場合は直接JSONとして解析
                    data = json.loads(decoded_line)
                    
                    # 最後のチャンクの場合、data->outputs->resultからMarkdown内容を抽出
                    if "data" in data and "outputs" in data["data"] and "result" in data["data"]["outputs"]:
                        # 最終データとして結果を設定
                        data["final_data"] = data["data"]["outputs"]["result"]
                        
                    yield data
            except Exception as e:
                logger.error(f"Error processing response line: {e}")
                continue

    """
    アプリケーションメソッド
    実際にDifyのAPIを呼び出してサービスを提供
    """
    
    def create_basic_setting_stream(
        self,
        basic_setting_data: str,
        user_id: str
    ) -> Iterator[Dict[str, Any]]:
        """
        基本設定を生成（ストリーミングモード）

        Args:
            basic_setting_data: 基本設定データ
            user_id: ユーザーID

        Yields:
            Dict[str, Any]: 生成結果の各チャンク
        """
        # 入力データの準備
        inputs = {
            "basic_setting_data": basic_setting_data
        }

        yield from self._make_streaming_request("basic_setting", inputs, user_id)

    def create_character_detail_stream(
        self,
        basic_setting: str,
        character_data: str,
        user_id: str
    ) -> Iterator[Dict[str, Any]]:
        """
        キャラクター詳細を生成（ストリーミングモード）

        Args:
            basic_setting: 基本設定
            character_data: キャラクターデータ（raw_content）
            user_id: ユーザーID

        Yields:
            Dict[str, Any]: レスポンスの各チャンク
        """
        inputs = {
            "basic_setting": basic_setting,
            "character": character_data,
        }

        yield from self._make_streaming_request("character_detail", inputs, user_id)

    def create_plot_detail_stream(
        self,
        basic_setting: str,
        all_characters: str,
        user_id: str
    ) -> Iterator[Dict[str, Any]]:
        """
        あらすじ詳細を生成（ストリーミングモード）

        Args:
            basic_setting: 基本設定 : str
            all_characters: 全キャラクター詳細（str）
            user_id: ユーザーID

        Yields:
            Dict[str, Any]: レスポンスの各チャンク
        """
        inputs = {
            "basic_setting": basic_setting,
            "all_characters": all_characters
        }

        yield from self._make_streaming_request("plot_detail", inputs, user_id)

    def create_episode_details_stream(
        self,
        basic_setting: str,
        all_characters_list: List[Dict[str, Any]],
        all_act_details_list: List[Dict[str, Any]],
        target_act_detail: Dict[str, Any],
        episode_count: int,
        user_id: str
    ) -> Iterator[Dict[str, Any]]:
        """
        エピソード詳細を生成（ストリーミングモード）

        Args:
            basic_setting: 基本設定 : str
            all_characters_list: キャラクター詳細リスト
            all_act_details: 幕詳細リスト
            target_act_detail: ターゲットとなる幕詳細
            episode_count: 分割するエピソード数
            user_id: ユーザーID

        Yields:
            Dict[str, Any]: レスポンスの各チャンク
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

        yield from self._make_streaming_request("episode_detail", inputs, user_id)

    def create_episode_content_stream(
        self,
        basic_setting: str,
        all_characters_list: List[Dict[str, Any]],
        all_episode_details_list: List[Dict[str, Any]],
        target_episode_detail: Dict[str, Any],
        act_number: int,
        episode_number: int,
        word_count: int,
        user_id: str
    ) -> Iterator[Dict[str, Any]]:
        """
        エピソード本文を生成（ストリーミングモード）

        Args:
            basic_setting: 基本設定
            all_characters_list: キャラクター詳細リスト
            all_episode_details_list: エピソード詳細リスト
            target_episode_detail: ターゲットとなるエピソード詳細
            act_number: 幕番号
            episode_number: エピソード番号
            word_count: 文字数
            user_id: ユーザーID

        Yields:
            Dict[str, Any]: レスポンスの各チャンク
        """
        # データをシリアライズ
        all_characters_str = json.dumps(all_characters_list, ensure_ascii=False)
        all_episode_details_str = json.dumps(all_episode_details_list, ensure_ascii=False)
        target_episode_detail_str = json.dumps(target_episode_detail, ensure_ascii=False)

        inputs = {
            "basic_setting": basic_setting,
            "all_characters": all_characters_str,
            "all_episode_details": all_episode_details_str,
            "target_episode_detail": target_episode_detail_str,
            "act_number": str(act_number),
            "episode_number": str(episode_number),
            "word_count": str(word_count)
        }

        yield from self._make_streaming_request("episode_content", inputs, user_id)

    def generate_title_stream(
        self,
        basic_setting: str,
        all_characters_list: List[Dict[str, Any]],
        plot_details: List[Dict[str, Any]],
        target_content: str,
        target_type: str,
        user_id: str
    ) -> Iterator[Dict[str, Any]]:
        """
        タイトルを生成（ストリーミングモード）

        Args:
            basic_setting: 基本設定
            all_characters_list: キャラクター詳細リスト
            plot_details: あらすじ詳細リスト
            target_content: ターゲットコンテンツ
            target_type: ターゲットタイプ（episode, act, novel）
            user_id: ユーザーID

        Yields:
            Dict[str, Any]: レスポンスの各チャンク
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

        yield from self._make_streaming_request("title", inputs, user_id)
