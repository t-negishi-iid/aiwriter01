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
import argparse
from typing import List, Dict, Any, Tuple, Iterator

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


def is_final_chunk(chunk: Dict[str, Any]) -> bool:
    """
    最終チャンクかどうかを判定する

    Args:
        chunk: チャンク

    Returns:
        bool: 最終チャンクの場合はTrue
    """
    # 1. workflow_finished イベントを検出
    if chunk.get("event") == "workflow_finished":
        return True

    # 2. チャンクに'done'キーがあり、その値がTrueの場合も最終チャンク
    if chunk.get("done") is True:
        return True

    # 3. または、eventがnoneで、dataキーが存在する場合も最終チャンク（後方互換性のため）
    if "event" not in chunk and "data" in chunk:
        return True

    return False


def extract_result_from_final_chunk(chunk: Dict[str, Any]) -> str:
    """
    最終チャンクからエピソード本文を抽出する

    Args:
        chunk: 最終チャンク

    Returns:
        str: エピソード本文
    """
    # workflow_finished イベントからの抽出を優先
    if chunk.get("event") == "workflow_finished":
        try:
            if "data" in chunk and isinstance(chunk["data"], dict):
                data = chunk["data"]
                if "outputs" in data and isinstance(data["outputs"], dict):
                    outputs = data["outputs"]
                    if "result" in outputs:
                        return outputs["result"]
        except Exception as e:
            logger.error(f"workflow_finishedイベントからの結果抽出エラー: {e}")

    # 従来の方法でも抽出を試みる
    try:
        if "data" in chunk and isinstance(chunk["data"], dict):
            data = chunk["data"]
            if "outputs" in data and isinstance(data["outputs"], dict):
                outputs = data["outputs"]
                if "result" in outputs:
                    return outputs["result"]
    except Exception as e:
        logger.error(f"最終チャンクからの結果抽出エラー: {e}")

    # 抽出できなかった場合は空文字列を返す
    return ""


def process_streaming_response(response_generator, log_file_path):
    """
    ストリーミングレスポンスを処理してチャンクを返す
    """
    chunk_count = 0
    all_text = ""
    final_data = None

    with open(log_file_path, 'a', encoding='utf-8') as log_file:
        log_file.write("\n=== 受信チャンクログ ===\n\n")

        for chunk in response_generator:
            chunk_count += 1
            chunk_str = json.dumps(chunk, ensure_ascii=False)
            log_message = f"チャンク#{chunk_count} 受信: {chunk_str}\n"
            log_file.write(log_message)

            try:
                # イベントタイプに基づいて処理を分岐
                event = chunk.get("event")
                
                # テキストチャンクの場合
                if event == "text_chunk" and "data" in chunk and "text" in chunk["data"]:
                    text_chunk = chunk["data"]["text"]
                    all_text += text_chunk
                    logging.info(f"テキストチャンク受信: {len(text_chunk)}文字")

                # workflow_finished イベントの場合
                elif event == "workflow_finished":
                    # data -> outputs のパスで最終結果を取得
                    outputs = chunk.get("data", {}).get("outputs")
                    if outputs is not None:
                        final_data = outputs.get("result", "")
                        log_file.write(f"\n=== ワークフロー終了検出 ===\n")
                        log_file.write(f"最終データ: {final_data[:500]}...(省略)...\n")
                        logging.info("ワークフロー終了イベントを検出し、最終データを格納しました。")

                # 従来の方法による最終チャンク検出
                elif is_final_chunk(chunk) and not event == "workflow_finished":  # workflow_finished 以外の場合
                    result = extract_result_from_final_chunk(chunk)
                    if result:
                        final_data = result
                        log_file.write(f"\n最終チャンク検出: {json.dumps(final_data[:500] if isinstance(final_data, str) else final_data, ensure_ascii=False)}\n")
                        logging.info("従来の方法で最終チャンクを検出しました。")

            except Exception as e:
                logging.error(f"Unexpected error processing chunk: {e}")
                log_file.write(f"エラー (チャンク処理): {e}\n")

        log_file.write(f"\n受信チャンク数: {chunk_count}\n")
        log_file.write(f"連結テキスト長: {len(all_text)}文字\n")
        if final_data:
            log_file.write(f"最終データ: {json.dumps(final_data[:500] if isinstance(final_data, str) else final_data, ensure_ascii=False)}\n")
        else:
            log_file.write("最終データ: なし\n")
            log_file.write(f"構築されたテキスト: {all_text[:500]}...(省略)...\n")

    return chunk_count, all_text, final_data


def test_create_episode_content_stream(word_count: int = 2000):
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
        logging.info(f"文字数: {word_count}")

        # ファイルパスをログに記録
        logging.info(f"ログファイル: {log_file_path}")
        logging.info(f"結果ファイル: {result_file_path}")

        # APIクライアントの初期化
        dify_client = DifyStreamingAPI()

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
        if final_data:
            if isinstance(final_data, dict) and "result" in final_data:
                # 辞書型で result キーがある場合（従来形式）
                episode_content = final_data["result"]
                logging.info(f"最終チャンクから抽出したエピソード本文（最初の100文字）: {episode_content[:100]}...")
            elif isinstance(final_data, str) and final_data.strip():
                # 文字列の場合（workflow_finished から直接抽出された結果）
                episode_content = final_data
                logging.info(f"最終チャンクから抽出したエピソード本文（最初の100文字）: {episode_content[:100]}...")
            else:
                # その他の場合（未知の形式）
                logging.warning(f"最終データの形式が不明です: {type(final_data)}")
                episode_content = all_text
                logging.warning("連結したテキストを使用します。")
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


