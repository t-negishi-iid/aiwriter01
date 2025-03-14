"""
URL Configuration
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.documentation import include_docs_urls

urlpatterns = [
    # 管理画面
    path('admin/', admin.site.urls),

    # API: AI小説執筆支援
    path('api/', include('novel_gen.urls')),

    # /app/api/ へのアクセスにも対応
    path('app/api/', include('novel_gen.urls')),

    # API ドキュメント
    # path('api/docs/', include_docs_urls(title='AI Novel Writing API')), # coreapi不足のためコメントアウト
]

# デバッグモードの場合、静的ファイルの提供
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
