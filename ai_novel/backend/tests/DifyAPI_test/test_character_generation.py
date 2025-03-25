#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
import time
import datetime
import logging
import re
from typing import List, Dict, Tuple, Iterator, Any
import json

# 親ディレクトリをパスに追加（インポートのため）
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from novel_gen.dify_streaming_api import DifyStreamingAPI

# ロガー設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

def load_text_file(file_path: str) -> str:
    """
    テキストファイルを読み込む

    Args:
        file_path: ファイルパス

    Returns:
        str: ファイルの内容
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        logger.error(f"ファイル読み込みエラー: {str(e)}")
        raise

def create_output_dirs() -> str:
    """
    出力ディレクトリを作成する

    Returns:
        str: 出力ディレクトリのパス
    """
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output")
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # 日別ディレクトリも作成
    today_str = datetime.datetime.now().strftime('%Y%m%d')
    today_dir = os.path.join(output_dir, today_str)
    if not os.path.exists(today_dir):
        os.makedirs(today_dir)
    
    return today_dir

def create_output_files(character_name: str, output_dir: str) -> Tuple[str, str]:
    """
    ログファイルと結果ファイルのパスを生成する

    Args:
        character_name: キャラクター名
        output_dir: 出力ディレクトリ

    Returns:
        Tuple[str, str]: ログファイルと結果ファイルのパス
    """
    # タイムスタンプを生成（ファイル名に使用）
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # キャラクター名を整形（ファイル名に使用）
    safe_name = re.sub(r'[\\/*?:"<>|]', '', character_name)
    safe_name = safe_name.replace('（', '_').replace('）', '').replace(' ', '_')
    
    # ファイルパスを生成
    log_file = os.path.join(output_dir, f"{safe_name}_log_{timestamp}.txt")
    result_file = os.path.join(output_dir, f"{safe_name}_result_{timestamp}.txt")
    
    return log_file, result_file

def extract_characters(characters_file: str) -> List[Dict[str, str]]:
    """
    キャラクターファイルからキャラクター情報を抽出する

    Args:
        characters_file: キャラクターファイルの内容

    Returns:
        List[Dict[str, str]]: キャラクター情報のリスト
    """
    characters = []
    
    # 「### 」で始まる行で分割
    character_blocks = []
    current_block = ""
    
    for line in characters_file.strip().split('\n'):
        if line.startswith('### ') and current_block:
            character_blocks.append(current_block)
            current_block = line
        else:
            if current_block or line.startswith('### '):
                current_block += line + '\n'
    
    if current_block:
        character_blocks.append(current_block)
    
    # 各ブロックを解析
    for block in character_blocks:
        if not block.strip() or not block.startswith("### "):
            continue
        
        # キャラクター名を抽出（####がある場合は除去）
        name_match = re.search(r'### ([^#\n]+)', block)
        if not name_match:
            continue
        
        # 名前だけを取得し、余分な文字列を除去
        name = name_match.group(1).strip()
        
        # 役割を抽出
        role = ""
        role_section = re.search(r'#### 役割\s*\n([^\n#]+)', block)
        if role_section:
            role = role_section.group(1).strip()
        
        # 説明を抽出
        description = ""
        desc_section = re.search(r'#### 説明\s*\n([^#]+)(?:\Z|(?=###))', block, re.DOTALL)
        if desc_section:
            description = desc_section.group(1).strip()
        
        # キャラクターデータの追加
        characters.append({
            "name": name,
            "role": role,
            "description": description,
            "raw_content": block.strip()
        })
    
    return characters

def test_single_character_generation(
    basic_setting_path: str,
    character_data: Dict[str, str]
) -> bool:
    """
    単一キャラクターの詳細生成をテストする

    Args:
        basic_setting_path: 基本設定ファイルのパス
        character_data: キャラクターデータ

    Returns:
        bool: 成功したかどうか
    """
    logger.info(f"===== {character_data['name']} の詳細生成テスト開始 =====")

    # 基本設定の読み込み
    basic_setting = load_text_file(basic_setting_path)
    basic_setting_preview = basic_setting[:500] + "..." if len(basic_setting) > 500 else basic_setting
    logger.info(f"基本設定 (最初の500文字): {basic_setting_preview}")

    # キャラクターデータの表示
    logger.info(f"キャラクター: {character_data['name']}")
    logger.info(f"役割: {character_data['role']}")
    character_desc_preview = character_data['description'][:200] + "..." if len(character_data['description']) > 200 else character_data['description']
    logger.info(f"説明: {character_desc_preview}")

    # 出力ディレクトリとファイルの準備
    output_dir = create_output_dirs()
    log_file, result_file = create_output_files(character_data['name'], output_dir)
    logger.info(f"ログファイル: {log_file}")
    logger.info(f"結果ファイル: {result_file}")
    
    # ログファイルの初期化
    with open(log_file, 'w', encoding='utf-8') as f:
        f.write(f"=== {character_data['name']} の詳細生成テストログ ===\n")
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
        for chunk in dify_api.create_character_detail_stream(
            basic_setting=basic_setting,
            character_data=character_data['raw_content'],
            user_id=user_id
        ):
            chunk_count += 1
            
            # エラーチェック
            if "error" in chunk:
                error_msg = f"APIエラー: {chunk['error']}"
                logger.error(error_msg)
                
                # ログファイルにエラーを記録
                with open(log_file, 'a', encoding='utf-8') as f:
                    f.write(f"[チャンク {chunk_count}] {error_msg}\n\n")
                
                return False
            
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
                
                # ログファイルにチャンクを記録（生データ）
                with open(log_file, 'a', encoding='utf-8') as f:
                    f.write(f"[チャンク {chunk_count}]\n")
                    f.write(f"{result_text}\n\n")
                
                # 完全なテキストに追加
                complete_text += result_text
                
                # Markdownコンテンツを抽出（メタデータを除外）
                if "# キャラクター詳細" in result_text:
                    # 見つかった場合は、その部分以降をMarkdownとして保持
                    markdown_start_index = result_text.find("# キャラクター詳細")
                    if markdown_start_index != -1:
                        markdown_content += result_text[markdown_start_index:]
                elif re.search(r'##\s+' + re.escape(character_data['name'].split('（')[0]), result_text) or \
                     re.search(r'##\s+名前', result_text):
                    # キャラクター名または「名前」で始まるMarkdownを検出
                    pattern = r'##\s+' + re.escape(character_data['name'].split('（')[0])
                    match = re.search(pattern, result_text)
                    if not match:
                        match = re.search(r'##\s+名前', result_text)
                    
                    if match:
                        markdown_start_index = match.start()
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
        if not markdown_content and "# キャラクター詳細" in complete_text:
            markdown_start_index = complete_text.find("# キャラクター詳細")
            if markdown_start_index != -1:
                markdown_content = complete_text[markdown_start_index:]
        elif not markdown_content:
            # キャラクター名または「名前」で始まるセクションを探す
            name_pattern = r'##\s+' + re.escape(character_data['name'].split('（')[0])
            match = re.search(name_pattern, complete_text)
            if not match:
                match = re.search(r'##\s+名前', complete_text)
            
            if match:
                markdown_start_index = match.start()
                markdown_content = complete_text[markdown_start_index:]
            elif '### 性別' in complete_text:
                # 性別セクションがある場合はそこから抽出
                gender_index = complete_text.find('### 性別')
                if gender_index > 0:
                    # 性別の前の行を探して、そこからMarkdownを抽出
                    prev_text = complete_text[:gender_index].strip()
                    last_line_index = prev_text.rfind('\n')
                    start_index = prev_text.rfind('\n', 0, last_line_index) if last_line_index > 0 else 0
                    markdown_content = complete_text[start_index:].strip()
        
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
        
        logger.info(f"{character_data['name']} のテスト成功")
        return True
        
    except Exception as e:
        error_msg = f"テスト実行中にエラーが発生しました: {str(e)}"
        logger.error(error_msg)
        
        # ログファイルにエラーを記録
        with open(log_file, 'a', encoding='utf-8') as f:
            f.write(f"[エラー] {error_msg}\n")
        
        return False

def batch_test_all_characters(
    basic_setting_path: str,
    characters_path: str
) -> bool:
    """
    すべてのキャラクターの詳細生成をバッチでテストする

    Args:
        basic_setting_path: 基本設定ファイルのパス
        characters_path: キャラクターファイルのパス

    Returns:
        bool: 全テスト成功したかどうか
    """
    logger.info("===== すべてのキャラクター詳細生成バッチテスト開始 =====")
    
    # キャラクターデータの読み込み
    characters_content = load_text_file(characters_path)
    characters = extract_characters(characters_content)
    
    logger.info(f"抽出されたキャラクター数: {len(characters)}")
    for idx, char in enumerate(characters, 1):
        logger.info(f"キャラクター {idx}: {char['name']} ({char['role']})")
    
    # 各キャラクターを順番にテスト
    results = []
    for char in characters:
        success = test_single_character_generation(basic_setting_path, char)
        results.append((char['name'], success))
        
        # 連続リクエストによるAPI制限を回避するための遅延
        if char != characters[-1]:  # 最後のキャラクター以外
            logger.info("次のキャラクター処理まで10秒待機します...")
            time.sleep(10)
    
    # 結果のサマリー
    logger.info("\n===== バッチテスト結果サマリー =====")
    all_success = True
    for name, success in results:
        status = "成功" if success else "失敗"
        logger.info(f"{name}: {status}")
        if not success:
            all_success = False
    
    if all_success:
        logger.info("すべてのキャラクター詳細生成テストが成功しました")
    else:
        logger.warning("一部のキャラクター詳細生成テストが失敗しました")
    
    return all_success

def test_single_mode():
    """単一キャラクターのテストモード"""
    # ファイルパスの設定
    basic_setting_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), 
        "input/basic_setting.txt"
    )
    characters_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), 
        "input/characters.txt"
    )
    
    # キャラクターの抽出
    characters_content = load_text_file(characters_path)
    characters = extract_characters(characters_content)
    
    if not characters:
        logger.error("キャラクターが見つかりませんでした")
        return False
    
    # 最初のキャラクターをテスト
    first_character = characters[0]
    logger.info(f"テスト対象キャラクター: {first_character['name']}")
    
    return test_single_character_generation(basic_setting_path, first_character)

def test_batch_mode():
    """すべてのキャラクターをバッチでテストするモード"""
    # ファイルパスの設定
    basic_setting_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), 
        "input/basic_setting.txt"
    )
    characters_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), 
        "input/characters.txt"
    )
    
    return batch_test_all_characters(basic_setting_path, characters_path)

if __name__ == "__main__":
    logger.info("Dify キャラクター詳細生成 APIテスト開始")
    
    import argparse
    parser = argparse.ArgumentParser(description='キャラクター詳細生成テスト')
    parser.add_argument('--mode', choices=['single', 'batch'], default='single',
                        help='テストモード: single(一人のみ) または batch(全キャラクター)')
    
    args = parser.parse_args()
    
    if args.mode == 'single':
        logger.info("シングルモードでテスト実行")
        success = test_single_mode()
    else:
        logger.info("バッチモードでテスト実行")
        success = test_batch_mode()
    
    if success:
        logger.info("テスト完了: 成功")
        sys.exit(0)
    else:
        logger.error("テスト完了: 失敗")
        sys.exit(1)
