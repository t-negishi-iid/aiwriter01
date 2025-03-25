"""
エピソード詳細関連のビュー
"""
from rest_framework import generics, permissions, status, views
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.db import transaction, models
import logging
import json
import re
from ..dify_api import DifyNovelAPI
from ..dify_streaming_api import DifyStreamingAPI, get_markdown_from_last_chunk
from ..utils import check_and_consume_credit

logger = logging.getLogger(__name__)

from ..models import (
    AIStory, BasicSetting, CharacterDetail, ActDetail,
    EpisodeDetail, APIRequestLog
)
from ..serializers import (
    EpisodeDetailSerializer, EpisodeDetailRequestSerializer,
    EpisodeNumberUpdateSerializer, EpisodeCreateSerializer
)

class ActEpisodesListView(generics.ListCreateAPIView):
    """
    幕に属する全エピソードの一覧を取得、または新規エピソードを作成します。

    URL: /api/stories/{story_id}/acts/{act_number}/episodes/
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = EpisodeDetailSerializer

    def get_queryset(self):
        story_id = self.kwargs.get('story_id')
        act_number = self.kwargs.get('act_number')

        # 権限チェック
        story = get_object_or_404(AIStory, id=story_id, user=self.request.user)
        act = get_object_or_404(ActDetail, ai_story=story, act_number=act_number)

        return EpisodeDetail.objects.filter(act=act).order_by('episode_number')

    def create(self, request, *args, **kwargs):
        story_id = self.kwargs.get('story_id')
        act_number = self.kwargs.get('act_number')

        # 権限チェック
        story = get_object_or_404(AIStory, id=story_id, user=request.user)
        act = get_object_or_404(ActDetail, ai_story=story, act_number=act_number)

        # リクエストデータの検証
        serializer = EpisodeCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # 最後のエピソード番号を取得
        last_episode = EpisodeDetail.objects.filter(act=act).order_by('-episode_number').first()
        next_episode_number = 1 if last_episode is None else last_episode.episode_number + 1

        # 新しいエピソードを作成
        episode = EpisodeDetail.objects.create(
            act=act,
            episode_number=next_episode_number,
            title=serializer.validated_data['title'],
            content=serializer.validated_data['content']
        )

        # レスポンスを返す
        result_serializer = EpisodeDetailSerializer(episode)
        return Response(result_serializer.data, status=status.HTTP_201_CREATED)


class CreateEpisodesView(views.APIView):
    """
    Dify APIでActDetailから分割されたエピソード群を生成するビュー

    URL: /api/stories/{story_id}/acts/{act_number}/episodes/create/
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        """
        Dify APIで幕のエピソード群を生成し、保存する
        """
        # テストモードフラグの取得（デフォルトはFalse）
        test_mode = request.data.get('test_mode', False)
        
        # ストーリーIDとアクト番号の取得
        story_id = kwargs.get('story_id')
        act_number = kwargs.get('act_number')
        
        # リクエストからデータを取得
        data = request.data
        episode_count = int(data.get('episode_count', 3))
        
        # 権限チェック
        story = get_object_or_404(AIStory, id=story_id, user=request.user)
        act = get_object_or_404(ActDetail, ai_story=story, act_number=act_number)

        # リクエストパラメータの検証
        serializer = EpisodeDetailRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        episode_count = serializer.validated_data['episode_count']

        # basic_setting_idを取得
        basic_setting_id = serializer.validated_data.get('basic_setting_id')
        if not basic_setting_id:
            return Response(
                {'error': '作品設定IDが指定されていません。'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 作品設定の取得
        try:
            basic_setting = BasicSetting.objects.get(id=basic_setting_id)
        except BasicSetting.DoesNotExist:
            return Response(
                {'error': '指定された作品設定が存在しません。'},
                status=status.HTTP_400_BAD_REQUEST
            )


        # キャラクター詳細の取得
        character_details = CharacterDetail.objects.filter(ai_story=story)
        if not character_details.exists():
            return Response(
                {'error': 'キャラクター詳細が存在しません。先にキャラクター詳細を作成してください。'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # クレジットの確認と消費
        success, message = check_and_consume_credit(request.user, 'episode_detail')
        if not success:
            return Response({'error': message}, status=status.HTTP_402_PAYMENT_REQUIRED)

        # story_idから全キャラクターのCharacterDetail.raw_contentを取得して配列化
        character_details_raw_content = [char.raw_content for char in character_details]

        # story_idから全ActのActDetail.raw_contentを取得して配列化
        act_details = ActDetail.objects.filter(ai_story=story)
        all_act_raw_content = [act.raw_content for act in act_details]

        # APIログの作成
        api_log = APIRequestLog.objects.create(
            user=request.user,
            request_type='episode_detail',
            ai_story=story,
            parameters={
                'story_id': story_id,
                'act_number': act_number,
                'episode_count': episode_count
            },
            credit_cost=3
        )

        # 最終応答を格納する変数
        final_response = None
        
        try:
            # ストリーミングAPIクライアントの初期化
            api = DifyStreamingAPI(test_mode=test_mode)
            
            # 最後のチャンクを保持する変数
            last_chunk = None
            all_chunks = []
            
            # ログにデバッグ情報を出力
            logger.debug(f"DEBUG - CreateEpisodesView - ストリーミングAPIリクエスト開始: act_id={act.id}, episode_count={episode_count}, test_mode={test_mode}")
            
            # テストモードの場合、ストリーミングレスポンスとして返すためのレスポンスを初期化
            if test_mode:
                from django.http import StreamingHttpResponse
                
                def stream_response():
                    try:
                        # ターゲット幕の情報を辞書形式で準備（act_numberを含める）
                        target_act_data = {
                            "act_number": act.act_number,
                            "content": act.raw_content
                        }
                        
                        # ストリーミングAPIリクエストを実行し、リアルタイムでチャンクを返す
                        for chunk in api.create_episode_details_stream(
                            basic_setting=basic_setting.raw_content,
                            all_characters_list=character_details_raw_content,
                            all_act_details_list=all_act_raw_content,
                            target_act_detail=target_act_data,
                            episode_count=episode_count,
                            user_id=str(request.user.id),
                            test_mode=True
                        ):
                            # 最後のチャンクを更新
                            if chunk:
                                last_chunk = chunk
                                all_chunks.append(chunk)
                                
                                # JSONデータをシリアライズしてバイトに変換
                                chunk_data = json.dumps(chunk) + "\n"
                                yield chunk_data.encode('utf-8')
                                
                                # デバッグ用にチャンクの概要をログ
                                if "event" in chunk:
                                    logger.debug(f"DEBUG - CreateEpisodesView - チャンク返送: event={chunk['event']}")
                        
                        # すべてのチャンクの処理後、Markdownコンテンツを抽出
                        markdown_content = get_markdown_from_last_chunk(last_chunk, all_chunks)
                        logger.debug(f"DEBUG - CreateEpisodesView - 最終Markdownデータ抽出完了: {len(markdown_content)} 文字")
                        
                        # 最終結果としてMarkdownデータを返す
                        final_result = {"markdown_content": markdown_content, "status": "completed"}
                        yield (json.dumps(final_result) + "\n").encode('utf-8')
                        
                    except Exception as stream_error:
                        logger.error(f"DEBUG - CreateEpisodesView - ストリーミングエラー: {str(stream_error)}")
                        error_response = {"error": str(stream_error), "status": "error"}
                        yield (json.dumps(error_response) + "\n").encode('utf-8')
                
                # StreamingHttpResponseを返す
                return StreamingHttpResponse(
                    streaming_content=stream_response(),
                    content_type='application/json'
                )
            
            # 通常モード（テストモードでない場合）の処理
            else:
                # ターゲット幕の情報を辞書形式で準備（act_numberを含める）
                target_act_data = {
                    "act_number": act.act_number,
                    "content": act.raw_content
                }
                
                # ストリーミングリクエスト実行
                for chunk in api.create_episode_details_stream(
                    basic_setting=basic_setting.raw_content,
                    all_characters_list=character_details_raw_content,
                    all_act_details_list=all_act_raw_content,
                    target_act_detail=target_act_data,
                    episode_count=episode_count,
                    user_id=str(request.user.id),
                    test_mode=test_mode
                ):
                    # 最後のチャンクを更新
                    if chunk:
                        last_chunk = chunk
                        all_chunks.append(chunk)
                        
                        # デバッグ用にチャンクの概要をログ
                        if "event" in chunk:
                            logger.debug(f"DEBUG - CreateEpisodesView - チャンク受信: event={chunk['event']}")
            # デバッグ用ログ
            logger.debug(f"DEBUG - CreateEpisodesView - Received all chunks, processing final result")
            
            # 最後のチャンクからMarkdownコンテンツを抽出
            if not last_chunk:
                raise ValueError("有効なレスポンスが取得できませんでした")
                
            raw_text = get_markdown_from_last_chunk(last_chunk, all_chunks)
            if not raw_text:
                logger.error(f"DEBUG - CreateEpisodesView - 最終チャンクから有効な内容を抽出できませんでした")
                logger.error(f"DEBUG - CreateEpisodesView - 最終チャンク: {json.dumps(last_chunk, ensure_ascii=False)[:500]}...")
                raise ValueError("APIレスポンスから有効なコンテンツを抽出できませんでした")

            # APIログにレスポンスの先頭部分を記録（デバッグ用）
            logger.debug(f"DEBUG - CreateEpisodesView - 抽出した結果（先頭100文字）: {raw_text[:100]}")

            # エピソードのパターンを定義 - 「### エピソード{数字}「{タイトル}」」の形式
            episode_pattern = r'### エピソード(\d+)「([^」]+)」'

            # マークダウンコンテンツを分割
            episodes = []
            current_position = 0

            for match in re.finditer(episode_pattern, raw_text):
                episode_num = match.group(1)
                episode_title = match.group(2)
                start_pos = match.start()

                # 前のエピソードの終了位置を現在のエピソードの開始位置とする
                if current_position > 0 and episodes:
                    episode_content = raw_text[current_position:start_pos].strip()
                    episodes[-1]['content'] = episode_content

                # 新しいエピソードを追加
                episodes.append({
                    'number': episode_num,
                    'title': episode_title,
                    'start_pos': start_pos,
                    'content': ''  # 後で設定
                })

                current_position = start_pos

            # 最後のエピソードの内容を設定
            if episodes:
                episodes[-1]['content'] = raw_text[episodes[-1]['start_pos']:].strip()

            # 抽出されたエピソードが存在しない場合はエラーを返す
            if not episodes:
                api_log.is_success = False
                api_log.response = "エピソードのパースに失敗しました"
                api_log.save()
                return Response(
                    {'error': 'エピソードの抽出に失敗しました', 'details': 'APIレスポンスからエピソードを抽出できませんでした。', 'raw_text': raw_text[:500]},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # エピソードが正常に抽出できた場合のみ、この幕（act）の既存のエピソードを削除
            # act_idを明示的に指定して削除する
            logger.debug(f"DEBUG - CreateEpisodesView - 幕ID {act.id} のエピソードを削除します")
            deleted_count = EpisodeDetail.objects.filter(act=act).delete()[0]
            logger.debug(f"DEBUG - CreateEpisodesView - 幕ID {act.id} のエピソード {deleted_count} 件を削除しました")

            # エピソードモデルの作成
            created_episodes = []
            for episode_data in episodes:
                # エピソード番号とタイトルを取得
                episode_number = int(episode_data['number'])
                episode_title = episode_data['title']

                # エピソード内容を取得し、見出しを除去
                content = episode_data['content']
                # エピソード見出しのパターン
                episode_header = f"### エピソード{episode_data['number']}「{episode_data['title']}」"

                # 内容から見出しを削除（見出しが内容の先頭にある場合）
                if content.strip().startswith(episode_header):
                    content = content.replace(episode_header, "", 1).strip()

                # 既存のエピソードを確認
                existing_episode = EpisodeDetail.objects.filter(
                    ai_story=story,
                    act_number=act_number,
                    episode_number=episode_number
                ).first()

                if existing_episode:
                    # 既存エピソードの更新
                    existing_episode.title = episode_title
                    existing_episode.content = content
                    existing_episode.raw_content = json.dumps({
                        'episode_number': episode_number,
                        'title': episode_title,
                        'content': content
                    })
                    existing_episode.save()
                    created_episodes.append(existing_episode)
                else:
                    # 新規エピソードの作成
                    episode = EpisodeDetail.objects.create(
                        ai_story=story,
                        act_number=act_number,
                        episode_number=episode_number,
                        title=episode_title,
                        content=content,
                        raw_content=json.dumps({
                            'episode_number': episode_number,
                            'title': episode_title,
                            'content': content
                        })
                    )
                    created_episodes.append(episode)

            # APIログの更新
            api_log.is_success = True
            api_log.response = str(episodes)
            api_log.save()

            # レスポンスを返す
            serializer = EpisodeDetailSerializer(created_episodes, many=True)
            return Response({
                'count': len(created_episodes),
                'next': None,
                'previous': None,
                'results': serializer.data,
                'status': 'success'
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            # エラーログ
            api_log.is_success = False
            api_log.response = str(e)
            api_log.save()
            return Response(
                {'error': 'エピソード詳細の生成に失敗しました', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EpisodeDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    エピソードの取得・更新・削除ビュー

    URL: /api/stories/{story_id}/acts/{act_number}/episodes/{episode_number}/
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = EpisodeDetailSerializer

    def get_object(self):
        story_id = self.kwargs.get('story_id')
        act_number = self.kwargs.get('act_number')
        episode_number = self.kwargs.get('episode_number', self.kwargs.get('pk'))

        # 権限チェック
        story = get_object_or_404(AIStory, id=story_id, user=self.request.user)
        act = get_object_or_404(ActDetail, ai_story=story, act_number=act_number)

        return get_object_or_404(EpisodeDetail, act=act, episode_number=episode_number)

    def update(self, request, *args, **kwargs):
        # 通常の更新処理のみを行う
        return super().update(request, *args, **kwargs)
