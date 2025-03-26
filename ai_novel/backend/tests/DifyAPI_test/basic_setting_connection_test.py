#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
BasicSettingのAPIエンドポイント接続テスト
"""

import os
import sys
import json
import logging
import requests
from datetime import datetime

# ログ設定
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 出力ディレクトリ
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def simple_connection_test():
    """
    シンプルな接続テスト - BasicSettingDetailViewの機能をテスト
    """
    logger.info("===== BasicSettingDetailView 接続テスト開始 =====")
    
    # APIのベースURL
    base_url = "http://localhost:8001/api"
    
    # リクエストヘッダー
    headers = {
        "Content-Type": "application/json",
    }
    
    # テスト用のストーリーID（存在するストーリーIDを使用）
    story_id = 46
    
    # 出力ファイルのパスを生成
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = os.path.join(OUTPUT_DIR, f"connection_test_log_{timestamp}.txt")
    
    with open(log_file, "w") as f:
        f.write(f"接続テスト - 実行時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        try:
            # 1. まず単純なGETリクエストでアクセス可能か確認
            logger.info(f"ストーリーID {story_id} の最新BasicSettingを取得中...")
            f.write(f"ストーリーID {story_id} の最新BasicSettingを取得中...\n")
            
            response = requests.get(
                f"{base_url}/stories/{story_id}/latest-basic-setting/",
                headers=headers
            )
            
            f.write(f"ステータスコード: {response.status_code}\n")
            f.write(f"レスポンスヘッダー: {json.dumps(dict(response.headers))}\n")
            
            if response.status_code == 200:
                logger.info("接続成功！")
                f.write("接続成功！\n")
                f.write("レスポンス内容:\n")
                try:
                    f.write(json.dumps(response.json(), indent=2, ensure_ascii=False)[:2000] + "...\n")
                except Exception as e:
                    f.write(f"レスポンスのJSONパースエラー: {str(e)}\n")
                    f.write(f"レスポンス本文の最初の1000文字: {response.text[:1000]}\n")
            else:
                logger.error(f"接続エラー: {response.status_code}")
                f.write(f"接続エラー: {response.status_code}\n")
                f.write(f"エラーレスポンス: {response.text[:1000]}\n")
                
            # 2. 最新のBasicSettingのIDを取得
            if response.status_code == 200:
                basic_setting = response.json()
                basic_setting_id = basic_setting.get("id")
                
                if basic_setting_id:
                    f.write(f"\n取得したBasicSettingのID: {basic_setting_id}\n")
                    
                    # 3. 特定のBasicSettingを取得
                    f.write(f"\n特定のBasicSettingの取得をテスト中...\n")
                    detail_response = requests.get(
                        f"{base_url}/stories/{story_id}/basic-setting/{basic_setting_id}/",
                        headers=headers
                    )
                    
                    f.write(f"ステータスコード: {detail_response.status_code}\n")
                    
                    if detail_response.status_code == 200:
                        f.write("特定のBasicSettingの取得に成功！\n")
                    else:
                        f.write(f"特定のBasicSettingの取得エラー: {detail_response.status_code} - {detail_response.text[:500]}\n")
                    
                    # 4. PATCH APIをテスト - act1_overviewのみを更新
                    f.write("\nPATCH APIをテスト中（act1_overviewのみ更新）...\n")
                    
                    act_number = 1
                    update_data = {
                        "act1_overview": "接続テスト用に更新された第1幕のあらすじです。"
                    }
                    
                    patch_response = requests.patch(
                        f"{base_url}/stories/{story_id}/basic-setting/{basic_setting_id}/?act={act_number}",
                        json=update_data,
                        headers=headers
                    )
                    
                    f.write(f"ステータスコード: {patch_response.status_code}\n")
                    
                    if patch_response.status_code == 200:
                        f.write("PATCH APIの呼び出しに成功！\n")
                        f.write("更新されたデータ（一部）:\n")
                        try:
                            updated_data = patch_response.json()
                            f.write(f"act1_overview: {updated_data.get('act1_overview', '')[:200]}...\n")
                            f.write(f"raw_contentが含まれているか: {'raw_content' in updated_data}\n")
                        except Exception as e:
                            f.write(f"レスポンスのJSONパースエラー: {str(e)}\n")
                            f.write(f"レスポンス本文の最初の500文字: {patch_response.text[:500]}\n")
                    else:
                        f.write(f"PATCH APIの呼び出しエラー: {patch_response.status_code} - {patch_response.text[:500]}\n")
        
        except Exception as e:
            error_msg = f"接続テスト中にエラーが発生しました: {str(e)}"
            logger.error(error_msg)
            f.write(f"\n{error_msg}\n")
    
    logger.info(f"テスト完了: 結果は {log_file} に保存されました")
    logger.info("===== BasicSettingDetailView 接続テスト終了 =====")
    
    return log_file

if __name__ == "__main__":
    log_file = simple_connection_test()
    print(f"テスト結果は {log_file} に保存されました")
