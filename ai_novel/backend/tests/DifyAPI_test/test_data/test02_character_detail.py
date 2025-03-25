#!/usr/bin/env python
import requests
import os

def main():
    # 環境変数からDifyのAPIキーを取得（例：DIFY_API_KEY）
    api_key = "app-zd3lFB9WVQNBY6jMhyI6mJPl"  #小説02基本設定作成
    if not api_key:
        print("エラー: 環境変数 'DIFY_API_KEY' が設定されていません。")
        return

    # Difyのワークフロー実行APIのエンドポイントURL
    url = "https://api.dify.ai/v1/workflows/run"

    # HTTPヘッダーにAPIキーとコンテンツタイプを設定
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    # 外部ファイル 'basic_setting.md' からユーザープロンプト（3000文字程度）を読み込み
    basic_setting_file = "basic_setting.md"
    try:
        with open(basic_setting_file, "r", encoding="utf-8") as f:
            basic_setting = f.read()
    except Exception as e:
        return

    # 外部ファイル 'character_detail.md' からユーザープロンプト（200文字程度）を読み込み
    character_detail_file = "character_detail.md"
    try:
        with open(character_detail_file, "r", encoding="utf-8") as f:
            character_detail = f.read()
    except Exception as e:
        return



    # リクエストボディの作成
    # ※Dify側の受取変数が普通のテキスト段落の場合、ここでは "text" というキーを使っていると仮定しています。
    payload = {
        "inputs": {
            "basic_setting": basic_setting,  # ワークフローの入力変数名に合わせてください
            "character": character_detail  # ワークフローの入力変数名に合わせてください
        },
        "response_mode": "blocking",  # 完全な生成結果を一括で受け取るモード
        "user": "test_user"           # ユーザー識別用の任意のID
    }

    # Dify APIへPOSTリクエストを送信
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=60)
        response.raise_for_status()  # HTTPエラー（ステータスコード 4xx/5xx）の場合、例外を発生させる
        result = response.json()

        # レスポンス例（ワークフロー出力変数が "text" と仮定）
        output_text = result["data"]["outputs"].get("result", "")
        print("APIキーは有効です。キャラクター設定:")
        print(output_text)
    except requests.exceptions.RequestException as req_err:
        print("APIリクエストエラー:", req_err)
    except Exception as e:
        print("予期せぬエラーが発生しました:", e)

if __name__ == "__main__":
    main()
