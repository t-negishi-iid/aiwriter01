#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Dify Streaming APIのテスト用スクリプト
"""

import os
import sys
import time
import json
import logging
import datetime
from typing import Dict, Any, List, Iterator, Tuple

# プロジェクトのルートディレクトリをパスに追加
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

# Dify Streaming APIのインポート
from novel_gen.dify_streaming_api import DifyStreamingAPI

# ロギングの設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


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
        logger.error(f"テストデータの読み込みに失敗しました: {str(e)}")
        sys.exit(1)


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
    base_dir = os.path.dirname(__file__)
    
    # 出力ディレクトリを作成
    output_dir = os.path.join(base_dir, "output")
    os.makedirs(output_dir, exist_ok=True)
    
    # ファイルパスを生成
    log_file = os.path.join(output_dir, f"{test_name}_log_{timestamp}.txt")
    result_file = os.path.join(output_dir, f"{test_name}_result_{timestamp}.txt")
    
    return log_file, result_file


def test_create_basic_setting_stream():
    """
    create_basic_setting_streamメソッドのテスト
    """
    logger.info("===== create_basic_setting_streamメソッドのテスト開始 =====")

    # テストデータの読み込み
    test_data_path = os.path.join(
        os.path.dirname(__file__), "input/basic_settings_data.txt")
    basic_setting_data = load_test_data(test_data_path)
    
    # 最初の500文字だけをログに出力
    logger.info(f"テストデータ (最初の500文字): {basic_setting_data[:500]}...")

    # 出力ファイルのパスを生成
    log_file, result_file = create_output_files("basic_setting")
    logger.info(f"ログファイル: {log_file}")
    logger.info(f"結果ファイル: {result_file}")
    
    # ログファイルの初期化
    with open(log_file, 'w', encoding='utf-8') as f:
        f.write("=== create_basic_setting_streamメソッドのテストログ ===\n")
        f.write(f"開始時刻: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write("=== 受信チャンクログ ===\n\n")

    # DifyStreamingAPIのインスタンスを作成（タイムアウトを長めに設定）
    dify_api = DifyStreamingAPI(timeout=120)
    
    # テスト用のユーザーID
    user_id = "test_user_001"
    
    # 結果格納用の変数
    complete_text = ""
    markdown_content = ""
    previous_chunks = set()  # 重複チャンクを検出するためのセット
    chunk_count = 0
    processed_chunk_count = 0
    all_chunks = []  # すべてのチャンクを格納するリスト
    
    try:
        logger.info("APIリクエスト開始")
        start_time = time.time()
        
        # ストリーミングAPIの呼び出し
        for chunk in dify_api.create_basic_setting_stream(
            basic_setting_data=basic_setting_data,
            user_id=user_id
        ):
            # 各チャンクの処理
            chunk_count += 1
            
            # エラーチェック
            if "error" in chunk:
                error_msg = f"APIエラー: {chunk['error']}"
                logger.error(error_msg)
                
                # ログファイルにエラーを記録
                with open(log_file, 'a', encoding='utf-8') as f:
                    f.write(f"[チャンク {chunk_count}] {error_msg}\n\n")
                
                break
            
            # ログファイルにチャンク全体を記録
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write(f"=== チャンク {chunk_count} ===\n")
                f.write(str(chunk) + "\n\n")
            
            # 結果の表示と記録（最初の100文字まで）
            if "data" in chunk and "outputs" in chunk["data"] and "result" in chunk["data"]["outputs"]:
                result_text = chunk["data"]["outputs"]["result"]
                
                # result_textがリストの場合は文字列に変換
                if isinstance(result_text, list):
                    result_text = json.dumps(result_text, ensure_ascii=False)
                
                # 重複チャンクの検出（チャンクのハッシュ値を使用）
                chunk_hash = hash(result_text)
                if chunk_hash in previous_chunks:
                    logger.info(f"重複チャンクをスキップ: チャンク {chunk_count}")
                    continue
                
                previous_chunks.add(chunk_hash)
                processed_chunk_count += 1
                
                result_preview = result_text[:100] + "..." if len(result_text) > 100 else result_text
                log_message = f"チャンク {chunk_count}: {result_preview}"
                logger.info(log_message)
                
                # 完全なテキストに追加
                complete_text += result_text
                
                # Markdownコンテンツを抽出（メタデータを除外）
                if "# 基本設定" in result_text:
                    # 見つかった場合は、その部分以降をMarkdownとして保持
                    markdown_start_index = result_text.find("# 基本設定")
                    if markdown_start_index != -1:
                        markdown_content += result_text[markdown_start_index:]
                elif markdown_content and "metadata" not in result_text:
                    # すでにMarkdownコンテンツが抽出された後で、メタデータを含まないチャンク
                    markdown_content += result_text
            
            # すべてのチャンクを格納
            all_chunks.append(chunk)
            
            # 完了フラグのチェック
            if "done" in chunk and chunk["done"]:
                done_msg = "ストリーミング完了"
                logger.info(done_msg)
                
                # ログファイルに完了メッセージを記録
                with open(log_file, 'a', encoding='utf-8') as f:
                    f.write(f"[完了] {done_msg}\n\n")
                
                # 最終チャンクからのMarkdown抽出処理
                last_chunk_markdown = dify_api.get_markdown_from_last_chunk(chunk, all_chunks)
                if last_chunk_markdown:
                    logger.info(f"最終チャンクからMarkdownを抽出しました")
                    markdown_content = last_chunk_markdown
                
                break
        
        # 処理時間の計算
        elapsed_time = time.time() - start_time
        logger.info(f"処理時間: {elapsed_time:.2f}秒")
        
        # 結果の集計
        logger.info(f"受信したチャンク数: {chunk_count}")
        logger.info(f"処理したユニークチャンク数: {processed_chunk_count}")
        logger.info(f"合計テキスト長: {len(complete_text)}文字")
        
        # Markdownが抽出されなかった場合のフォールバック処理
        if not markdown_content and "# 基本設定" in complete_text:
            markdown_start_index = complete_text.find("# 基本設定")
            if markdown_start_index != -1:
                markdown_content = complete_text[markdown_start_index:]
        
        # 最終的なMarkdownプレビューを表示
        if markdown_content:
            markdown_preview = markdown_content[:500] + "..." if len(markdown_content) > 500 else markdown_content
            logger.info(f"抽出されたMarkdown (最初の500文字): {markdown_preview}")
        else:
            logger.warning("Markdownコンテンツを抽出できませんでした")
            # 生データの一部をプレビュー表示
            result_preview = complete_text[:500] + "..." if len(complete_text) > 500 else complete_text
            logger.info(f"最終結果 (最初の500文字): {result_preview}")
        
        # ログファイルにサマリーを追加
        with open(log_file, 'a', encoding='utf-8') as f:
            f.write("\n\n")
            f.write("=== テスト結果サマリー ===\n")
            f.write(f"終了時刻: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"処理時間: {elapsed_time:.2f}秒\n")
            f.write(f"受信したチャンク数: {chunk_count}\n")
            f.write(f"処理したユニークチャンク数: {processed_chunk_count}\n")
            f.write(f"合計テキスト長: {len(complete_text)}文字\n")
            f.write(f"結果ファイル: {result_file}\n")
        
        # 結果の保存（純粋なMarkdownのみ）
        if markdown_content:
            with open(result_file, 'w', encoding='utf-8') as f:
                f.write(markdown_content)
            logger.info(f"純粋なMarkdownを結果ファイルに保存しました: {result_file}")
        else:
            # フォールバック: 生データをそのまま保存
            with open(result_file, 'w', encoding='utf-8') as f:
                f.write(complete_text)
            logger.info(f"Markdownの抽出に失敗したため、生データを保存しました: {result_file}")
        
        logger.info("テスト成功")
        return True
        
    except Exception as e:
        error_msg = f"テスト実行中にエラーが発生しました: {str(e)}"
        logger.error(error_msg)
        
        # ログファイルにエラーを記録
        with open(log_file, 'a', encoding='utf-8') as f:
            f.write(f"[エラー] {error_msg}\n")
        
        return False


def main():
    """
    メイン関数
    """
    logger.info("Dify Streaming APIテスト開始")
    
    # create_basic_setting_streamメソッドのテスト
    success = test_create_basic_setting_stream()
    
    if success:
        logger.info("すべてのテストが成功しました")
    else:
        logger.error("テスト中にエラーが発生しました")
        sys.exit(1)


if __name__ == "__main__":
    main()
