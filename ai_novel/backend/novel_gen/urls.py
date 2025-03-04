"""
AI小説執筆支援システムのURLルーティング
"""
from django.urls import path
from . import views

app_name = 'novel_gen'

urlpatterns = [
    # ユーザー関連
    path('user/profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('user/credit-history/', views.CreditHistoryListView.as_view(), name='credit-history'),

    # 小説関連
    path('stories/', views.AIStoryListCreateView.as_view(), name='story-list'),
    path('stories/<int:pk>/', views.AIStoryDetailView.as_view(), name='story-detail'),

    # 基本設定作成用データ関連
    path('options/', views.OptionsView.as_view(), name='options'),
    path('stories/<int:story_id>/basic-setting-data/',
         views.BasicSettingDataCreateView.as_view(), name='basic-setting-data-create'),
    path('stories/<int:story_id>/basic-setting-data/<int:pk>/',
         views.BasicSettingDataDetailView.as_view(), name='basic-setting-data-detail'),
    path('preview-basic-setting-data/',
         views.PreviewBasicSettingDataView.as_view(), name='preview-basic-setting-data'),

    # 基本設定関連
    path('stories/<int:story_id>/basic-setting/',
         views.BasicSettingCreateView.as_view(), name='basic-setting-create'),
    path('stories/<int:story_id>/basic-setting/<int:pk>/',
         views.BasicSettingDetailView.as_view(), name='basic-setting-detail'),

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
