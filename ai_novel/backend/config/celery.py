"""
Celery設定モジュール
"""
import os
from celery import Celery

# Django設定モジュールを環境変数に設定
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('ai_novel')

# Django設定ファイルを使用するように設定
app.config_from_object('django.conf:settings', namespace='CELERY')

# Djangoアプリケーションからタスクを自動的にロード
app.autodiscover_tasks()
