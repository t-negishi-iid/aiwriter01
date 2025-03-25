#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Dify Streaming API - エピソード詳細生成のテスト用スクリプト
"""

import os
import time
import json
import datetime
import logging
import re
from typing import List, Dict, Any, Tuple

# ロガーの設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# プロジェクトのルートディレクトリへのパスを設定
PROJECT_ROOT = os.path.abspath(os.path.join(
    os.path.dirname(__file__), "../.."))

# DifyStreamingAPIをインポート
import sys
sys.path.append(PROJECT_ROOT)

from novel_gen.dify_streaming_api import DifyStreamingAPI, get_markdown_from_last_chunk


def load_test_data(file_path: str) -> str:
    """
    テストデータをファイルから読み込む

    Args:
        file_path: ファイルパス

    Returns:
        str: ファイルの内容
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        logger.error(f"ファイル読み込みエラー: {file_path}, {e}")
        return ""


def get_timestamp() -> str:
    """
    現在のタイムスタンプを取得

    Returns:
        str: タイムスタンプ文字列 (YYYYMMDD_HHMMSS)
    """
    return datetime.datetime.now().strftime("%Y%m%d_%H%M%S")


def create_output_files(test_name: str) -> Tuple[str, str]:
    """
    出力ファイルのパスを生成

    Args:
        test_name: テスト名

    Returns:
        Tuple[str, str]: (ログファイルパス, 結果ファイルパス)
    """
    timestamp = get_timestamp()
    output_dir = os.path.join(os.path.dirname(__file__), "output")
    
    # ディレクトリが存在しない場合は作成
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    log_file = os.path.join(output_dir, f"{test_name}_log_{timestamp}.txt")
    result_file = os.path.join(output_dir, f"{test_name}_result_{timestamp}.txt")
    
    return log_file, result_file


def load_all_characters(characters_dir: str) -> List[Dict[str, Any]]:
    """
    キャラクターディレクトリから全キャラクターファイルを読み込み、リストとして返す

    Args:
        characters_dir: キャラクターファイルのディレクトリパス

    Returns:
        List[Dict[str, Any]]: キャラクター情報のリスト
    """
    logger.info(f"キャラクターディレクトリ: {characters_dir}")
    
    character_files = [f for f in os.listdir(characters_dir) if f.endswith(".txt")]
    logger.info(f"キャラクターファイル数: {len(character_files)}")
    
    characters_list = []
    
    for file_name in character_files:
        logger.info(f"キャラクターファイル読み込み: {file_name}")
        file_path = os.path.join(characters_dir, file_name)
        content = load_test_data(file_path)
        
        # キャラクター名を取得（ファイル名から抽出）
        character_name = file_name.split('_result_')[0]
        
        # キャラクター情報を辞書として追加
        character_info = {
            "name": character_name,
            "content": content
        }
        
        characters_list.append(character_info)
    
    return characters_list


def load_all_acts(acts_dir: str) -> List[Dict[str, Any]]:
    """
    幕詳細ディレクトリから全幕詳細ファイルを読み込み、リストとして返す

    Args:
        acts_dir: 幕詳細ファイルのディレクトリパス

    Returns:
        List[Dict[str, Any]]: 幕詳細情報のリスト
    """
    logger.info(f"幕詳細ディレクトリ: {acts_dir}")
    
    act_files = [f for f in os.listdir(acts_dir) if f.endswith(".txt")]
    logger.info(f"幕詳細ファイル数: {len(act_files)}")
    
    acts_list = []
    
    for file_name in act_files:
        logger.info(f"幕詳細ファイル読み込み: {file_name}")
        file_path = os.path.join(acts_dir, file_name)
        content = load_test_data(file_path)
        
        # 幕番号を取得（ファイル名から抽出）
        act_number = file_name.split('_')[0].replace('act', '')
        
        # 幕情報を辞書として追加
        act_info = {
            "act_number": act_number,
            "content": content
        }
        
        acts_list.append(act_info)
    
    return acts_list


