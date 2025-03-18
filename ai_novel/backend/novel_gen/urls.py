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
from .views.basic_setting_views import LatestBasicSettingView, BasicSettingActUpdateView

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
    path('stories/', views.AIStoryListCreateView.as_view(), name='story-list'),
    path('stories/<int:pk>/', views.AIStoryDetailView.as_view(), name='story-detail'),

    # 基本設定作成用データ作成関連
    path('stories/<int:story_id>/integrated-setting-creator/',
         IntegratedSettingCreatorView.as_view(), name='integrated-setting-creator'),
    path('stories/<int:story_id>/integrated-setting-creator/detail/',
         IntegratedSettingCreatorDetailView.as_view(), name='integrated-setting-creator-detail'),

    # 基本設定関連
    path('stories/<int:story_id>/basic-setting/',
         views.BasicSettingCreateView.as_view(), name='basic-setting-create'),
    path('stories/<int:story_id>/basic-setting/<int:pk>/',
         views.BasicSettingDetailView.as_view(), name='basic-setting-detail'),
    path('stories/<int:story_id>/latest-basic-setting/',
         LatestBasicSettingView.as_view(), name='latest-basic-setting'),
    path('stories/<int:story_id>/basic-setting-act/<int:act_number>/',
         BasicSettingActUpdateView.as_view(), name='basic-setting-act-update'),

    # キャラクター詳細関連
    path('stories/<int:story_id>/characters/',
         views.CharacterDetailListCreateView.as_view(), name='character-list'),
    path('stories/<int:story_id>/characters/<int:pk>/',
         views.CharacterDetailView.as_view(), name='character-detail'),
    path('stories/<int:story_id>/create-character-detail/',
         views.CreateCharacterDetailView.as_view(), name='create-character-detail'),

    # あらすじ詳細関連
    path('stories/<int:story_id>/acts/',
         views.ActDetailListView.as_view(), name='act-list'),
    path('stories/<int:story_id>/acts/<int:pk>/',
         views.ActDetailView.as_view(), name='act-detail'),
    path('stories/<int:story_id>/create-plot-detail/',
         views.CreatePlotDetailView.as_view(), name='create-plot-detail'),

    # エピソード詳細関連
    path('acts/<int:act_id>/episodes/',
         views.EpisodeDetailListView.as_view(), name='episode-list'),
    path('acts/<int:act_id>/episodes/<int:pk>/',
         views.EpisodeDetailView.as_view(), name='episode-detail'),
    path('stories/<int:story_id>/create-episode-details/',
         views.CreateEpisodeDetailsView.as_view(), name='create-episode-details'),
    path('stories/<int:story_id>/episodes/',
         views.StoryEpisodesListView.as_view(), name='story-episodes-list'),

    # エピソード本文関連
    path('episodes/<int:episode_id>/content/',
         views.EpisodeContentView.as_view(), name='episode-content'),
    path('stories/<int:story_id>/create-episode-content/',
         views.CreateEpisodeContentView.as_view(), name='create-episode-content'),

    # タイトル生成関連
    path('stories/<int:story_id>/generate-title/',
         views.GenerateTitleView.as_view(), name='generate-title'),

    # API履歴
    path('stories/<int:story_id>/api-logs/',
         views.APIRequestLogListView.as_view(), name='api-log-list'),
]
