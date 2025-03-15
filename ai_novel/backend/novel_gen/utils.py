"""
AI小説執筆支援システムのユーティリティ関数
"""
import os
import json
import logging
from django.conf import settings
from typing import Dict, List, Any, Optional, Union, Tuple
from django.contrib.auth.models import User
from rest_framework.authentication import BaseAuthentication

logger = logging.getLogger(__name__)


def check_and_consume_credit(user, api_type: str) -> Tuple[bool, str]:
    """
    クレジットを確認して消費する

    Args:
        user: ユーザーモデルまたはユーザーID
        api_type: API種別

    Returns:
        Tuple[bool, str]: (成功フラグ, メッセージ)
    """
    from .models import UserProfile, CreditHistory

    # ユーザーIDの場合はUserオブジェクトを取得
    if isinstance(user, int):
        try:
            user = User.objects.get(id=user)
        except User.DoesNotExist:
            return False, "ユーザーが存在しません"

    # クレジット消費量マップ
    credit_map = {
        'basic_setting_data': 0,
        'basic_setting': 1,
        'character_detail': 2,
        'plot_detail': 2,
        'episode_detail': 3,
        'episode_content': 4,
        'title_episode': 1,
        'title_act': 1,
        'title_novel': 3
    }

    required_credit = credit_map.get(api_type, 0)

    try:
        profile = UserProfile.objects.get(user=user)

        if profile.has_sufficient_credit(required_credit):
            if required_credit > 0:  # クレジット0の場合は消費しない
                profile.use_credit(required_credit)
            return True, f"{required_credit}クレジットを消費しました"
        else:
            return False, f"クレジットが不足しています（必要: {required_credit}, 所持: {profile.credit}）"
    except Exception as e:
        logger.error(f"クレジット消費エラー: {str(e)}")
        return False, f"クレジット処理エラー: {str(e)}"


class AlwaysAuthenticatedAuthentication(BaseAuthentication):
    """
    開発用の簡易認証クラス。
    すべてのリクエストを認証済みとして扱い、デフォルトユーザーを返します。
    """
    def authenticate(self, request):
        # デフォルトユーザーを取得または作成
        user, created = User.objects.get_or_create(
            username='default_user',
            defaults={
                'email': 'default@example.com',
                'is_active': True
            }
        )
        return (user, None)
