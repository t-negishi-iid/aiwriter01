from django.apps import AppConfig


class NovelGenConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'novel_gen'
    verbose_name = 'AI小説執筆支援'

    def ready(self):
        """アプリ起動時に実行される処理"""
        # シグナルやその他の初期化処理をインポート
        import novel_gen.signals  # noqa
