"""
Django settings for AI小説執筆支援システム.
"""
import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-default-key-for-dev')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # サードパーティアプリ
    'rest_framework',
    'corsheaders',
    'django_filters',
    'drf_spectacular',

    # 自作アプリ
    'novel_gen',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # 静的ファイル配信
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # CORS
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('POSTGRES_DB', 'ai_novel_db'),
        'USER': os.environ.get('POSTGRES_USER', 'ai_novel_user'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD', 'ai_novel_password'),
        'HOST': os.environ.get('POSTGRES_HOST', 'ai_novel_db'),
        'PORT': os.environ.get('POSTGRES_PORT', '5432'),
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'ja'
TIME_ZONE = 'Asia/Tokyo'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS設定
CORS_ALLOWED_ORIGINS = os.environ.get(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:3001,http://127.0.0.1:3001'
).split(',')

# REST Framework設定
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# DRF Spectacular設定
SPECTACULAR_SETTINGS = {
    'TITLE': 'AI小説執筆支援システム API',
    'DESCRIPTION': 'Dify APIを使用した小説執筆支援システムのAPI仕様書',
    'VERSION': '0.1.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

# Celery設定
CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://ai_novel_redis:6379/1')
CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://ai_novel_redis:6379/2')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# ロギング設定
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'logs/debug.log'),
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': os.environ.get('DJANGO_LOG_LEVEL', 'INFO'),
            'propagate': True,
        },
        'novel_gen': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}

# Dify API設定
DIFY_API_KEYS = {
    "basic_setting_data": os.environ.get("DIFY_API_KEY_BASIC_SETTING_DATA", "app-RVzFPhndqQyflqMxkmBAx8uV"),
    "basic_setting": os.environ.get("DIFY_API_KEY_BASIC_SETTING", "app-X1e1XPXOKzot8lWteTdVCgey"),
    "character_detail": os.environ.get("DIFY_API_KEY_CHARACTER_DETAIL", "app-zd3lFB9WVQNBY6jMhyI6mJPl"),
    "plot_detail": os.environ.get("DIFY_API_KEY_PLOT_DETAIL", "app-PYmSirQZfKrIE7mK0dtgBCww"),
    "episode_detail": os.environ.get("DIFY_API_KEY_EPISODE_DETAIL", "app-BCSZGXvGxReumppDeWaYD8CM"),
    "episode_content": os.environ.get("DIFY_API_KEY_EPISODE_CONTENT", "app-J845W1BSeaOD3z4hKVGQ5aQu"),
    "title": os.environ.get("DIFY_API_KEY_TITLE", "app-wOwBxUnKb9kA8BYqQinc8Mb9")
}
DIFY_API_ENDPOINT = os.environ.get("DIFY_API_ENDPOINT", "https://api.dify.ai/v1/chat-messages")

# 開発環境設定
DEVELOPMENT_MODE = os.environ.get('DEVELOPMENT_MODE', 'True') == 'True'
INITIAL_USER_CREDIT = int(os.environ.get('INITIAL_USER_CREDIT', '100'))

# ログ出力用ディレクトリの作成
LOGS_DIR = os.path.join(BASE_DIR, 'logs')
if not os.path.exists(LOGS_DIR):
    os.makedirs(LOGS_DIR)
