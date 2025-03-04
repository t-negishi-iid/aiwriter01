"""
API実行ログ関連のビュー
"""
from rest_framework import generics, permissions
from django.shortcuts import get_object_or_404

from ..models import AIStory, APIRequestLog
from ..serializers import APIRequestLogSerializer


class APIRequestLogListView(generics.ListAPIView):
    """
    API実行ログ一覧ビュー

    指定された小説のAPI実行ログ一覧を取得します。
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = APIRequestLogSerializer

    def get_queryset(self):
        """指定された小説のAPI実行ログ一覧を取得"""
        story_id = self.kwargs.get('story_id')
        story = get_object_or_404(AIStory, id=story_id, user=self.request.user)
        return APIRequestLog.objects.filter(
            ai_story=story
        ).order_by('-created_at')
