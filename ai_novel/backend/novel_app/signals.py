"""
Signal handlers for novel app
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import UserProfile, Credit


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    新規ユーザー作成時にプロフィールとクレジットを作成
    """
    if created:
        UserProfile.objects.create(user=instance)
        Credit.objects.create(user=instance, amount=100)  # 新規ユーザーに100クレジット付与
