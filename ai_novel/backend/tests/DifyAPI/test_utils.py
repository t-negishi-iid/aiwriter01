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
