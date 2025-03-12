# メモ


現在、以下のコンテナが実行されています：
ai_novel_backend - バックエンドサーバー（ポート8001）
ai_novel_db - PostgreSQLデータベース（ポート5433）
ai_novel_frontend - Next.jsフロントエンド（ポート3001）
ai_novel_redis - Redisサーバー（ポート6380）
Celeryワーカーとビートが実行されていないようです。docker-compose.ymlファイルにはCeleryサービスが定義されていますが、起動されていません。必要に応じて起動しましょう：
docker-compose up -d ai_novel_celery_worker ai_novel_celery_beat
t-negishi@ID2700-3 aiwriter01 % docker-compose up -d ai_novel_celery_worker ai_novel_celery_beat
no such service: ai_novel_celery_worker
t-negishi@ID2700-3 aiwriter01 %

docker-compose up -d ai_novel_celery_worker ai_novel_celery_beat

-negishi@ID2700-3 aiwriter01 % docker-compose up -d ai_novel_celery_worker ai_novel_celery_beat
no such service: ai_novel_celery_worker
t-negishi@ID2700-3 aiwriter01 %


現在のシステムの状態をまとめると：
バックエンドの問題は解決されました：
AIStoryAdminのis_completedフィールドの問題を修正
EpisodeContentとEpisodeDetailのフィールド名の衝突を解決
データベース接続の問題を解決（環境変数名の不一致を修正）
現在実行中のサービス：
バックエンド（Django）- ポート8001
フロントエンド（Next.js）- ポート3001
データベース（PostgreSQL）- ポート5433
Redis - ポート6380
マイグレーションが正常に適用され、データベーススキーマが作成されました。
これで、AI小説執筆支援システムの基本的なインフラストラクチャが整いました。システムは正常に動作しており、フロントエンドとバックエンドが連携できる状態です。
ブラウザで http://localhost:3001 にアクセスすると、フロントエンドのUIが表示されるはずです。また、http://localhost:8001/admin/ にアクセスすると、Djangoの管理画面が表示されます（ただし、管理者ユーザーを作成する必要があります）。
管理者ユーザーを作成するには、以下のコマンドを実行します：

docker-compose exec ai_novel_backend python manage.py createsuperuser

ユーザー名：root
メールアドレス：t-negishi@iid.co.jp
パスワード：いつもの

## 認証不要にする

バックエンドコンテナを再起動しました。これで、認証なしでAPIエンドポイントにアクセスできるようになるはずです。
問題が解決した内容をまとめると：
Django REST Frameworkのデフォルト設定では、DEFAULT_PERMISSION_CLASSESが'rest_framework.permissions.IsAuthenticated'に設定されており、すべてのAPIエンドポイントで認証が必要でした。
テストシステムなので認証を省略するために、DEFAULT_PERMISSION_CLASSESを'rest_framework.permissions.AllowAny'に変更しました。
これにより、認証なしでAPIエンドポイントにアクセスできるようになります。
これで、http://localhost:3001/stories/create にアクセスしてストーリーを作成できるようになるはずです。認証エラー（403 Forbidden）が解消されるはずです。
もし特定のエンドポイントだけ認証を必要とする場合は、そのビュークラスにpermission_classes属性を設定することで、個別に権限を設定することもできます。

バックエンドコンテナを再起動しました。これで、すべてのリクエストが自動的に認証されるようになり、デフォルトのユーザー（testuser）が使用されるようになります。
問題が解決した内容をまとめると：
Django REST Frameworkのビューでは、user=self.request.userというフィルタリングが行われており、認証が必要でした。
テスト用に簡易的な認証システムを実装するために、カスタム認証クラスAlwaysAuthenticatedAuthenticationを作成しました。
このクラスは常に認証済みとみなし、デフォルトのユーザー（testuser）を返します。
REST Frameworkの設定を変更して、このカスタム認証クラスを追加しました。
これにより、すべてのリクエストが自動的に認証され、デフォルトのユーザーが使用されるようになります。
これで、http://localhost:3001/stories/create にアクセスしてストーリーを作成できるようになるはずです。認証エラー（403 Forbidden）が解消されるはずです。
将来的にDjango-allauthを使ったシステムに移行する際には、このカスタム認証クラスを削除し、Django-allauthの認証システムを使用するように変更することができます。
