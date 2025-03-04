"""
ユーザー関連のビュー
"""
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404

from ..models import UserProfile, CreditHistory
from ..serializers import UserProfileSerializer, CreditHistorySerializer


class UserProfileView(generics.RetrieveAPIView):
    """
    ユーザープロファイル取得ビュー

    ログインユーザーのプロファイル情報を取得します。
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get_object(self):
        """ログインユーザーのプロファイルを取得"""
        # プロファイルが存在しない場合は作成する
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile


class CreditHistoryListView(generics.ListAPIView):
    """
    クレジット履歴一覧ビュー

    ログインユーザーのクレジット履歴を取得します。
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CreditHistorySerializer

    def get_queryset(self):
        """ログインユーザーのクレジット履歴を取得"""
        return CreditHistory.objects.filter(user=self.request.user).order_by('-created_at')
