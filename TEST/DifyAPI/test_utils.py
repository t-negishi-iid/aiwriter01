#!/usr/bin/env python
# -*- coding: utf-8 -*-

import requests
import json
import logging
import os
from unittest.mock import MagicMock
from .config import API_KEYS, API_ENDPOINT, DEV_MODE

logger = logging.getLogger(__name__)

def make_dify_api_request(api_key, endpoint, data, timeout=60, use_mock=not DEV_MODE):
    """
    Dify APIにリクエストを送信する共通関数

    Args:
        api_key (str): 使用するAPIキー
        endpoint (str): APIエンドポイント
        data (dict): リクエストデータ
        timeout (int, optional): タイムアウト秒数
        use_mock (bool): モックを使用するかどうか

    Returns:
        dict: APIレスポンス
    """
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    # テスト環境でモックを使用する場合
    if use_mock:
        logger.info("Using mock response for Dify API request")
        mock_response = {
            "answer": "これはテスト用のモックレスポンスです。",
            "conversation_id": "mock-conv-id",
            "created_at": "2025-03-04T08:00:00.000Z"
        }
        return mock_response

    # 実際のAPIリクエスト
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

def create_mock_dify_api():
    """
    DifyNovelAPIのモックを作成する関数

    Returns:
        MagicMock: モック化されたDifyNovelAPIインスタンス
    """
    mock_api = MagicMock()

    # 各メソッドのモック応答を設定
    mock_api.create_basic_setting.return_value = {
        "answer": "これは基本設定のモックレスポンスです。",
        "conversation_id": "mock-basic-setting-id"
    }

    mock_api.create_character_detail.return_value = {
        "answer": "これはキャラクター詳細のモックレスポンスです。",
        "conversation_id": "mock-character-detail-id"
    }

    mock_api.create_plot_detail.return_value = {
        "answer": "これはあらすじ詳細のモックレスポンスです。",
        "conversation_id": "mock-plot-detail-id"
    }

    mock_api.create_episode_details.return_value = {
        "answer": "これはエピソード詳細のモックレスポンスです。",
        "conversation_id": "mock-episode-details-id"
    }

    mock_api.create_episode_content.return_value = {
        "answer": "これはエピソード本文のモックレスポンスです。",
        "conversation_id": "mock-episode-content-id"
    }

    mock_api.generate_title.return_value = {
        "answer": "これはタイトルのモックレスポンスです。",
        "conversation_id": "mock-title-id"
    }

    return mock_api
