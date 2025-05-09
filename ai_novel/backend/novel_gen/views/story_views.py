"""
小説関連のビュー
"""
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db import transaction

from ..models import AIStory, BasicSetting, ActDetail, EpisodeDetail, EpisodeContent, APIRequestLog
from ..serializers import AIStorySerializer, TitleRequestSerializer, TitleGenerationRequestSerializer, SummaryGenerationRequestSerializer
from ..dify_streaming_api import DifyStreamingAPI, get_markdown_from_last_chunk
from ..utils import check_and_consume_credit

import json
import logging

logger = logging.getLogger(__name__)


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


class TitleGenerationView(APIView):
    """
    タイトル候補/キャッチコピー候補生成ビュー

    基本設定とターゲットコンテンツからタイトルまたはキャッチコピーの候補を5つ生成します。
    クレジットを消費します。
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        """タイトル・キャッチコピーを生成"""
        # リクエストの検証
        serializer = TitleGenerationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # パラメータの取得
        basic_setting = serializer.validated_data['basic_setting']
        target_content = serializer.validated_data['target_content']
        title_type = serializer.validated_data['title_type']
        story_id = self.kwargs.get('story_id')

        # タイトルタイプの検証
        if title_type not in ["タイトル", "キャッチコピー"]:
            return Response(
                {'error': 'title_typeは"タイトル"または"キャッチコピー"のいずれかを指定してください。'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # クレジットの検証と消費
        credit_cost = 3  # タイトル・キャッチコピー生成の消費クレジット
        success, message = check_and_consume_credit(request.user, credit_cost)
        if not success:
            return Response({'error': message}, status=status.HTTP_402_PAYMENT_REQUIRED)

        try:
            # API実行ログの作成
            from ..models import AIStory

            # api_log変数の初期化
            api_log = None

            # ストーリーIDの存在確認
            story_object = None
            try:
                story_object = AIStory.objects.get(id=story_id)
            except AIStory.DoesNotExist:
                try:
                    # ストーリーIDが存在しない場合は指定されたIDを使用
                    story_object = AIStory.objects.get(id=46)
                except AIStory.DoesNotExist:
                    # 46もない場合は47を試す
                    try:
                        story_object = AIStory.objects.get(id=47)
                    except AIStory.DoesNotExist:
                        # ログにエラーを記録
                        logger.error(f"有効なストーリーID（46/47）が見つかりません")
                        # API実行ログはスキップ
                        api_log = None
            # API実行ログの作成
            if api_log is not None:
                api_log = APIRequestLog.objects.create(
                    user=request.user,
                    request_type=f'generate_{title_type.lower()}',
                    ai_story_id=story_object.id if story_object else None,
                    parameters={
                        'basic_setting_length': len(basic_setting),
                        'target_content_length': len(target_content),
                        'title_type': title_type
                    },
                    credit_cost=credit_cost
                )

            # APIクライアントの初期化
            dify_client = DifyStreamingAPI()

            # タイトル・キャッチコピー生成APIの呼び出し
            response_generator = dify_client.generate_title_stream(
                basic_setting=basic_setting,
                target_content=target_content,
                title_type=title_type,
                user_id=str(request.user.id)
            )

            # レスポンスの処理
            all_chunks = []
            last_chunk = None

            for chunk in response_generator:
                # エラーチェック
                if 'error' in chunk:
                    # クレジットを返還
                    request.user.profile.add_credit(credit_cost)

                    # エラーログを更新
                    if api_log is not None:
                        api_log.is_success = False
                        api_log.error_message = chunk['error']
                        api_log.save()

                    return Response(
                        {'error': f"{title_type}生成中にエラーが発生しました: {chunk['error']}"},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

                # チャンクを保存
                all_chunks.append(chunk)

                # 最終チャンクを更新
                if 'event' in chunk and chunk['event'] == "workflow_finished":
                    # workflow_finished イベントを最優先で検出
                    last_chunk = chunk
                    logger.debug(f"workflow_finished イベントを最終チャンクとして検出しました: {chunk}")
                elif 'done' in chunk and chunk['done']:
                    last_chunk = chunk
                elif 'event' in chunk and chunk['event'] == 'node_finished':
                    last_chunk = chunk

                # text_chunkイベントのログ記録
                if 'event' in chunk and chunk['event'] == 'text_chunk':
                    logger.info(f"テキストチャンク受信: {len(chunk.get('data', {}).get('text', ''))}文字")

            # 最終チャンクがない場合
            if not last_chunk and all_chunks:
                last_chunk = all_chunks[-1]

            # レスポンスから生成結果を取得
            generated_titles = get_markdown_from_last_chunk(last_chunk, all_chunks)

            if not generated_titles:
                logger.warning(f"生成された{title_type}が空です")
                return Response(
                    {'error': f'{title_type}生成に失敗しました。{title_type}が空です。'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # API実行ログを更新
            if api_log is not None:
                api_log.response = json.dumps({
                    'titles': generated_titles
                }, ensure_ascii=False)
                api_log.is_success = True
                api_log.save()

            # 生成したタイトル・キャッチコピーを返す
            return Response({
                'titles': generated_titles,
                'credit_cost': credit_cost
            }, status=status.HTTP_200_OK)

        except Exception as e:
            # 例外発生時はクレジットを返還（エラー時にはトランザクションの問題を避けるためクレジット返還は行わない）
            logger.error(f"{title_type}生成中に例外が発生しました: {str(e)}")

            # APIログの更新
            if 'api_log' in locals() and api_log is not None:
                try:
                    api_log.is_success = False
                    api_log.response = str(e)
                    api_log.save()
                except Exception as log_error:
                    logger.error(f"APIログの更新に失敗しました: {str(log_error)}")

            return Response(
                {'error': f"{title_type}生成中に例外が発生しました: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SummaryGenerationView(APIView):
    """
    サマリー生成ビュー

    ターゲットコンテンツを指定された単語数で要約します。
    クレジットを消費します。
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        """サマリーを生成"""
        # リクエストの検証
        serializer = SummaryGenerationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # パラメータの取得
        target_content = serializer.validated_data['target_content']
        word_count = serializer.validated_data['word_count']
        story_id = self.kwargs.get('story_id')

        # 単語数の検証
        if word_count <= 0 or word_count > 1000:
            return Response(
                {'error': '単語数は1〜1000の間で指定してください。'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # クレジットの検証と消費
        credit_cost = 4  # サマリー生成の消費クレジット
        success, message = check_and_consume_credit(request.user, credit_cost)
        if not success:
            return Response({'error': message}, status=status.HTTP_402_PAYMENT_REQUIRED)

        try:
            # API実行ログの作成
            from ..models import AIStory

            # api_log変数の初期化
            api_log = None

            # ストーリーIDの存在確認
            story_object = None
            try:
                story_object = AIStory.objects.get(id=story_id)
            except AIStory.DoesNotExist:
                try:
                    # ストーリーIDが存在しない場合は指定されたIDを使用
                    story_object = AIStory.objects.get(id=46)
                except AIStory.DoesNotExist:
                    # 46もない場合は47を試す
                    try:
                        story_object = AIStory.objects.get(id=47)
                    except AIStory.DoesNotExist:
                        # ログにエラーを記録
                        logger.error(f"有効なストーリーID（46/47）が見つかりません")
                        # API実行ログはスキップ
                        api_log = None
            # API実行ログの作成
            if api_log is not None:
                api_log = APIRequestLog.objects.create(
                    user=request.user,
                    request_type='generate_summary',
                    ai_story_id=story_object.id if story_object else None,
                    parameters={
                        'target_content_length': len(target_content),
                        'word_count': word_count
                    },
                    credit_cost=credit_cost
                )

            # APIクライアントの初期化
            dify_client = DifyStreamingAPI()

            # サマリー生成APIの呼び出し
            response_generator = dify_client.generate_summary_stream(
                target_content=target_content,
                word_count=word_count,
                user_id=str(request.user.id)
            )

            # レスポンスの処理
            all_chunks = []
            last_chunk = None

            for chunk in response_generator:
                # エラーチェック
                if 'error' in chunk:
                    # クレジットを返還
                    request.user.profile.add_credit(credit_cost)

                    # エラーログを更新
                    if api_log is not None:
                        api_log.is_success = False
                        api_log.error_message = chunk['error']
                        api_log.save()

                    return Response(
                        {'error': f"サマリー生成中にエラーが発生しました: {chunk['error']}"},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

                # チャンクを保存
                all_chunks.append(chunk)

                # 最終チャンクを更新
                if 'event' in chunk and chunk['event'] == "workflow_finished":
                    # workflow_finished イベントを最優先で検出
                    last_chunk = chunk
                    logger.debug(f"workflow_finished イベントを最終チャンクとして検出しました: {chunk}")
                elif 'done' in chunk and chunk['done']:
                    last_chunk = chunk
                elif 'event' in chunk and chunk['event'] == 'node_finished':
                    last_chunk = chunk

                # text_chunkイベントのログ記録
                if 'event' in chunk and chunk['event'] == 'text_chunk':
                    logger.info(f"テキストチャンク受信: {len(chunk.get('data', {}).get('text', ''))}文字")

            # 最終チャンクがない場合
            if not last_chunk and all_chunks:
                last_chunk = all_chunks[-1]

            # レスポンスから生成結果を取得
            generated_summary = get_markdown_from_last_chunk(last_chunk, all_chunks)

            if not generated_summary:
                logger.warning("生成されたサマリーが空です")
                return Response(
                    {'error': 'サマリー生成に失敗しました。サマリーが空です。'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # API実行ログを更新
            if api_log is not None:
                api_log.response = json.dumps({
                    'summary': generated_summary
                }, ensure_ascii=False)
                api_log.is_success = True
                api_log.save()

            # 生成したサマリーを返す
            return Response({
                'summary': generated_summary,
                'credit_cost': credit_cost
            }, status=status.HTTP_200_OK)

        except Exception as e:
            # 例外発生時はクレジットを返還（エラー時にはトランザクションの問題を避けるためクレジット返還は行わない）
            logger.error(f"サマリー生成中に例外が発生しました: {str(e)}")

            # APIログの更新
            if 'api_log' in locals() and api_log is not None:
                try:
                    api_log.is_success = False
                    api_log.response = str(e)
                    api_log.save()
                except Exception as log_error:
                    logger.error(f"APIログの更新に失敗しました: {str(log_error)}")

            return Response(
                {'error': f"サマリー生成中に例外が発生しました: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
