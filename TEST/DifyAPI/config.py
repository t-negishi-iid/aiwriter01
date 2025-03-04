"""
Dify APIテスト用の設定
"""
import os

# 環境変数からAPIキーを取得
API_KEYS = {
    'basic_setting_data': os.environ.get('DIFY_API_KEY_BASIC_SETTING_DATA', 'app-RVzFPhndqQyflqMxkmBAx8uV'),
    'basic_setting': os.environ.get('DIFY_API_KEY_BASIC_SETTING', 'app-X1e1XPXOKzot8lWteTdVCgey'),
    'character_detail': os.environ.get('DIFY_API_KEY_CHARACTER_DETAIL', 'app-zd3lFB9WVQNBY6jMhyI6mJPl'),
    'plot_detail': os.environ.get('DIFY_API_KEY_PLOT_DETAIL', 'app-PYmSirQZfKrIE7mK0dtgBCww'),
    'episode_detail': os.environ.get('DIFY_API_KEY_EPISODE_DETAIL', 'app-BCSZGXvGxReumppDeWaYD8CM'),
    'episode_content': os.environ.get('DIFY_API_KEY_EPISODE_CONTENT', 'app-J845W1BSeaOD3z4hKVGQ5aQu'),
    'title': os.environ.get('DIFY_API_KEY_TITLE', 'app-wOwBxUnKb9kA8BYqQinc8Mb9')
}

# エンドポイント
API_ENDPOINT = "https://api.dify.ai/v1/chat-messages"

# 開発モード（True: 実際のAPIを呼び出す可能性あり、False: 常にモックを使用）
DEV_MODE = os.environ.get('DIFY_TEST_DEV_MODE', 'false').lower() == 'true'