def test_create_episode_details_stream_single_act(test_mode: bool = False):
    """
    create_episode_details_streamメソッドのテスト（単一の幕）
    """
    logger.info("===== create_episode_details_streamメソッドのテスト開始（単一の幕） =====")

    # テストデータの読み込み
    basic_setting_path = os.path.join(
        os.path.dirname(__file__), "input/basic_setting.txt")
    characters_dir = os.path.join(
        os.path.dirname(__file__), "input/characters")
    acts_dir = os.path.join(
        os.path.dirname(__file__), "input/acts")

    # 基本設定の読み込み
    basic_setting = load_test_data(basic_setting_path)
    logger.info(f"基本設定 (最初の500文字): {basic_setting[:500]}...")

    # 全キャラクターデータの読み込み
    all_characters_list = load_all_characters(characters_dir)
    logger.info(f"キャラクター情報リスト長: {len(all_characters_list)}")

    # 全幕詳細データの読み込み
    all_act_details_list = load_all_acts(acts_dir)
    logger.info(f"幕詳細情報リスト長: {len(all_act_details_list)}")

    # ターゲット幕詳細（第1幕）を設定
    target_act_detail = all_act_details_list[0] if all_act_details_list else {"act_number": "1", "content": ""}
    logger.info(f"ターゲット幕詳細: 第{target_act_detail['act_number']}幕")

    # エピソード数を設定
    episode_count = 5
    logger.info(f"エピソード数: {episode_count}")

    # 出力ファイルのパスを生成
    log_file, result_file = create_output_files("episode_details_single")
    logger.info(f"ログファイル: {log_file}")
    logger.info(f"結果ファイル: {result_file}")

    # ログファイルの初期化
    with open(log_file, 'w', encoding='utf-8') as f:
        f.write("=== create_episode_details_streamメソッドのテストログ（単一の幕） ===\n")
        f.write(f"開始時刻: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write("=== 受信チャンクログ ===\n\n")

    # DifyStreamingAPIのインスタンスを作成（タイムアウトを長めに設定）
    dify_api = DifyStreamingAPI(timeout=600, test_mode=test_mode)

    # テスト用のユーザーID
    user_id = "test_user_001"

    # 結果格納用の変数
    markdown_content = ""
    all_chunks = []
    workflow_finished_chunk = None
    
    try:
        logger.info("APIリクエスト開始")
        start_time = time.time()

        # ストリーミングAPIの呼び出し
        response_generator = dify_api.create_episode_details_stream(
            basic_setting=basic_setting,
            all_characters_list=all_characters_list,
            all_act_details_list=all_act_details_list,
            target_act_detail=target_act_detail,
            episode_count=episode_count,
            user_id=user_id,
            test_mode=test_mode
        )

        # APIからのレスポンスを処理
        for i, chunk in enumerate(response_generator):
            logger.info(f"チャンク {i+1}: {str(chunk)[:100]}...")
            
            # チャンクを保存
            all_chunks.append(chunk)
            
            # エラーチェック
            if 'error' in chunk:
                logger.error(f"エラーチャンク: {chunk}")
            
            # ワークフロー終了チャンクを保存
            if chunk.get('event') == 'workflow_finished':
                workflow_finished_chunk = chunk
                logger.info("ワークフロー終了チャンク検出")
            
            # 完了フラグまたはワークフロー終了チャンクを検出した場合の処理
            if ("done" in chunk and chunk["done"]) or workflow_finished_chunk:
                done_msg = "ストリーミング完了"
                logger.info(done_msg)
                
                # ログファイルに完了メッセージを記録
                with open(log_file, 'a', encoding='utf-8') as f:
                    f.write(f"[完了] {done_msg}\n\n")
                    
                # テキストチャンクの総数をログに記録
                text_chunk_count = sum(1 for c in all_chunks if c.get('event') == 'text_chunk')
                logger.info(f"テキストチャンク数: {text_chunk_count}")
                
                # 最終チャンクからのMarkdown抽出処理
                # 最後のチャンクが完了フラグを持つチャンクじゃない場合は、ワークフロー終了チャンクを使用
                final_chunk = chunk if "done" in chunk and chunk["done"] else workflow_finished_chunk
                logger.info(f"Markdown抽出に使用するチャンク: {final_chunk}")
                
                # Markdown抽出
                last_chunk_markdown = get_markdown_from_last_chunk(final_chunk, all_chunks)
                
                # 抽出結果のデバッグログ
                if last_chunk_markdown:
                    logger.info(f"最終チャンクからMarkdownを抽出しました（長さ: {len(last_chunk_markdown)}文字）")
                    logger.info(f"Markdown先頭部分: {last_chunk_markdown[:100]}...")
                    markdown_content = last_chunk_markdown
                else:
                    logger.error("Markdownの抽出に失敗しました")
                    
                    # all_chunksの一部をデバッグ表示
                    text_chunks_sample = [c for c in all_chunks if c.get('event') == 'text_chunk'][:5]
                    logger.info(f"テキストチャンクサンプル: {text_chunks_sample}")
                
                break
            
            # ログファイルに追記
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write(f"Chunk {i+1}: {json.dumps(chunk, ensure_ascii=False)}\n")
        
        # 結果をファイルに保存
        with open(result_file, 'w', encoding='utf-8') as f:
            f.write(markdown_content)
            
        # エピソードをパースして個別ファイルに保存
        import re
        
        # エピソードが存在しない場合は処理をスキップ
        if not markdown_content:
            logger.warning("マークダウンコンテンツが空のため、エピソード抽出をスキップします")
            return
            
        # エピソードのパターンを定義
        episode_pattern = r'### エピソード(\d+)「([^」]+)」'
        
        # マークダウンコンテンツを分割
        episodes = []
        current_position = 0
        
        for match in re.finditer(episode_pattern, markdown_content):
            episode_num = match.group(1)
            episode_title = match.group(2)
            start_pos = match.start()
            
            # 前のエピソードの終了位置を現在のエピソードの開始位置とする
            if current_position > 0:
                episode_content = markdown_content[current_position:start_pos].strip()
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
            episodes[-1]['content'] = markdown_content[episodes[-1]['start_pos']:].strip()
        
        # エピソードを個別ファイルに保存
        episodes_dir = os.path.join(os.path.dirname(os.path.dirname(log_file)), 'input', 'episodes')
        os.makedirs(episodes_dir, exist_ok=True)
        
        for episode in episodes:
            episode_filename = f"act{target_act_detail['act_number']}_episode{episode['number']}.txt"
            episode_filepath = os.path.join(episodes_dir, episode_filename)
            
            with open(episode_filepath, 'w', encoding='utf-8') as f:
                # 見出しを一度だけ書き込む（重複を避ける）
                f.write(f"### エピソード{episode['number']}「{episode['title']}」\n\n")
                
                # 見出し部分を除外して本文のみを書き込む
                content = episode['content']
                # エピソード見出しのパターン
                episode_header = f"### エピソード{episode['number']}「{episode['title']}」"
                
                # 内容から見出しを削除（見出しが内容の先頭にある場合）
                if content.strip().startswith(episode_header):
                    content = content.replace(episode_header, "", 1).strip()
                
                f.write(content)
            
            logger.info(f"エピソード{episode['number']}「{episode['title']}」を保存しました: {episode_filepath}")
        
        logger.info(f"エピソードを{len(episodes)}個のファイルに分割して保存しました: {episodes_dir}")
        
        # 処理時間を計算
        process_time = time.time() - start_time
        logger.info(f"処理時間: {process_time:.2f}秒")
        
        # ログファイルにサマリーを追記
        with open(log_file, 'a', encoding='utf-8') as f:
            f.write("\n\n=== テスト結果サマリー ===\n")
            f.write(f"終了時刻: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"処理時間: {process_time:.2f}秒\n")
            f.write(f"結果ファイル: {result_file}\n")

        logger.info("テスト成功")
        return True

    except Exception as e:
        logger.error(f"テスト中にエラーが発生しました: {str(e)}")
        
        # エラー情報をログファイルに追記
        with open(log_file, 'a', encoding='utf-8') as f:
            f.write("\n\n=== エラー情報 ===\n")
            f.write(f"エラー発生時刻: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"エラー内容: {str(e)}\n")
        
        return False


def test_create_episode_details_stream_all_acts(test_mode: bool = False):
    """
    create_episode_details_streamメソッドのテスト（全ての幕）
    """
    logger.info("===== create_episode_details_streamメソッドのテスト開始（全ての幕） =====")

    # テストデータの読み込み
    basic_setting_path = os.path.join(
        os.path.dirname(__file__), "input/basic_setting.txt")
    characters_dir = os.path.join(
        os.path.dirname(__file__), "input/characters")
    acts_dir = os.path.join(
        os.path.dirname(__file__), "input/acts")

    # 基本設定の読み込み
    basic_setting = load_test_data(basic_setting_path)
    logger.info(f"基本設定 (最初の500文字): {basic_setting[:500]}...")

    # 全キャラクターデータの読み込み
    all_characters_list = load_all_characters(characters_dir)
    logger.info(f"キャラクター情報リスト長: {len(all_characters_list)}")

    # 全幕詳細データの読み込み
    all_act_details_list = load_all_acts(acts_dir)
    logger.info(f"幕詳細情報リスト長: {len(all_act_details_list)}")

    # エピソード数を設定
    episode_count = 5
    logger.info(f"エピソード数: {episode_count}")

    # 各幕を順番にテスト
    success = True
    for act_index, target_act_detail in enumerate(all_act_details_list):
        logger.info(f"--- 第{target_act_detail['act_number']}幕のテスト開始 ---")
        
        # 出力ファイルのパスを生成
        log_file, result_file = create_output_files(f"episode_details_act{target_act_detail['act_number']}")
        logger.info(f"ログファイル: {log_file}")
        logger.info(f"結果ファイル: {result_file}")

        # ログファイルの初期化
        with open(log_file, 'w', encoding='utf-8') as f:
            f.write(f"=== create_episode_details_streamメソッドのテストログ（第{target_act_detail['act_number']}幕） ===\n")
            f.write(f"開始時刻: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write("=== 受信チャンクログ ===\n\n")

        # DifyStreamingAPIのインスタンスを作成（タイムアウトを長めに設定）
        dify_api = DifyStreamingAPI(timeout=600, test_mode=test_mode)

        # テスト用のユーザーID
        user_id = "test_user_001"

        # 結果格納用の変数
        markdown_content = ""
        all_chunks = []
        workflow_finished_chunk = None
        
        try:
            logger.info("APIリクエスト開始")
            start_time = time.time()

            # ストリーミングAPIの呼び出し
            response_generator = dify_api.create_episode_details_stream(
                basic_setting=basic_setting,
                all_characters_list=all_characters_list,
                all_act_details_list=all_act_details_list,
                target_act_detail=target_act_detail,
                episode_count=episode_count,
                user_id=user_id,
                test_mode=test_mode
            )

            # APIからのレスポンスを処理
            for i, chunk in enumerate(response_generator):
                logger.info(f"チャンク {i+1}: {str(chunk)[:100]}...")
                
                # チャンクを保存
                all_chunks.append(chunk)
                
                # エラーチェック
                if 'error' in chunk:
                    logger.error(f"エラーチャンク: {chunk}")
                
                # ワークフロー終了チャンクを保存
                if chunk.get('event') == 'workflow_finished':
                    workflow_finished_chunk = chunk
                    logger.info("ワークフロー終了チャンク検出")
                
                # 完了フラグまたはワークフロー終了チャンクを検出した場合の処理
                if ("done" in chunk and chunk["done"]) or workflow_finished_chunk:
                    done_msg = "ストリーミング完了"
                    logger.info(done_msg)
                    
                    # ログファイルに完了メッセージを記録
                    with open(log_file, 'a', encoding='utf-8') as f:
                        f.write(f"[完了] {done_msg}\n\n")
                        
                    # テキストチャンクの総数をログに記録
                    text_chunk_count = sum(1 for c in all_chunks if c.get('event') == 'text_chunk')
                    logger.info(f"テキストチャンク数: {text_chunk_count}")
                    
                    # 最終チャンクからのMarkdown抽出処理
                    # 最後のチャンクが完了フラグを持つチャンクじゃない場合は、ワークフロー終了チャンクを使用
                    final_chunk = chunk if "done" in chunk and chunk["done"] else workflow_finished_chunk
                    logger.info(f"Markdown抽出に使用するチャンク: {final_chunk}")
                    
                    # Markdown抽出
                    last_chunk_markdown = get_markdown_from_last_chunk(final_chunk, all_chunks)
                    
                    # 抽出結果のデバッグログ
                    if last_chunk_markdown:
                        logger.info(f"最終チャンクからMarkdownを抽出しました（長さ: {len(last_chunk_markdown)}文字）")
                        logger.info(f"Markdown先頭部分: {last_chunk_markdown[:100]}...")
                        markdown_content = last_chunk_markdown
                    else:
                        logger.error("Markdownの抽出に失敗しました")
                        
                        # all_chunksの一部をデバッグ表示
                        text_chunks_sample = [c for c in all_chunks if c.get('event') == 'text_chunk'][:5]
                        logger.info(f"テキストチャンクサンプル: {text_chunks_sample}")
                    
                    break
                
                # ログファイルに追記
                with open(log_file, 'a', encoding='utf-8') as f:
                    f.write(f"Chunk {i+1}: {json.dumps(chunk, ensure_ascii=False)}\n")
            
            # 結果をファイルに保存
            with open(result_file, 'w', encoding='utf-8') as f:
                f.write(markdown_content)
                
            # エピソードをパースして個別ファイルに保存
            import re
            
            # エピソードが存在しない場合は処理をスキップ
            if not markdown_content:
                logger.warning("マークダウンコンテンツが空のため、エピソード抽出をスキップします")
                return
                
            # エピソードのパターンを定義
            episode_pattern = r'### エピソード(\d+)「([^」]+)」'
            
            # マークダウンコンテンツを分割
            episodes = []
            current_position = 0
            
            for match in re.finditer(episode_pattern, markdown_content):
                episode_num = match.group(1)
                episode_title = match.group(2)
                start_pos = match.start()
                
                # 前のエピソードの終了位置を現在のエピソードの開始位置とする
                if current_position > 0:
                    episode_content = markdown_content[current_position:start_pos].strip()
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
                episodes[-1]['content'] = markdown_content[episodes[-1]['start_pos']:].strip()
            
            # エピソードを個別ファイルに保存
            episodes_dir = os.path.join(os.path.dirname(os.path.dirname(log_file)), 'input', 'episodes')
            os.makedirs(episodes_dir, exist_ok=True)
            
            for episode in episodes:
                episode_filename = f"act{target_act_detail['act_number']}_episode{episode['number']}.txt"
                episode_filepath = os.path.join(episodes_dir, episode_filename)
                
                with open(episode_filepath, 'w', encoding='utf-8') as f:
                    # 見出しを一度だけ書き込む（重複を避ける）
                    f.write(f"### エピソード{episode['number']}「{episode['title']}」\n\n")
                    
                    # 見出し部分を除外して本文のみを書き込む
                    content = episode['content']
                    # エピソード見出しのパターン
                    episode_header = f"### エピソード{episode['number']}「{episode['title']}」"
                    
                    # 内容から見出しを削除（見出しが内容の先頭にある場合）
                    if content.strip().startswith(episode_header):
                        content = content.replace(episode_header, "", 1).strip()
                    
                    f.write(content)
                
                logger.info(f"エピソード{episode['number']}「{episode['title']}」を保存しました: {episode_filepath}")
            
            logger.info(f"エピソードを{len(episodes)}個のファイルに分割して保存しました: {episodes_dir}")
            
            # 処理時間を計算
            process_time = time.time() - start_time
            logger.info(f"処理時間: {process_time:.2f}秒")
            
            # ログファイルにサマリーを追記
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write("\n\n=== テスト結果サマリー ===\n")
                f.write(f"終了時刻: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write(f"処理時間: {process_time:.2f}秒\n")
                f.write(f"結果ファイル: {result_file}\n")

            logger.info(f"第{target_act_detail['act_number']}幕のテスト成功")

        except Exception as e:
            logger.error(f"第{target_act_detail['act_number']}幕のテスト中にエラーが発生しました: {str(e)}")
            
            # エラー情報をログファイルに追記
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write("\n\n=== エラー情報 ===\n")
                f.write(f"エラー発生時刻: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write(f"エラー内容: {str(e)}\n")
            
            success = False

    return success


def test_error_cases():
    """
    エラーケースのテスト
    様々なエラー状況での挙動を検証する
    """
    logger.info("===== エラーケースのテスト開始 =====")
    
    # テスト結果を記録するためのログファイルとレポートファイルを準備
    log_file, result_file = create_output_files("error_cases")
    logger.info(f"ログファイル: {log_file}")
    logger.info(f"結果ファイル: {result_file}")
    
    with open(log_file, 'w', encoding='utf-8') as f:
        f.write("=== エラーケースのテスト ===\n")
        f.write(f"開始時刻: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
    
    with open(result_file, 'w', encoding='utf-8') as f:
        f.write("=== エラーケースのテスト結果 ===\n")
        f.write(f"開始時刻: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
    
    # テストケース1: 無効なユーザーIDでのリクエスト
    test_invalid_user_id(log_file, result_file)
    
    # テストケース2: 空の入力データでのリクエスト
    test_empty_input_data(log_file, result_file)
    
    # テストケース3: 無効なエピソード数でのリクエスト
    test_invalid_episode_count(log_file, result_file)
    
    logger.info("===== エラーケースのテスト終了 =====")
    return True


def test_invalid_user_id(log_file, result_file):
    """
    無効なユーザーIDでのAPIリクエストテスト
    """
    logger.info("テストケース1: 無効なユーザーIDでのリクエスト")
    
    # ログファイルに情報を追記
    with open(log_file, 'a', encoding='utf-8') as f:
        f.write("\n== テストケース1: 無効なユーザーIDでのリクエスト ==\n")
    
    try:
        # 基本設定データを準備（実際の内容は不要）
        basic_setting = "テスト用基本設定"
        
        # 不正なユーザーID（空文字列）
        invalid_user_id = ""
        
        # DifyStreamingAPIのインスタンスを作成
        api = DifyStreamingAPI(test_mode=True)
        
        # APIリクエストを実行
        logger.info("無効なユーザーIDでAPIリクエスト実行...")
        
        # エラーを期待してリクエスト実行
        chunks = []
        for chunk in api.create_basic_setting_stream(
            basic_setting_data=basic_setting,
            user_id=invalid_user_id,
            test_mode=True
        ):
            chunks.append(chunk)
            
            # エラーメッセージを検出したら記録
            if "error" in chunk:
                logger.info(f"期待通りエラーを検出: {chunk['error']}")
                with open(log_file, 'a', encoding='utf-8') as f:
                    f.write(f"検出したエラー: {chunk['error']}\n")
                break
        
        # 結果ファイルに情報を追記
        with open(result_file, 'a', encoding='utf-8') as f:
            f.write("\n== テストケース1: 無効なユーザーIDでのリクエスト ==\n")
            if any("error" in chunk for chunk in chunks):
                f.write("テスト結果: 成功 - 期待通りエラーが検出されました\n")
                f.write(f"エラー内容: {next((chunk['error'] for chunk in chunks if 'error' in chunk), 'エラーなし')}\n")
            else:
                f.write("テスト結果: 失敗 - エラーが検出されませんでした\n")
        
        logger.info("テストケース1完了")
        
    except Exception as e:
        logger.error(f"テストケース1実行中にエラー発生: {str(e)}")
        with open(log_file, 'a', encoding='utf-8') as f:
            f.write(f"テスト実行エラー: {str(e)}\n")
            import traceback
            f.write(f"トレースバック:\n{traceback.format_exc()}\n")
        with open(result_file, 'a', encoding='utf-8') as f:
            f.write("\n== テストケース1: 無効なユーザーIDでのリクエスト ==\n")
            f.write(f"テスト結果: 失敗 - 予期せぬエラー発生: {str(e)}\n")


def test_empty_input_data(log_file, result_file):
    """
    空の入力データでのAPIリクエストテスト
    """
    logger.info("テストケース2: 空の入力データでのリクエスト")
    
    # ログファイルに情報を追記
    with open(log_file, 'a', encoding='utf-8') as f:
        f.write("\n== テストケース2: 空の入力データでのリクエスト ==\n")
    
    try:
        # 空のデータを準備
        empty_data = ""
        
        # DifyStreamingAPIのインスタンスを作成
        api = DifyStreamingAPI(test_mode=True)
        
        # APIリクエストを実行
        logger.info("空のデータでAPIリクエスト実行...")
        
        # エラーを期待してリクエスト実行
        chunks = []
        for chunk in api.create_basic_setting_stream(
            basic_setting_data=empty_data,
            user_id="test_user",
            test_mode=True
        ):
            chunks.append(chunk)
            
            # エラーメッセージを検出したら記録
            if "error" in chunk:
                logger.info(f"期待通りエラーを検出: {chunk['error']}")
                with open(log_file, 'a', encoding='utf-8') as f:
                    f.write(f"検出したエラー: {chunk['error']}\n")
                break
        
        # 結果ファイルに情報を追記
        with open(result_file, 'a', encoding='utf-8') as f:
            f.write("\n== テストケース2: 空の入力データでのリクエスト ==\n")
            if any("error" in chunk for chunk in chunks):
                f.write("テスト結果: 成功 - 期待通りエラーが検出されました\n")
                f.write(f"エラー内容: {next((chunk['error'] for chunk in chunks if 'error' in chunk), 'エラーなし')}\n")
            else:
                f.write("テスト結果: 失敗 - エラーが検出されませんでした\n")
        
        logger.info("テストケース2完了")
        
    except Exception as e:
        logger.error(f"テストケース2実行中にエラー発生: {str(e)}")
        with open(log_file, 'a', encoding='utf-8') as f:
            f.write(f"テスト実行エラー: {str(e)}\n")
            import traceback
            f.write(f"トレースバック:\n{traceback.format_exc()}\n")
        with open(result_file, 'a', encoding='utf-8') as f:
            f.write("\n== テストケース2: 空の入力データでのリクエスト ==\n")
            f.write(f"テスト結果: 失敗 - 予期せぬエラー発生: {str(e)}\n")


def test_invalid_episode_count(log_file, result_file):
    """
    無効なエピソード数でのAPIリクエストテスト
    """
    logger.info("テストケース3: 無効なエピソード数でのリクエスト")
    
    # ログファイルに情報を追記
    with open(log_file, 'a', encoding='utf-8') as f:
        f.write("\n== テストケース3: 無効なエピソード数でのリクエスト ==\n")
    
    try:
        # テストデータの読み込み
        basic_setting_path = os.path.join(
            os.path.dirname(__file__), "input/basic_setting.txt")
        characters_dir = os.path.join(
            os.path.dirname(__file__), "input/characters")
        acts_dir = os.path.join(
            os.path.dirname(__file__), "input/acts")

        # 基本設定の読み込み
        basic_setting = load_test_data(basic_setting_path)
        
        # 全キャラクターデータの読み込み
        all_characters_list = load_all_characters(characters_dir)
        character_contents = [c["content"] for c in all_characters_list]
        
        # 全幕詳細データの読み込み
        all_act_details_list = load_all_acts(acts_dir)
        act_contents = [a["content"] for a in all_act_details_list]
        
        # ターゲット幕詳細を設定
        target_act_detail = all_act_details_list[0]["content"] if all_act_details_list else ""
        
        # 無効なエピソード数を設定 (0や負の値など)
        invalid_episode_count = 0
        
        # DifyStreamingAPIのインスタンスを作成
        api = DifyStreamingAPI(test_mode=True)
        
        # APIリクエストを実行
        logger.info("無効なエピソード数でAPIリクエスト実行...")
        
        # エラーを期待してリクエスト実行
        chunks = []
        for chunk in api.create_episode_details_stream(
            basic_setting=basic_setting,
            all_characters_list=character_contents,
            all_act_details_list=act_contents,
            target_act_detail=target_act_detail,
            episode_count=invalid_episode_count,
            user_id="test_user",
            test_mode=True
        ):
            chunks.append(chunk)
            
            # エラーメッセージを検出したら記録
            if "error" in chunk:
                logger.info(f"期待通りエラーを検出: {chunk['error']}")
                with open(log_file, 'a', encoding='utf-8') as f:
                    f.write(f"検出したエラー: {chunk['error']}\n")
                break
        
        # 結果ファイルに情報を追記
        with open(result_file, 'a', encoding='utf-8') as f:
            f.write("\n== テストケース3: 無効なエピソード数でのリクエスト ==\n")
            if any("error" in chunk for chunk in chunks):
                f.write("テスト結果: 成功 - 期待通りエラーが検出されました\n")
                f.write(f"エラー内容: {next((chunk['error'] for chunk in chunks if 'error' in chunk), 'エラーなし')}\n")
            else:
                f.write("テスト結果: 失敗 - エラーが検出されませんでした\n")
        
        logger.info("テストケース3完了")
        
    except Exception as e:
        logger.error(f"テストケース3実行中にエラー発生: {str(e)}")
        with open(log_file, 'a', encoding='utf-8') as f:
            f.write(f"テスト実行エラー: {str(e)}\n")
            import traceback
            f.write(f"トレースバック:\n{traceback.format_exc()}\n")
        with open(result_file, 'a', encoding='utf-8') as f:
            f.write("\n== テストケース3: 無効なエピソード数でのリクエスト ==\n")
            f.write(f"テスト結果: 失敗 - 予期せぬエラー発生: {str(e)}\n")


def main():
    """
    メイン関数
    """
    logger.info("Dify エピソード詳細生成 APIテスト開始")
    
    # 単一の幕のテスト
    success_single = test_create_episode_details_stream_single_act(test_mode=True)
    
    # 全ての幕のテスト
    success_all = test_create_episode_details_stream_all_acts(test_mode=True)
    
    # エラーケースのテスト
    success_error_cases = test_error_cases()
    
    # 結果の表示
    if success_single and success_all and success_error_cases:
        logger.info("すべてのテストが成功しました")
    else:
        logger.error("テストに失敗があります")


if __name__ == "__main__":
    main()
