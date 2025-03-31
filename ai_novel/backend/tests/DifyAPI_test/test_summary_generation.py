#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Dify Streaming API - サマリー生成のテスト用スクリプト
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
    最終チャンクから結果を抽出する

    Args:
        chunk: 最終チャンク

    Returns:
        str: 結果のテキスト
    """
    # workflow_finished イベントからの抽出を優先
    if chunk.get("event") == "workflow_finished":
        try:
            if "data" in chunk and isinstance(chunk["data"], dict):
                data = chunk["data"]
                # outputsの中のresultフィールドを探す
                if "outputs" in data and isinstance(data["outputs"], dict):
                    if "result" in data["outputs"]:
                        return data["outputs"]["result"]
        except Exception as e:
            logger.error(f"workflow_finished イベントからの結果抽出エラー: {e}")

    # 従来形式: チャンクの"data"フィールドから抽出
    if "data" in chunk and isinstance(chunk["data"], dict):
        data = chunk["data"]
        if "result" in data:
            return data["result"]
        elif "text" in data:
            return data["text"]
        elif "content" in data:
            return data["content"]
        elif isinstance(data, str):
            return data
        else:
            # dataが辞書だが、既知のキーがない場合
            logger.warning(f"未知の形式のデータフィールド: {data}")
            return str(data)
    elif "data" in chunk and isinstance(chunk["data"], str):
        # dataが直接文字列の場合
        return chunk["data"]
    elif "text" in chunk:
        # textフィールドがある場合
        return chunk["text"]
    elif "content" in chunk:
        # contentフィールドがある場合
        return chunk["content"]
    else:
        # どれにも当てはまらない場合は、チャンク全体を文字列化して返す
        logger.warning(f"最終チャンクから結果を抽出できませんでした: {chunk}")
        return json.dumps(chunk, ensure_ascii=False)


def process_streaming_response(response_generator: Iterator[Dict[str, Any]], log_file_path: str) -> Tuple[int, str, Any]:
    """
    ストリーミングレスポンスを処理してチャンクを返す

    Args:
        response_generator: ストリーミングレスポンスジェネレータ
        log_file_path: ログファイルパス

    Returns:
        Tuple[int, str, Any]: (チャンク数, 連結テキスト, 最終チャンクから抽出したデータ)
    """
    chunk_count = 0
    all_text = ""
    final_data = None

    try:
        for chunk in response_generator:
            # チャンク数をインクリメント
            chunk_count += 1

            # チャンクをログに記録
            with open(log_file_path, 'a', encoding='utf-8') as log_file:
                log_file.write(f"\n--- チャンク {chunk_count} ---\n")
                log_file.write(json.dumps(chunk, ensure_ascii=False, indent=2))
                log_file.write("\n")

            # チャンクからテキストを抽出
            chunk_text = ""

            if "data" in chunk and isinstance(chunk["data"], dict) and "delta" in chunk["data"]:
                # delta形式: Anthropicなどの一部のAPIで使用される形式
                chunk_text = chunk["data"]["delta"]
            elif "data" in chunk and isinstance(chunk["data"], dict) and "text" in chunk["data"]:
                # text形式: Anthropicなどの一部のAPIで使用される形式
                chunk_text = chunk["data"]["text"]
            elif "data" in chunk and isinstance(chunk["data"], dict) and "content" in chunk["data"]:
                # content形式: 様々なAPIで使用される形式
                chunk_text = chunk["data"]["content"]
            elif "data" in chunk and isinstance(chunk["data"], str):
                # 直接文字列形式: OpenAIなどの一部のAPIで使用される形式
                chunk_text = chunk["data"]
            elif "text" in chunk:
                # textフィールドがある場合
                chunk_text = chunk["text"]
            elif "content" in chunk:
                # contentフィールドがある場合
                chunk_text = chunk["content"]

            # 抽出したテキストをログに記録
            if chunk_text:
                all_text += chunk_text
                with open(log_file_path, 'a', encoding='utf-8') as log_file:
                    log_file.write(f"\n抽出したテキスト: {chunk_text}\n")

            # 最終チャンクの場合
            if is_final_chunk(chunk):
                logger.info(f"最終チャンクを検出: {chunk_count}チャンク目")
                with open(log_file_path, 'a', encoding='utf-8') as log_file:
                    log_file.write("\n=== 最終チャンクを検出 ===\n")

                # 最終チャンクから結果を抽出
                final_data = extract_result_from_final_chunk(chunk)
                with open(log_file_path, 'a', encoding='utf-8') as log_file:
                    log_file.write(f"\n抽出した最終データ: {final_data}\n")

                logger.info(f"最終データを抽出しました: {type(final_data)}")

    except Exception as e:
        logger.error(f"ストリーミングレスポンスの処理中にエラーが発生しました: {e}")
        with open(log_file_path, 'a', encoding='utf-8') as log_file:
            log_file.write(f"\nエラー: {e}\n")

    logger.info(f"合計チャンク数: {chunk_count}")
    return chunk_count, all_text, final_data


def test_create_summary_stream(target_content=None, word_count=200):
    """
    サマリー生成メソッドのテスト

    Args:
        target_content: サマリーを生成する対象のコンテンツ
        word_count: 単語数上限

    Returns:
        str: 生成されたサマリー
    """
    # 現在時刻をフォーマットしてファイル名に使用
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file_path = os.path.join(os.path.dirname(__file__), f"output/summary_generation_log_{timestamp}.txt")
    result_file_path = os.path.join(os.path.dirname(__file__), f"output/summary_generation_result_{timestamp}.txt")

    # ログファイルの初期化
    with open(log_file_path, 'w', encoding='utf-8') as log_file:
        log_file.write("=== サマリー生成メソッドのテストログ ===\n")
        log_file.write(f"開始時刻: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    logging.info("===== サマリー生成メソッドのテスト開始 =====")

    generated_summary = ""

    try:
        # ターゲットコンテンツがない場合は、all_contents.txtから読み込む
        if target_content is None:
            all_contents_path = os.path.join(os.path.dirname(__file__), "input/all_contents.txt")
            if os.path.exists(all_contents_path):
                target_content = load_test_data(all_contents_path)
                logging.info(f"ターゲットコンテンツを読み込みました: {len(target_content)}文字")
            else:
                logging.warning("all_contents.txtが見つかりません。代わりにcontentsディレクトリからエピソードを結合します。")
                # contentsディレクトリの全エピソードを連結
                contents_dir = os.path.join(os.path.dirname(__file__), "input/contents")
                if os.path.exists(contents_dir) and os.path.isdir(contents_dir):
                    content_files = [f for f in os.listdir(contents_dir) if f.endswith('.txt') and f.startswith('act')]
                    if content_files:
                        # 幕とエピソード番号でソート
                        sorted_files = sorted(content_files, key=lambda f: (
                            int(f.split('act')[1].split('_')[0]),  # 幕番号
                            int(f.split('episode')[1].split('.')[0])  # エピソード番号
                        ))

                        # すべてのエピソード本文を連結
                        combined_content = ""
                        for content_file in sorted_files:
                            match = re.match(r'act(\d+)_episode(\d+)', content_file)
                            if match:
                                act_number = int(match.group(1))
                                episode_number = int(match.group(2))

                                # エピソードヘッダーを追加
                                combined_content += f"\n\n## 第{act_number}幕第{episode_number}エピソード\n\n"

                                # エピソード本文を追加
                                episode_text = load_test_data(os.path.join(contents_dir, content_file))
                                combined_content += episode_text

                        target_content = combined_content
                        logging.info(f"小説全体の本文を作成しました: {len(target_content)}文字")
                    else:
                        logging.error("contentsディレクトリにエピソードファイルが見つかりません。テストを中止します。")
                        return ""
                else:
                    logging.error("contentsディレクトリが見つかりません。テストを中止します。")
                    return ""

        # ファイルパスをログに記録
        logging.info(f"ログファイル: {log_file_path}")
        logging.info(f"結果ファイル: {result_file_path}")
        logging.info(f"単語数上限: {word_count}")

        # APIクライアントの初期化
        dify_client = DifyStreamingAPI()

        # 開始時刻
        start_time = time.time()

        # サマリー生成メソッドの呼び出し
        response_generator = dify_client.generate_summary_stream(
            target_content=target_content,
            word_count=word_count,
            user_id="test_user_id"
        )

        # ストリーミングレスポンスの処理
        chunk_count, all_text, final_data = process_streaming_response(response_generator, log_file_path)

        # 処理時間
        elapsed_time = time.time() - start_time
        logging.info(f"処理時間: {elapsed_time:.2f}秒")

        # サマリーを抽出
        if final_data:
            if isinstance(final_data, str) and final_data.strip():
                generated_summary = final_data
                logging.info(f"最終チャンクから抽出したサマリー: {generated_summary[:100]}...")
            else:
                # その他の場合（未知の形式）
                logging.warning(f"最終データの形式が不明です: {type(final_data)}")
                generated_summary = str(final_data)
                logging.warning("文字列化したデータを使用します。")
        else:
            # 最終チャンクが見つからない場合は、連結したテキストを使用
            generated_summary = all_text
            logging.warning("最終チャンクが見つかりませんでした。連結したテキストを使用します。")

        # 結果をファイルに保存
        with open(result_file_path, 'w', encoding='utf-8') as f:
            f.write(generated_summary)

        logging.info(f"サマリー生成結果を保存しました: {result_file_path}")

        # 結果が空でないか確認
        if not generated_summary.strip():
            logging.warning("生成されたサマリーが空です")

    except Exception as e:
        logging.error(f"テスト実行中にエラーが発生しました: {e}")
        with open(log_file_path, 'a', encoding='utf-8') as log_file:
            log_file.write(f"\nエラー: {e}\n")

    logging.info("===== サマリー生成メソッドのテスト終了 =====")

    return generated_summary


def main():
    """
    メイン関数
    """
    parser = argparse.ArgumentParser(description='Dify Streaming API - サマリー生成のテスト')
    parser.add_argument('--word-count', type=int, default=200,
                        help='生成するサマリーの単語数上限')
    parser.add_argument('--content-file', type=str, default=None,
                        help='使用するコンテンツファイルのパス（指定しない場合はall_contents.txtまたはcontentsディレクトリから自動的に読み込む）')

    args = parser.parse_args()

    # コンテンツファイルを読み込む
    target_content = None
    if args.content_file:
        content_path = os.path.abspath(args.content_file)
        if os.path.exists(content_path):
            target_content = load_test_data(content_path)
            logging.info(f"指定されたコンテンツファイルを読み込みました: {content_path}")
        else:
            logging.error(f"指定されたコンテンツファイルが見つかりません: {content_path}")
            return

    # サマリー生成テストを実行
    generated_summary = test_create_summary_stream(
        target_content=target_content,
        word_count=args.word_count
    )

    # 結果を標準出力に表示
    print("\n===== 生成されたサマリー =====")
    print(generated_summary)


if __name__ == "__main__":
    main()
