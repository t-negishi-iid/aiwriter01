"""
URL設定
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# REST Frameworkのルーター設定
router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'stories', views.AIStoryViewSet)
router.register(r'basic-setting-data', views.BasicSettingDataViewSet)
router.register(r'basic-settings', views.BasicSettingViewSet)
router.register(r'characters', views.CharacterDetailViewSet)
router.register(r'plots', views.PlotDetailViewSet)
router.register(r'episodes', views.EpisodeDetailViewSet)
router.register(r'episode-contents', views.EpisodeContentViewSet)

app_name = 'novel_app'

urlpatterns = [
    # REST Framework API ルート
    path('', include(router.urls)),
]
