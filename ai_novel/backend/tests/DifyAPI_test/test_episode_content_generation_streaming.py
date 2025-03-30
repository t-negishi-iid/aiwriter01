#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Dify Streaming API - エピソード本文生成のテスト用スクリプト
"""

import os
import time
import json
import datetime
import logging
import re
from typing import List, Dict, Any, Tuple, Iterator

from django.db.models.functions import Trunc

# ロガーの設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# プロジェクトのルートディレクトリへのパスを設定
PROJECT_ROOT = os.path.abspath(os.path.join(
    os.path.dirname(__file__), "../.."))

# DifyStreamingYieldAPIをインポート
import sys
sys.path.append(PROJECT_ROOT)

from novel_gen.dify_streaming_yield_api import DifyStreamingYieldAPI

# ロードテストデータファイルから読み込む

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


def load_all_episode_details(episodes_dir: str) -> List[Dict[str, Any]]:
    """
    エピソード詳細ディレクトリから全エピソード詳細ファイルを読み込み、リストとして返す

    Args:
        episodes_dir: エピソード詳細ファイルのディレクトリパス

    Returns:
        List[Dict[str, Any]]: エピソード詳細情報のリスト
    """
    logger.info(f"エピソード詳細ディレクトリ: {episodes_dir}")

    episode_files = [f for f in os.listdir(episodes_dir) if f.endswith(".txt")]
    logger.info(f"エピソード詳細ファイル数: {len(episode_files)}")

    episodes_list = []

    for file_name in episode_files:
        logger.info(f"エピソード詳細ファイル読み込み: {file_name}")
        file_path = os.path.join(episodes_dir, file_name)
        content = load_test_data(file_path)

        # 幕番号とエピソード番号を取得（ファイル名から抽出）
        match = re.match(r'act(\d+)_episode(\d+)', file_name)
        if match:
            act_number = int(match.group(1))
            episode_number = int(match.group(2))

            # エピソード情報を辞書として追加
            episode_info = {
                "act_number": act_number,
                "episode_number": episode_number,
                "content": content
            }

            episodes_list.append(episode_info)

    return episodes_list


def is_final_chunk(chunk):
    """
    最終チャンク（ワークフロー終了チャンク）かどうかを判定する

    Args:
        chunk (dict): 解析済みのチャンク

    Returns:
        bool: 最終チャンクの場合はTrue、それ以外はFalse
    """
    # JSON形式の場合は通常の判定
    if isinstance(chunk, dict):
        if "event" in chunk:
            event = chunk.get("event")
            if "workflow_finished" in event:
                return True
        else:
            return False



def extract_result_from_final_chunk(chunk):
    """
    最終チャンク（ワークフロー終了チャンク）から結果データを抽出する

    Args:
        chunk: 最終チャンク（文字列またはdict）

    Returns:
        dict: 抽出した結果データ
    """
    # chunkは必ずdict
    if isinstance(chunk, dict):
        data = chunk.get("data", {})
        return {
            "result": data.get("outputs", {}).get("result"),
            "status": data.get("status"),
            "error": data.get("error"),
            "elapsed_time": data.get("elapsed_time")
        }

    return None


def process_streaming_response(response_generator, log_file_path):
    """
    ストリーミングレスポンス（辞書形式チャンク）を処理してデータを抽出する
    前提：response_generator は各チャンクをPythonの辞書として yield する
    """
    chunk_count = 0
    all_text = ""
    final_data = None # workflow_finished イベントの data['outputs'] 部分を格納

    with open(log_file_path, 'a', encoding='utf-8') as log_file:
        log_file.write("\n=== 受信チャンクログ (辞書形式) ===\n\n")

        for chunk in response_generator: # chunk は辞書と仮定
            chunk_count += 1
            log_file.write(f"チャンク受信 #{chunk_count}:\n")
            try:
                # chunk が dict であることを確認 (念のため)
                if not isinstance(chunk, dict):
                    log_file.write(f"エラー: 予期しないチャンク形式 (dictではありません): {type(chunk)}\n{chunk}\n\n")
                    logging.warning(f"予期しないチャンク形式: {type(chunk)}")
                    continue # 次のチャンクへ

                # 辞書形式のチャンクをログに記録 (整形して見やすく)
                chunk_str = json.dumps(chunk, ensure_ascii=False, indent=2)
                log_file.write(f"{chunk_str}\n\n")
                logging.info(f"Received chunk #{chunk_count}: event={chunk.get('event', 'N/A')}")

                # イベントタイプに基づいて処理を分岐
                event = chunk.get("event")

                if event == "text_chunk":
                    # data -> text のパスでテキストを取得
                    text_piece = chunk.get("data", {}).get("text", "")
                    if text_piece:
                        all_text += text_piece
                        # logging.debug(f"テキスト連結: {text_piece}") # デバッグ用

                elif event == "workflow_finished":
                    # data -> outputs のパスで最終結果を取得
                    outputs = chunk.get("data", {}).get("outputs")
                    if outputs is not None: # outputs が空の辞書 {} の可能性も考慮
                         final_data = outputs # outputs 辞書全体を格納
                         log_file.write(f"\n=== ワークフロー終了検出 ===\n")
                         log_file.write(f"最終データ (outputs): {json.dumps(final_data, ensure_ascii=False, indent=2)}\n")
                         logging.info("ワークフロー終了イベントを検出し、最終データを格納しました。")
                         # workflow_finished を受け取ったらループを抜ける判断も可能
                         # break

                # 必要に応じて他のイベントタイプも処理
                # elif event == "agent_message": ...
                # elif event == "agent_thought": ...
                elif event in ["workflow_started", "node_started", "node_finished"]:
                     logging.debug(f"処理イベント: {event}") # ログ記録のみ
                elif event == "error":
                    log_file.write(f"エラーイベント受信: {chunk_str}\n")
                    logging.error(f"エラーイベント受信: {chunk}")
                    # エラー発生時の処理 (例: ループ中断)
                    # break
                else:
                    logging.warning(f"未処理のイベントタイプ: {event}")

            except Exception as e:
                # ループ内で予期せぬエラーが発生した場合
                log_file.write(f"エラー: チャンク処理中に例外発生: {e}\n")
                # エラー時のチャンクも記録 (chunkが未定義の可能性もあるためtry-except)
                try:
                    problematic_chunk_str = json.dumps(chunk, ensure_ascii=False, indent=2)
                except:
                    problematic_chunk_str = str(chunk) # 最悪、文字列として記録
                log_file.write(f"問題のチャンク: {problematic_chunk_str}\n\n")
                logging.error(f"チャンク処理中に例外発生: {e}", exc_info=True)
                # エラー発生時にループを継続するか中断するかは要件による
                # continue or break

        # --- ループ終了後 ---
        log_file.write(f"\n=== ストリーミング処理終了 ===\n")
        log_file.write(f"総受信チャンク数: {chunk_count}\n")
        log_file.write(f"連結テキスト総文字数: {len(all_text)}\n")
        if final_data is not None:
            log_file.write(f"最終データ (outputs): {json.dumps(final_data, ensure_ascii=False, indent=2)}\n")
            # final_data から主要な結果（例: 'result'）を抽出してログに残すことも可能
            result_preview = final_data.get('result', 'N/A')
            if isinstance(result_preview, str):
                 result_preview = result_preview[:100] + "..." # 長い場合は省略
            log_file.write(f"最終データ内の'result'(プレビュー): {result_preview}\n")
        else:
            log_file.write("最終データ (outputs): なし (workflow_finished イベントが見つからなかったか、outputs が空でした)\n")
            # 最終データがない場合、連結テキストが代替結果となる可能性がある
            log_file.write(f"連結されたテキスト(プレビュー): {all_text[:500]}...\n")

    # 戻り値: チャンク数, 連結テキスト, 最終データ(outputs辞書 or None)
    return chunk_count, all_text, final_data


def test_create_episode_content_stream():
    """
    create_episode_content_streamメソッドのテスト
    """
    # 現在時刻をフォーマットしてファイル名に使用
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file_path = os.path.join(os.path.dirname(__file__), f"output/episode_content_log_{timestamp}.txt")
    result_file_path = os.path.join(os.path.dirname(__file__), f"output/episode_content_result_{timestamp}.txt")

    # ログファイルの初期化
    with open(log_file_path, 'w', encoding='utf-8') as log_file:
        log_file.write("=== create_episode_content_streamメソッドのテストログ ===\n")
        log_file.write(f"開始時刻: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    logging.info("===== create_episode_content_streamメソッドのテスト開始 =====")

    try:
        # 基本設定ファイルの読み込み
        basic_setting_path = os.path.join(os.path.dirname(__file__), "input/basic_setting.txt")
        basic_setting = load_test_data(basic_setting_path)
        logging.info(f"基本設定 (最初の500文字): {basic_setting[:500]}...")

        # キャラクター情報ファイルの読み込み
        characters_dir = os.path.join(os.path.dirname(__file__), "input/characters")
        logging.info(f"キャラクターディレクトリ: {characters_dir}")
        character_files = [f for f in os.listdir(characters_dir) if f.endswith('.txt')]
        logging.info(f"キャラクターファイル数: {len(character_files)}")

        all_characters_list = []
        for character_file in character_files:
            logging.info(f"キャラクターファイル読み込み: {character_file}")
            character_info = {
                "name": character_file.split('_result_')[0],
                "content": load_test_data(os.path.join(characters_dir, character_file))
            }
            all_characters_list.append(character_info)

        logging.info(f"キャラクター情報リスト長: {len(all_characters_list)}")

        # エピソード詳細ファイルの読み込み
        episodes_dir = os.path.join(os.path.dirname(__file__), "input/episodes")
        logging.info(f"エピソード詳細ディレクトリ: {episodes_dir}")
        episode_files = [f for f in os.listdir(episodes_dir) if f.endswith('.txt')]
        logging.info(f"エピソード詳細ファイル数: {len(episode_files)}")

        all_episode_details_list = []
        for episode_file in episode_files:
            logging.info(f"エピソード詳細ファイル読み込み: {episode_file}")
            episode_detail = {
                "act_number": int(episode_file.split('act')[1].split('_')[0]),
                "episode_number": int(episode_file.split('episode')[1].split('.txt')[0]),
                "content": load_test_data(os.path.join(episodes_dir, episode_file))
            }
            all_episode_details_list.append(episode_detail)

        logging.info(f"エピソード詳細情報リスト長: {len(all_episode_details_list)}")

        # テスト対象のエピソード
        target_episode_detail = next((ep for ep in all_episode_details_list if ep["act_number"] == 1 and ep["episode_number"] == 1), None)
        logging.info(f"ターゲットエピソード詳細: 第{target_episode_detail['act_number']}幕第{target_episode_detail['episode_number']}エピソード")

        # 単語数（文字数に変換）
        word_count = 2000  # 日本語の場合は文字数として扱う
        logging.info(f"文字数: {word_count}")

        # ファイルパスをログに記録
        logging.info(f"ログファイル: {log_file_path}")
        logging.info(f"結果ファイル: {result_file_path}")

        # APIクライアントの初期化
        dify_client = DifyStreamingYieldAPI()

        # 開始時刻
        start_time = time.time()

        # create_episode_content_streamメソッドの呼び出し
        response_generator = dify_client.create_episode_content_stream(
            basic_setting=basic_setting,
            all_characters_list=all_characters_list,
            all_episode_details_list=all_episode_details_list,
            target_episode_detail=target_episode_detail,
            act_number=target_episode_detail["act_number"],
            episode_number=target_episode_detail["episode_number"],
            word_count=word_count,
            user_id="test_user_id"
        )

        # ストリーミングレスポンスの処理
        chunk_count, all_text, final_data = process_streaming_response(response_generator, log_file_path)

        # 処理時間
        elapsed_time = time.time() - start_time
        logging.info(f"処理時間: {elapsed_time:.2f}秒")

        # エピソード本文を保存
        episode_content = ""

        # 最終チャンクからデータを抽出できた場合
        if final_data and isinstance(final_data, dict) and "result" in final_data:
            episode_content = final_data["result"]
            logging.info(f"最終チャンクから抽出したエピソード本文（最初の100文字）: {episode_content[:100]}...")
        else:
            # 最終チャンクが見つからない場合は、連結したテキストを使用
            episode_content = all_text
            logging.warning("最終チャンクが見つかりませんでした。連結したテキストを使用します。")

        # 結果をファイルに保存
        with open(result_file_path, 'w', encoding='utf-8') as f:
            f.write(episode_content)

        logging.info(f"エピソード本文生成結果を保存しました: {result_file_path}")

        # 結果が空でないか確認
        if not episode_content.strip():
            logging.warning("生成されたエピソード本文が空です")

    except Exception as e:
        logging.error(f"テスト実行中にエラーが発生しました: {e}")
        with open(log_file_path, 'a', encoding='utf-8') as log_file:
            log_file.write(f"\nエラー: {e}\n")

    logging.info("===== create_episode_content_streamメソッドのテスト終了 =====")


def main():
    """
    メイン関数
    """
    try:
        # エピソード本文生成のテスト
        test_create_episode_content_stream()
    except Exception as e:
        logger.error(f"テスト実行中にエラーが発生しました: {e}")


if __name__ == "__main__":
    main()