def generate_all_episodes(word_count: int = 2000):
    """
    すべてのエピソード本文を生成してcontentsディレクトリに保存する
    
    Args:
        word_count: 生成する文字数
    """
    # 現在時刻をフォーマットしてファイル名に使用
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file_path = os.path.join(os.path.dirname(__file__), f"output/all_episodes_generation_log_{timestamp}.txt")
    
    # ログファイルの初期化
    with open(log_file_path, 'w', encoding='utf-8') as log_file:
        log_file.write("=== すべてのエピソード本文生成のログ ===\n")
        log_file.write(f"開始時刻: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    logging.info("===== すべてのエピソード本文生成開始 =====")
    
    try:
        # 基本設定ファイルの読み込み
        basic_setting_path = os.path.join(os.path.dirname(__file__), "input/basic_setting.txt")
        basic_setting = load_test_data(basic_setting_path)
        logging.info(f"基本設定を読み込みました。")
        
        # キャラクター情報ファイルの読み込み
        characters_dir = os.path.join(os.path.dirname(__file__), "input/characters")
        all_characters_list = load_all_characters(characters_dir)
        logging.info(f"キャラクター情報を読み込みました: {len(all_characters_list)}件")
        
        # エピソード詳細ファイルの読み込み
        episodes_dir = os.path.join(os.path.dirname(__file__), "input/episodes")
        all_episode_details_list = load_all_episode_details(episodes_dir)
        logging.info(f"エピソード詳細情報を読み込みました: {len(all_episode_details_list)}件")
        
        # 出力ディレクトリの準備
        contents_dir = os.path.join(os.path.dirname(__file__), "input/contents")
        os.makedirs(contents_dir, exist_ok=True)
        
        # APIクライアントの初期化
        dify_client = DifyStreamingAPI()
        
        # 各エピソードについて本文を生成
        for episode_detail in sorted(all_episode_details_list, 
                                    key=lambda x: (x["act_number"], x["episode_number"])):
            act_number = episode_detail["act_number"]
            episode_number = episode_detail["episode_number"]
            
            logging.info(f"第{act_number}幕第{episode_number}エピソードの本文生成を開始")
            with open(log_file_path, 'a', encoding='utf-8') as log_file:
                log_file.write(f"\n=== 第{act_number}幕第{episode_number}エピソードの本文生成 ===\n")
            
            # 出力ファイルのパス
            output_file = os.path.join(contents_dir, f"act{act_number}_episode{episode_number}.txt")
            
            # すでに生成済みの場合はスキップ
            if os.path.exists(output_file):
                logging.info(f"第{act_number}幕第{episode_number}エピソードは既に生成済みのためスキップします")
                continue
            
            try:
                # ストリーミングレスポンスの生成
                response_generator = dify_client.create_episode_content_stream(
                    basic_setting=basic_setting,
                    all_characters_list=all_characters_list,
                    all_episode_details_list=all_episode_details_list,
                    target_episode_detail=episode_detail,
                    act_number=act_number,
                    episode_number=episode_number,
                    word_count=word_count,
                    user_id="test_user_id"
                )
                
                # ストリーミングレスポンスの処理
                chunk_count, all_text, final_data = process_streaming_response(response_generator, log_file_path)
                
                # エピソード本文を抽出
                episode_content = ""
                
                # 最終チャンクからデータを抽出できた場合
                if final_data:
                    if isinstance(final_data, dict) and "result" in final_data:
                        # 辞書型で result キーがある場合（従来形式）
                        episode_content = final_data["result"]
                    elif isinstance(final_data, str) and final_data.strip():
                        # 文字列の場合
                        episode_content = final_data
                    else:
                        # その他の場合
                        logging.warning(f"最終データの形式が不明です: {type(final_data)}")
                        episode_content = all_text
                else:
                    # 最終チャンクが見つからない場合は、連結したテキストを使用
                    episode_content = all_text
                    logging.warning("最終チャンクが見つかりませんでした。連結したテキストを使用します。")
                
                # 結果をファイルに保存
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(episode_content)
                
                logging.info(f"第{act_number}幕第{episode_number}エピソードの本文を保存しました: {output_file}")
                
                # 結果が空でないか確認
                if not episode_content.strip():
                    logging.warning(f"第{act_number}幕第{episode_number}エピソードの生成結果が空です")
                
                # API呼び出しの間隔を空ける
                time.sleep(1)
                
            except Exception as e:
                logging.error(f"第{act_number}幕第{episode_number}エピソードの生成中にエラーが発生しました: {e}")
                with open(log_file_path, 'a', encoding='utf-8') as log_file:
                    log_file.write(f"\nエラー (第{act_number}幕第{episode_number}エピソード): {e}\n")
        
        logging.info("===== すべてのエピソード本文生成完了 =====")
        
    except Exception as e:
        logging.error(f"エピソード本文一括生成中にエラーが発生しました: {e}")
        with open(log_file_path, 'a', encoding='utf-8') as log_file:
            log_file.write(f"\n全体エラー: {e}\n")


def main():
    """
    メイン関数
    """
    # コマンドライン引数の処理
    parser = argparse.ArgumentParser(description='エピソード本文生成のテストスクリプト')
    parser.add_argument('--generate-all', action='store_true', 
                        help='すべてのエピソード本文を生成してcontentsディレクトリに保存')
    parser.add_argument('--word-count', type=int, default=2000,
                        help='生成する文字数 (デフォルト: 2000)')
    args = parser.parse_args()

    try:
        if args.generate_all:
            # すべてのエピソード本文を生成
            generate_all_episodes(word_count=args.word_count)
        else:
            # 単一のエピソード本文生成のテスト
            test_create_episode_content_stream(word_count=args.word_count)
    except Exception as e:
        logger.error(f"テスト実行中にエラーが発生しました: {e}")


if __name__ == "__main__":
    main()
