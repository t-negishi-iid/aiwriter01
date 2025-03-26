"""
AI小説執筆支援システムのURLルーティング
"""
from django.urls import path, include
from rest_framework import routers
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.reverse import reverse

from . import views
from .views.connectivity import is_live
from .views.is_live_views import StoryIsLiveView
from .views.integrated_setting_creator_views import IntegratedSettingCreatorView, IntegratedSettingCreatorDetailView
from .views.basic_setting_views import LatestBasicSettingView
from .views.content_views import CreateEpisodeContentView, EpisodeContentListView, EpisodeContentDetailView

app_name = 'novel_gen'

@api_view(['GET'])
def api_root(request, format=None):
    """
    API ルートエンドポイント
    利用可能なエンドポイントの一覧を返します。
    """
    return Response({
        'user-profile': reverse('novel_gen:user-profile', request=request, format=format),
        'credit-history': reverse('novel_gen:credit-history', request=request, format=format),
        'stories': reverse('novel_gen:story-list', request=request, format=format),
        'is_live': reverse('novel_gen:is-live', request=request, format=format),
        'create-plot-detail': reverse('novel_gen:create-plot-detail', args=[1], request=request, format=format),
        'basic-setting-create': reverse('novel_gen:basic-setting-create', args=[1], request=request, format=format),
        'character-create': reverse('novel_gen:character-create', args=[1], request=request, format=format),
        'act-create': reverse('novel_gen:act-create', args=[1], request=request, format=format),
        'episodes-create': reverse('novel_gen:episodes-create', args=[1, 1], request=request,format=format),
        'content-create': reverse('novel_gen:content-create', args=[1, 1, 1], request=request,format=format),
        'title-generate': reverse('novel_gen:title-generate', args=[1], request=request,format=format),
        'api-log-list': reverse('novel_gen:api-log-list', args=[1], request=request,format=format),

    })

urlpatterns = [
    # API ルート
    path('', api_root, name='api-root'),

    # 疎通確認用エンドポイント
    path('is_live/', is_live, name='is-live'),

    # 小説ごとの疎通確認用エンドポイント
    path('stories/<int:story_id>/is_live/', StoryIsLiveView.as_view(), name='story-is-live'),

    # ユーザー関連
    path('user/profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('user/credit-history/', views.CreditHistoryListView.as_view(), name='credit-history'),

    # 小説関連
    # 小説一覧取得・作成
    path('stories/', views.AIStoryListCreateView.as_view(), name='story-list'),
    # 小説詳細取得・更新・削除
    path('stories/<int:pk>/', views.AIStoryDetailView.as_view(), name='story-detail'),

    # 基本設定関連
    # 基本設定作成
    path('stories/<int:story_id>/integrated-setting-creator/',
         IntegratedSettingCreatorView.as_view(), name='integrated-setting-creator'),
    # 基本設定の詳細取得
    path('stories/<int:story_id>/integrated-setting-creator/detail/',
         IntegratedSettingCreatorDetailView.as_view(), name='integrated-setting-creator-detail'),

    # 作品設定関連
    # Dify APIで指定されたストーリーの作品設定を基本設置データから生成する
    path('stories/<int:story_id>/basic-setting/',
         views.BasicSettingCreateView.as_view(), name='basic-setting-create'),
    # 指定されたストーリーの指定された作品設定を取得、更新、削除する
    path('stories/<int:story_id>/basic-setting/<int:pk>/',
         views.BasicSettingDetailView.as_view(), name='basic-setting-detail'),
    # ストーリーの最新の作品設定を取得する（Old）
    path('stories/<int:story_id>/latest-basic-setting/',
         LatestBasicSettingView.as_view(), name='latest-basic-setting-old'),
    # ストーリーの最新の作品設定を取得する（New）
    path('stories/<int:story_id>/basic-setting/latest/',
         LatestBasicSettingView.as_view(), name='latest-basic-setting'),
    # BasicSettingの幕あらすじの更新
    path('stories/<int:story_id>/basic-setting/acts/<int:act_number>/',
         views.BasicSettingDetailView.as_view(), name='basic-setting-act-update'),

    # キャラクター詳細関連
    # 指定されたストーリーのキャラクター詳細一覧を取得、または新規キャラクター詳細を作成する
    path('stories/<int:story_id>/characters/',
         views.CharacterDetailListCreateView.as_view(), name='character-list'),
    # 指定されたストーリーの指定されたキャラクター詳細を取得、更新、削除する
    path('stories/<int:story_id>/characters/<int:pk>/',
         views.CharacterDetailView.as_view(), name='character-detail'),
     # Dify APIで新規キャラクター詳細を作成する（old）
    path('stories/<int:story_id>/create-character-detail/',
         views.CreateCharacterDetailView.as_view(), name='create-character-detail'),
     # Dify API新規キャラクター詳細を作成する（New）
    path('stories/<int:story_id>/characters/create',
         views.CreateCharacterDetailView.as_view(), name='character-create'),

    # あらすじ詳細関連
    # 指定されたストーリーの幕詳細一覧を取得、または新規幕詳細を作成する
    path('stories/<int:story_id>/acts/',
         views.ActDetailListView.as_view(), name='act-list'),
    # 指定されたストーリーの指定された幕詳細を取得、更新、削除する
    path('stories/<int:story_id>/acts/<int:pk>/',
         views.ActDetailView.as_view(), name='act-detail'),
    # Dify APIで新規幕詳細を作成する（old）
    path('stories/<int:story_id>/create-plot-detail/',
         views.CreatePlotDetailView.as_view(), name='create-plot-detail'),
    # Dify API新規幕詳細を作成する（New）
    path('stories/<int:story_id>/acts/create/',
         views.CreatePlotDetailView.as_view(), name='act-create'),

    # エピソード詳細関連
    # Dify APIでActDetailから分割されたエピソード群を生成する
    path('stories/<int:story_id>/acts/<int:act_number>/episodes/create/',
         views.CreateEpisodesView.as_view(), name='episodes-create'),
    # 指定されたストーリーの指定された幕のエピソード一覧を取得または新規エピソードを作成する
    path('stories/<int:story_id>/acts/<int:act_number>/episodes/',
         views.ActEpisodesListView.as_view(), name='act-episodes-list'),
    # 指定されたストーリーの指定された幕の指定されたエピソードを取得、更新、削除する
    path('stories/<int:story_id>/acts/<int:act_number>/episodes/<int:pk>/',
         views.EpisodeDetailView.as_view(), name='episode-detail'),

    # エピソード本文関連
    # 特定のエピソードのコンテンツを生成する
    path('stories/<int:story_id>/acts/<int:act_number>/episodes/<int:episode_number>/content/create/',
         CreateEpisodeContentView.as_view(), name='content-create'),
    # 特定の幕に属するすべてのエピソードコンテンツを一覧表示、もしくは新規エピソードコンテンツを作成する
    path('stories/<int:story_id>/acts/<int:act_number>/content/',
         EpisodeContentListView.as_view(), name='episode-content-list'),
    # 特定のエピソードのコンテンツを取得、更新、削除する
    path('stories/<int:story_id>/acts/<int:act_number>/episodes/<int:episode_number>/content/',
         EpisodeContentDetailView.as_view(), name='episode-content-detail'),

    # タイトル生成関連
    path('stories/<int:story_id>/generate-title/',
         views.GenerateTitleView.as_view(), name='title-generate'),

    # API履歴
    path('stories/<int:story_id>/api-logs/',
         views.APIRequestLogListView.as_view(), name='api-log-list'),
]
