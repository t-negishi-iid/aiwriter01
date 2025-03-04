from django.apps import AppConfig


class NovelAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'novel_app'
    verbose_name = 'AI小説執筆支援'

    def ready(self):
        # シグナルの登録等を行う場合はここに記述
        import novel_app.signals
