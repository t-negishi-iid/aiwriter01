#!/usr/bin/env python
import requests
import os

def main():
    # 環境変数からDifyのAPIキーを取得（例：DIFY_API_KEY）
    api_key = "app-X1e1XPXOKzot8lWteTdVCgey"  #小説02基本設定作成
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

    # 外部ファイル 'basic_settings_data.md' からユーザープロンプト（3000文字程度）を読み込み
    prompt_file = "basic_settings_data.md"
    try:
        with open(prompt_file, "r", encoding="utf-8") as f:
            user_prompt = f.read()
    except Exception as e:
        return

    # リクエストボディの作成
    # ※Dify側の受取変数が普通のテキスト段落の場合、ここでは "text" というキーを使っていると仮定しています。
    payload = {
        "inputs": {
            "basic_setting_data": user_prompt  # ワークフローの入力変数名に合わせてください
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
        print("APIキーは有効です。生成された小説:")
        print(output_text)
    except requests.exceptions.RequestException as req_err:
        print("APIリクエストエラー:", req_err)
    except Exception as e:
        print("予期せぬエラーが発生しました:", e)

if __name__ == "__main__":
    main()
