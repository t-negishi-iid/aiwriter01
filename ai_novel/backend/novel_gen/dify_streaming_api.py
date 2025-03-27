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


def get_markdown_from_last_chunk(last_chunk: Dict[str, Any], all_chunks: List[Dict[str, Any]] = None) -> str:
    """
    最終チャンクからMarkdownコンテンツを抽出します。
    
    Args:
        last_chunk: 最終チャンク（通常は done=True フラグが含まれる）
        all_chunks: 全チャンクリスト（エピソード詳細生成APIなど、特殊なフォーマットに対応）
        
    Returns:
        str: 抽出されたMarkdownテキスト。抽出に失敗した場合は空文字列。
    """
    try:
        # 最優先：最終チャンク（node_finished イベント）からのデータ抽出
        if last_chunk and "event" in last_chunk and last_chunk["event"] == "node_finished":
            if "data" in last_chunk and "outputs" in last_chunk["data"] and "result" in last_chunk["data"]["outputs"]:
                result = last_chunk["data"]["outputs"]["result"]
                if isinstance(result, str) and result:
                    logger.debug("node_finishedイベントからMarkdownを抽出しました")
                    return result
        
        # 次に優先：標準的なDify API形式からMarkdownを抽出
        if "data" in last_chunk and "outputs" in last_chunk["data"] and "result" in last_chunk["data"]["outputs"]:
            result = last_chunk["data"]["outputs"]["result"]
            
            # resultが文字列の場合はそのまま返す
            if isinstance(result, str):
                logger.debug("標準的なDify APIレスポンスからMarkdownを抽出しました")
                return result
            # リストの場合はJSON文字列に変換
            elif isinstance(result, list):
                logger.debug("リスト形式のresultをJSON文字列に変換しました")
                return json.dumps(result, ensure_ascii=False)
                
        # text_chunkイベントからの抽出を試みる
        if all_chunks:
            last_text_chunks = [
                chunk for chunk in all_chunks 
                if chunk.get("event") == "text_chunk" 
                and "data" in chunk 
                and "text" in chunk["data"]
            ]
            
            if last_text_chunks:
                # 最後のtext_chunkを使用
                text_content = last_text_chunks[-1]["data"]["text"]
                if text_content:
                    logger.debug("text_chunkイベントからMarkdownを抽出しました")
                    return text_content
                
        logger.error("Markdownコンテンツの抽出に失敗しました")
        if last_chunk:
            logger.error(f"最終チャンク: {json.dumps(last_chunk, ensure_ascii=False)}")
        return ""
    except Exception as e:
        logger.error(f"Markdownコンテンツの抽出中にエラーが発生しました: {str(e)}")
        return ""


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

    def __init__(self, timeout: int = 300, max_retries: int = 3, retry_delay: int = 5, test_mode: bool = False):
        """
        コンストラクタ

        Args:
            timeout: リクエストのタイムアウト時間（秒）
            max_retries: リトライ回数
            retry_delay: リトライ間隔（秒）
            test_mode: テストモードかどうか
        """
        self.timeout = timeout
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self.test_mode = test_mode

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
        ストリーミングレスポンスを処理し、解析済みのレスポンスチャンクを生成します。
        """
        for line in response.iter_lines():
            if not line:
                # 空行はスキップ
                continue
            
            try:
                decoded_line = line.decode('utf-8')
                
                # 空のデコード行もスキップ
                if not decoded_line.strip():
                    continue
                
                # SSE形式のデータ処理 (data: {...})
                if decoded_line.startswith('data: '):
                    data_str = decoded_line[6:]  # 'data: ' を削除
                    
                    # データ文字列が空の場合はスキップ
                    if not data_str.strip():
                        logger.warning("Empty data string received, skipping")
                        continue
                    
                    # 特別なケース: [DONE]
                    if data_str.strip() == '[DONE]':
                        yield {'done': True}
                        continue
                    
                    try:
                        data = json.loads(data_str)
                        yield data
                    except json.JSONDecodeError as e:
                        logger.error(f"Error decoding JSON from data: prefix: {e}")
                        logger.error(f"Raw data (first 200 chars): {data_str[:200]}")
                        # エラーをスキップして次の行へ
                        continue
                # 通常のJSONレスポンス処理
                else:
                    try:
                        data = json.loads(decoded_line)
                        yield data
                    except json.JSONDecodeError as e:
                        logger.error(f"Error processing response line: {e}")
                        logger.error(f"Raw line (first 200 chars): {decoded_line[:200]}")
                        # エラーをスキップして次の行へ
                        continue
            except UnicodeDecodeError as e:
                logger.error(f"Unicode decode error: {e}")
                logger.error(f"Raw binary data: {line}")
                continue
            except Exception as e:
                logger.error(f"Unexpected error processing stream line: {e}")
                continue
    
    """
    アプリケーションメソッド
    実際にDifyのAPIを呼び出してサービスを提供
    """
    
    def create_basic_setting_stream(
        self,
        basic_setting_data: str,
        user_id: str,
        test_mode: bool = None
    ) -> Iterator[Dict[str, Any]]:
        """
        基本設定を生成（ストリーミングモード）

        Args:
            basic_setting_data: 基本設定データ
            user_id: ユーザーID
            test_mode: テストモードフラグ（指定しない場合はインスタンス初期化時の値を使用）

        Yields:
            Dict[str, Any]: 生成結果の各チャンク
        """
        # 使用するテストモードフラグを決定
        current_test_mode = test_mode if test_mode is not None else self.test_mode
        
        # 入力データの準備
        inputs = {
            "basic_setting_data": basic_setting_data
        }

        yield from self._make_streaming_request("basic_setting", inputs, user_id)

    def create_character_detail_stream(
        self,
        basic_setting: str,
        character_data: str,
        user_id: str,
        test_mode: bool = None
    ) -> Iterator[Dict[str, Any]]:
        """
        キャラクター詳細を生成（ストリーミングモード）

        Args:
            basic_setting: 基本設定
            character_data: キャラクターデータ（raw_content）
            user_id: ユーザーID
            test_mode: テストモードフラグ（指定しない場合はインスタンス初期化時の値を使用）

        Yields:
            Dict[str, Any]: レスポンスの各チャンク
        """
        # 使用するテストモードフラグを決定
        current_test_mode = test_mode if test_mode is not None else self.test_mode
        
        # 入力データの準備
        inputs = {
            "basic_setting": basic_setting,
            "character": character_data,
        }

        yield from self._make_streaming_request("character_detail", inputs, user_id)

    def create_plot_detail_stream(
        self,
        basic_setting: str,
        all_characters: str,
        user_id: str,
        test_mode: bool = None
    ) -> Iterator[Dict[str, Any]]:
        """
        あらすじ詳細を生成（ストリーミングモード）

        Args:
            basic_setting: 基本設定 : str
            all_characters: 全キャラクター詳細（str）
            user_id: ユーザーID
            test_mode: テストモードフラグ（指定しない場合はインスタンス初期化時の値を使用）

        Yields:
            Dict[str, Any]: レスポンスの各チャンク
        """
        # 使用するテストモードフラグを決定
        current_test_mode = test_mode if test_mode is not None else self.test_mode
        
        # 入力データの準備
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
        user_id: str,
        test_mode: bool = None
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
            test_mode: テストモードフラグ（指定しない場合はインスタンス初期化時の値を使用）

        Yields:
            Dict[str, Any]: レスポンスの各チャンク
        """
        # 使用するテストモードフラグを決定
        current_test_mode = test_mode if test_mode is not None else self.test_mode
        
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
        user_id: str,
        test_mode: bool = None
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
            test_mode: テストモードフラグ（指定しない場合はインスタンス初期化時の値を使用）

        Yields:
            Dict[str, Any]: レスポンスの各チャンク
        """
        # 使用するテストモードフラグを決定
        current_test_mode = test_mode if test_mode is not None else self.test_mode
        
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
        user_id: str,
        test_mode: bool = None
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
            test_mode: テストモードフラグ（指定しない場合はインスタンス初期化時の値を使用）

        Yields:
            Dict[str, Any]: レスポンスの各チャンク
        """
        # 使用するテストモードフラグを決定
        current_test_mode = test_mode if test_mode is not None else self.test_mode
        
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
