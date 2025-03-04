from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from django.conf import settings

from .models import UserProfile


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """ユーザー作成時にプロファイルを自動生成"""
    if created:
        # 開発環境設定のINITIAL_USER_CREDIT値を初期クレジットとして使用
        initial_credit = getattr(settings, 'INITIAL_USER_CREDIT', 100)
        UserProfile.objects.create(user=instance, credit=initial_credit)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """ユーザー更新時にプロファイルも更新"""
    if hasattr(instance, 'profile'):
        instance.profile.save()
