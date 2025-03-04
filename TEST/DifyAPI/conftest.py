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

@pytest.fixture
def dify_api_endpoint():
    """Dify APIエンドポイントを返すフィクスチャ"""
    return "https://api.dify.ai/v1/workflows/run"
