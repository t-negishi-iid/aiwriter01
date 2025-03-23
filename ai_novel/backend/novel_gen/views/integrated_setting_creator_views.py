"""
統合設定クリエイター関連のビュー
"""
import logging
import json
from rest_framework import permissions, status, views
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction

from ..models import AIStory, BasicSettingData
from ..serializers import IntegratedSettingCreatorSerializer

# ロガーの設定
logger = logging.getLogger('novel_gen')

class IntegratedSettingCreatorView(views.APIView):
    """
    統合設定クリエイターデータ作成ビュー

    フロントエンドから送信された基本設定データと選択状態を保存します。
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        """基本設定データと選択状態を保存"""
        story_id = kwargs.get('story_id')
        story = get_object_or_404(AIStory, id=story_id, user=request.user)

        # リクエストデータの処理
        try:
            # リクエストボディをログに記録（デバッグ用）
            logger.debug(f"リクエストボディ: {request.body}")

            # JSONデータの取得
            data = request.data
            logger.debug(f"パース後のデータ: {data}")

            # basic_setting_dataフィールドの確認
            if 'basic_setting_data' not in data:
                return Response({
                    'success': False,
                    'message': '基本設定が見つかりません',
                    'errors': {'basic_setting_data': ['このフィールドは必須です']}
                }, status=status.HTTP_400_BAD_REQUEST)

            # 既存のデータを取得または新規作成
            try:
                # 既存のデータを全て削除（1つの小説に1つの基本設定データのみを許可）
                existing_data = BasicSettingData.objects.filter(ai_story=story)
                if existing_data.exists():
                    logger.debug(f"既存の基本設定データを削除します: {existing_data.count()}件")
                    existing_data.delete()

                # シリアライザーのデータ準備
                serializer_data = {
                    'user': request.user.id,
                    'story': story.id,
                    'basic_setting_data': data.get('basic_setting_data', '')
                }
                
                # integrated_dataが存在する場合は追加
                if 'integrated_data' in data:
                    serializer_data['integrated_data'] = data.get('integrated_data')
                    logger.debug(f"選択状態データを保存します: {len(str(data.get('integrated_data')))}バイト")
                
                # 新規作成のためのシリアライザ
                serializer = IntegratedSettingCreatorSerializer(data=serializer_data)
            except Exception as e:
                logger.error(f"既存データの削除中にエラーが発生しました: {str(e)}")
                return Response({
                    'success': False,
                    'message': f'既存データの削除中にエラーが発生しました: {str(e)}',
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            if serializer.is_valid():
                # データを保存
                basic_setting_data = serializer.save(user=request.user, story=story)

                # 成功レスポンスを返す
                return Response({
                    'success': True,
                    'message': '基本設定が保存されました',
                    'data': IntegratedSettingCreatorSerializer(basic_setting_data).data
                }, status=status.HTTP_201_CREATED)
            else:
                # バリデーションエラーレスポンスを返す
                return Response({
                    'success': False,
                    'message': '基本設定の保存に失敗しました',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

        except json.JSONDecodeError:
            # JSONパースエラー
            return Response({
                'success': False,
                'message': 'JSONパースエラー',
                'errors': {'non_field_errors': ['無効なJSONフォーマットです']}
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            # その他の例外
            logger.error(f"統合設定クリエイターデータ保存エラー: {str(e)}")
            return Response({
                'success': False,
                'message': f'サーバーエラー: {str(e)}',
                'errors': {'non_field_errors': ['サーバー内部エラーが発生しました']}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class IntegratedSettingCreatorDetailView(views.APIView):
    """
    統合設定クリエイターデータ詳細ビュー

    指定された小説の基本設定データと選択状態を取得します。
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """基本設定データと選択状態を取得"""
        story_id = kwargs.get('story_id')
        story = get_object_or_404(AIStory, id=story_id, user=request.user)

        # 最新の基本設定データを取得
        try:
            basic_setting_data = BasicSettingData.objects.filter(
                ai_story=story
            ).latest('created_at')

            # APIレスポンス形式の標準化ポリシーに従ったレスポンス形式
            serialized_data = IntegratedSettingCreatorSerializer(basic_setting_data).data
            return Response({
                'success': True,
                'message': '基本設定データが正常に取得されました',
                'data': serialized_data
            })
        except BasicSettingData.DoesNotExist:
            # データが存在しない場合 - HTTP 204 はコンテンツが空を意味するためJSONパースエラーの原因になる
            # 代わりに HTTP 200 でデータがnullであることを示す
            return Response({
                'success': True,
                'message': '基本設定データは存在しませんが、新規作成可能です',
                'data': None
            }, status=status.HTTP_200_OK)
