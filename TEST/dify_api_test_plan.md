# Dify API テスト実装計画

本ドキュメントでは、Dify APIを利用したAI小説執筆支援システムのテスト実装計画を詳述します。

## テストディレクトリ構成

```
/TEST
  /DifyAPI
    test_basic_setting_data_creation.py
    test_basic_setting_creation.py
    test_character_detail_creation.py
    test_plot_detail_creation.py
    test_episode_detail_creation.py
    test_episode_content_creation.py
    test_title_creation.py
    test_utils.py
    conftest.py
```

## テスト実装方針

各APIに対して以下のテストを実施します：

1. 単体テスト
2. 結合テスト
3. モックを使用したテスト

## 「基本設定作成用データの作成」テスト実装内容

### test_basic_setting_data_creation.py の実装内容

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-

import unittest
import json
import requests
from unittest.mock import patch, MagicMock

# モジュールのインポート
# from backend.novel_gen.dify_api import create_basic_setting_data

class TestBasicSettingDataCreation(unittest.TestCase):
    """基本設定作成用データ生成APIのテストクラス"""

    def setUp(self):
        """テスト前の準備"""
        self.api_key = "app-RVzFPhndqQyflqMxkmBAx8uV"
        self.endpoint = "https://api.dify.ai/v1/chat-messages"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        self.valid_params = {
            "inputs": {
                "主題": "自己成長・成長物語",
                "時代と場所": "現代日本・都市部",
                "作品世界と舞台設定": "中世ヨーロッパ風ファンタジー世界",
                "プロットパターン": "英雄の旅",
                "愛情表現": ["恋愛", "友情"],
                "感情表現": ["喜び", "悲しみ"],
                "雰囲気演出": ["神秘的", "壮大"],
                "官能表現": ["ほのか"],
                "精神的要素": ["成長", "葛藤"],
                "社会的要素": ["階級", "差別"],
                "過去の謎": ["出生の秘密", "古代の遺物"]
            },
            "query": "これらの設定から基本設定作成用データを作成してください",
            "response_mode": "blocking"
        }

    def test_valid_request(self):
        """有効なリクエストのテスト"""
        # 実際のAPIを呼び出す場合のテスト
        response = requests.post(
            self.endpoint,
            headers=self.headers,
            json=self.valid_params
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('answer', data)
        # レスポンスの内容を検証するアサーションを追加

    @patch('requests.post')
    def test_with_mock(self, mock_post):
        """モックを使用したテスト"""
        # モックのレスポンスを設定
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "answer": "テスト用基本設定作成用データ",
            "conversation_id": "test-conv-id"
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
        self.assertEqual(data["answer"], "テスト用基本設定作成用データ")

    def test_invalid_params(self):
        """無効なパラメータのテスト"""
        invalid_params = self.valid_params.copy()
        # 必須パラメータを削除
        del invalid_params["inputs"]["主題"]

        response = requests.post(
            self.endpoint,
            headers=self.headers,
            json=invalid_params
        )

        # エラーレスポンスの検証
        self.assertNotEqual(response.status_code, 200)

    def test_api_error_handling(self):
        """API接続エラー時の挙動テスト"""
        # 意図的に無効なエンドポイントを指定
        invalid_endpoint = "https://invalid-api-endpoint.example.com"

        # 例外が発生することを期待
        with self.assertRaises(requests.exceptions.RequestException):
            requests.post(
                invalid_endpoint,
                headers=self.headers,
                json=self.valid_params
            )

if __name__ == '__main__':
    unittest.main()
```

### conftest.py の実装内容

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-

import pytest
import json
import os
from unittest.mock import MagicMock

@pytest.fixture
def api_keys():
    """APIキーの辞書を返すフィクスチャ"""
    return {
        "basic_setting_data": "app-RVzFPhndqQyflqMxkmBAx8uV",
        "basic_setting": "app-X1e1XPXOKzot8lWteTdVCgey",
        "character_detail": "app-zd3lFB9WVQNBY6jMhyI6mJPl",
        "plot_detail": "app-PYmSirQZfKrIE7mK0dtgBCww",
        "episode_detail": "app-BCSZGXvGxReumppDeWaYD8CM",
        "episode_content": "app-J845W1BSeaOD3z4hKVGQ5aQu",
        "title": "app-wOwBxUnKb9kA8BYqQinc8Mb9"
    }

@pytest.fixture
def mock_response():
    """モックレスポンスを返すフィクスチャ"""
    mock = MagicMock()
    mock.status_code = 200
    mock.json.return_value = {
        "answer": "モックレスポンスデータ",
        "conversation_id": "mock-conv-id"
    }
    return mock

@pytest.fixture
def sample_inputs():
    """サンプル入力データを返すフィクスチャ"""
    return {
        "basic_setting_data": {
            "主題": "自己成長・成長物語",
            "時代と場所": "現代日本・都市部",
            "作品世界と舞台設定": "中世ヨーロッパ風ファンタジー世界",
            "プロットパターン": "英雄の旅",
            "愛情表現": ["恋愛", "友情"],
            "感情表現": ["喜び", "悲しみ"],
            "雰囲気演出": ["神秘的", "壮大"],
            "官能表現": ["ほのか"],
            "精神的要素": ["成長", "葛藤"],
            "社会的要素": ["階級", "差別"],
            "過去の謎": ["出生の秘密", "古代の遺物"]
        }
    }
```

### test_utils.py の実装内容

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-

import requests
import json
import logging

logger = logging.getLogger(__name__)

def make_dify_api_request(api_key, endpoint, data, timeout=60):
    """
    Dify APIにリクエストを送信する共通関数

    Args:
        api_key (str): 使用するAPIキー
        endpoint (str): APIエンドポイント
        data (dict): リクエストデータ
        timeout (int, optional): タイムアウト秒数

    Returns:
        dict: APIレスポンス
    """
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(
            endpoint,
            headers=headers,
            json=data,
            timeout=timeout
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        logger.error(f"Dify API request failed: {str(e)}")
        # 詳細なエラー情報を返す
        error_info = {
            "error": str(e),
            "status_code": getattr(e.response, 'status_code', None),
            "response_text": getattr(e.response, 'text', None)
        }
        return error_info

def process_streaming_response(response):
    """
    ストリーミングレスポンスを処理する関数

    Args:
        response: ストリーミングレスポンス

    Yields:
        dict: チャンクごとのデータと完全なテキスト
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
```

## 各機能のテスト実装計画

各機能に対して、上記と同様のテストを実装します。テストの内容は各APIの特性に応じて調整します。

## モジュール実装計画

テストに必要なモジュールも実装する必要があります。以下にモジュール実装計画を示します。

### DifyAPI機能モジュール (backend/novel_gen/dify_api.py)

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-

import requests
import json
import logging
from typing import Dict, Any, Optional, Union, Generator

logger = logging.getLogger(__name__)

class DifyAPI:
    """Dify APIとの通信を行うクラス"""

    def __init__(self, api_key: str, endpoint: str = "https://api.dify.ai/v1/chat-messages"):
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
                    timeout: int = 60) -> Dict[str, Any]:
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
            APIレスポンス
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
                "response_text": getattr(e.response, 'text', None)
            }
            return error_info

    def process_streaming(self, response) -> Generator[Dict[str, str], None, str]:
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

# 各機能に特化したクラスメソッドを実装
def create_basic_setting_data(inputs: Dict[str, Any]) -> Dict[str, Any]:
    """
    基本設定作成用データを作成

    Args:
        inputs: 入力パラメータ

    Returns:
        APIレスポンス
    """
    api_key = "app-RVzFPhndqQyflqMxkmBAx8uV"
    api = DifyAPI(api_key)

    return api.make_request(
        inputs=inputs,
        query="これらの設定から基本設定作成用データを作成してください",
        response_mode="blocking"
    )

def create_basic_setting(basic_setting_data: str) -> Dict[str, Any]:
    """
    基本設定を作成

    Args:
        basic_setting_data: 基本設定作成用データ

    Returns:
        APIレスポンス
    """
    api_key = "app-X1e1XPXOKzot8lWteTdVCgey"
    api = DifyAPI(api_key)

    return api.make_request(
        inputs={"基本設定作成用データ": basic_setting_data},
        query="基本設定作成用データから基本設定を作成してください",
        response_mode="streaming"
    )

# 他の機能も同様に実装
```

## 注意事項

1. 実際のAPIを呼び出すテストは開発環境でのみ実行し、本番環境ではモックを使用してテストを行う
2. APIキーは環境変数などから取得し、ソースコードにハードコーディングしない
3. テストの実行前に必要な準備（データベースセットアップなど）を行う
4. テスト実行後はテスト環境をクリーンアップする
