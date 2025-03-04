"""
小説関連のビュー
"""
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction

from ..models import AIStory
from ..serializers import AIStorySerializer


class AIStoryListCreateView(generics.ListCreateAPIView):
    """
    小説一覧・作成ビュー

    ログインユーザーの小説一覧を取得、または新規小説を作成します。
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AIStorySerializer

    def get_queryset(self):
        """ログインユーザーの小説一覧を取得"""
        return AIStory.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        """小説作成時にユーザーを設定"""
        serializer.save(user=self.request.user)


class AIStoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    小説詳細・更新・削除ビュー

    ログインユーザーの指定された小説を取得、更新、または削除します。
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AIStorySerializer
    lookup_url_kwarg = 'pk'

    def get_queryset(self):
        """ログインユーザーの小説一覧を取得"""
        return AIStory.objects.filter(user=self.request.user)
