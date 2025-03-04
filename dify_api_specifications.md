# Dify API仕様書

本ドキュメントではDify APIの使用方法について詳細に解説します。AI小説執筆支援システムでは、Dify上に構築された様々な執筆支援エージェントをAPI経由で利用します。

## 共通事項

### エンドポイント
```
https://api.dify.ai/v1/chat-messages
```

### 認証方法
Bearer認証を使用します。各APIには専用のAPIキーが割り当てられています。

```
Authorization: Bearer {API_KEY}
```

### リクエスト形式
Content-Typeは`application/json`を使用します。

### 基本的なリクエスト構造

```json
{
  "inputs": {
    // 各APIで必要なパラメータ
  },
  "query": "質問やプロンプト",
  "response_mode": "streaming",  // streaming または blocking
  "conversation_id": "会話ID",    // 新規会話の場合は省略可
  "user": "ユーザーID"           // オプション
}
```

### レスポンス処理
ストリーミングモードの場合は、以下のように処理します：

```python
def process_streaming_response(response):
    buffer = ""
    for line in response.iter_lines():
        if line:
            line = line.decode('utf-8')
            if line.startswith('data:'):
                data = json.loads(line[5:])
                if 'answer' in data:
                    buffer += data['answer']
                    yield {'chunk': data['answer'], 'full_text': buffer}
    return buffer
```

## 1. 基本設定作成用データの作成

### 概要
ユーザーが選択した主題、時代と場所、作品世界と舞台設定などの情報を元に、基本設定作成用データを作成します。

### APIリファレンス
https://cloud.dify.ai/app/d4c27a11-237a-49e6-bdd3-28c410ff6f96/develop

### APIキー
```
app-RVzFPhndqQyflqMxkmBAx8uV
```

### 入力パラメータ
```json
{
  "inputs": {
    "主題": "自己成長・成長物語",  // 選択肢から単一選択
    "時代と場所": "現代日本・都市部",  // 選択肢から単一選択
    "作品世界と舞台設定": "中世ヨーロッパ風ファンタジー世界",  // 選択肢から単一選択
    "プロットパターン": "英雄の旅",  // 選択肢から単一選択
    "愛情表現": ["恋愛", "友情"],  // 選択肢から複数選択
    "感情表現": ["喜び", "悲しみ"],  // 選択肢から複数選択
    "雰囲気演出": ["神秘的", "壮大"],  // 選択肢から複数選択
    "官能表現": ["ほのか"],  // 選択肢から複数選択
    "精神的要素": ["成長", "葛藤"],  // 選択肢から複数選択
    "社会的要素": ["階級", "差別"],  // 選択肢から複数選択
    "過去の謎": ["出生の秘密", "古代の遺物"]  // 選択肢から複数選択
  },
  "query": "これらの設定から基本設定作成用データを作成してください",
  "response_mode": "blocking"
}
```

### 出力
作品のテーマ、舞台設定、プロット、表現方法などをまとめた「基本設定作成用データ」

### 消費クレジット
0

## 2. 基本設定の作成

### 概要
「基本設定作成用データ」を元に、作品設定、登場人物設定、大まかなあらすじを自動生成します。

### APIリファレンス
https://cloud.dify.ai/app/912fa9b1-2a4a-4340-b748-427e4d538164/develop

### APIキー
```
app-X1e1XPXOKzot8lWteTdVCgey
```

### 入力パラメータ
```json
{
  "inputs": {
    "基本設定作成用データ": "「基本設定作成用データ」の内容をここに入力"
  },
  "query": "基本設定作成用データから基本設定を作成してください",
  "response_mode": "streaming"
}
```

### 出力
作品設定、登場人物設定、3幕構成のあらすじを含む「基本設定」

### 消費クレジット
1

## 3. キャラクター詳細の作成

### 概要
基本設定から抽出した登場人物データをもとに、キャラクターの詳細設定を作成します。

### APIリファレンス
https://cloud.dify.ai/app/f1bb67ff-db37-49c6-b0b2-3790bcd488b3/develop

### APIキー
```
app-zd3lFB9WVQNBY6jMhyI6mJPl
```

### 入力パラメータ
```json
{
  "inputs": {
    "基本設定": "「基本設定」の内容をここに入力",
    "登場人物設定": "詳細化する1人分の登場人物設定をここに入力"
  },
  "query": "この登場人物の詳細設定を作成してください",
  "response_mode": "streaming"
}
```

### 出力
1人分の「キャラクター詳細」設定

### 消費クレジット
2 (キャラクター1人1回につき)

## 4. あらすじ詳細の作成

### 概要
基本設定とすべてのキャラクター詳細をもとに、3幕構成のあらすじを詳細化します。

### APIリファレンス
https://cloud.dify.ai/app/60eff6b9-b713-4702-9924-49d42bb47f61/develop

### APIキー
```
app-PYmSirQZfKrIE7mK0dtgBCww
```

### 入力パラメータ
```json
{
  "inputs": {
    "基本設定": "「基本設定」の内容をここに入力",
    "キャラクター詳細": "全員分のキャラクター詳細をここに入力"
  },
  "query": "あらすじの詳細を作成してください",
  "response_mode": "streaming"
}
```

### 出力
3幕分の「あらすじ詳細」

### 消費クレジット
2

## 5. 幕内エピソード詳細の作成

### 概要
1幕分のあらすじ詳細をもとに、指定された数のエピソードに分割して詳細化します。

### APIリファレンス
https://cloud.dify.ai/app/e38052bf-bbde-4e50-9776-d3c2af98d30a/develop

### APIキー
```
app-BCSZGXvGxReumppDeWaYD8CM
```

### 入力パラメータ
```json
{
  "inputs": {
    "基本設定": "「基本設定」の内容をここに入力",
    "キャラクター詳細": "全員分のキャラクター詳細をここに入力",
    "あらすじ詳細": "3幕分のあらすじ詳細をここに入力",
    "エピソード化する幕のあらすじ": "詳細化する1幕分のあらすじをここに入力",
    "エピソード数": 3  // 正の整数値
  },
  "query": "この幕を指定されたエピソード数に分割してください",
  "response_mode": "streaming"
}
```

### 出力
指定された数の「エピソード詳細」

### 消費クレジット
3

## 6. エピソード本文の執筆

### 概要
エピソード詳細をもとに、実際のエピソード本文を執筆します。

### APIリファレンス
https://cloud.dify.ai/app/0382253c-5aa6-488e-9022-2131fc268571/develop

### APIキー
```
app-J845W1BSeaOD3z4hKVGQ5aQu
```

### 入力パラメータ
```json
{
  "inputs": {
    "基本設定": "「基本設定」の内容をここに入力",
    "キャラクター詳細": "全員分のキャラクター詳細をここに入力",
    "あらすじ詳細": "3幕分のあらすじ詳細をここに入力",
    "エピソード詳細": "執筆する1エピソード分の詳細をここに入力",
    "文字数": 2000  // 正の整数値
  },
  "query": "このエピソードの本文を執筆してください",
  "response_mode": "streaming"
}
```

### 出力
1エピソード分の「エピソード本文」

### 消費クレジット
4

## 7. タイトルの作成

### 概要
完成したコンテンツ（エピソード、幕、全体）のタイトルを生成します。

### APIリファレンス
https://cloud.dify.ai/app/b2bd1609-9fd1-4cdd-8f95-4f2b32bcdf75/develop

### APIキー
```
app-wOwBxUnKb9kA8BYqQinc8Mb9
```

### 入力パラメータ
```json
{
  "inputs": {
    "基本設定": "「基本設定」の内容をここに入力",
    "キャラクター詳細": "全員分のキャラクター詳細をここに入力",
    "あらすじ詳細": "3幕分のあらすじ詳細をここに入力",
    "ターゲット文章": "タイトルを生成したいコンテンツ（エピソード本文や幕のあらすじなど）をここに入力"
  },
  "query": "このコンテンツにふさわしいタイトルを生成してください",
  "response_mode": "blocking"
}
```

### 出力
対象コンテンツの「タイトル」

### 消費クレジット
- エピソードタイトル：1
- 幕タイトル：1
- 小説タイトル：3

## エラーハンドリング

APIリクエスト時の一般的なエラー処理：

```python
try:
    response = requests.post(
        "https://api.dify.ai/v1/chat-messages",
        headers=headers,
        json=data,
        timeout=60  # タイムアウトを設定
    )
    response.raise_for_status()
    return response.json()
except requests.RequestException as e:
    logger.error(f"Dify API request failed: {str(e)}")
    # リトライロジックを実装
    return {"error": str(e)}
```

## クレジット管理

ユーザーごとのクレジット消費を管理するためのコード例：

```python
def check_and_consume_credit(user_id, api_type):
    credit_map = {
        'basic_setting': 1,
        'character_detail': 2,
        'plot_detail': 2,
        'episode_detail': 3,
        'episode_content': 4,
        'title_episode': 1,
        'title_act': 1,
        'title_novel': 3
    }

    required_credit = credit_map.get(api_type, 0)
    user = User.objects.get(id=user_id)

    if user.has_sufficient_credit(required_credit):
        user.use_credit(required_credit)
        return True
    else:
        return False
```

## サンプル実装

基本設定の作成を行うPythonコード例：

```python
import requests
import json

def create_basic_setting(basic_setting_data):
    """
    基本設定作成用データから基本設定を作成する

    Args:
        basic_setting_data (str): 基本設定作成用データの文字列

    Returns:
        dict: API応答（成功時は基本設定のデータ、失敗時はエラー情報）
    """
    api_key = "app-X1e1XPXOKzot8lWteTdVCgey"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    data = {
        "inputs": {
            "基本設定作成用データ": basic_setting_data
        },
        "query": "基本設定作成用データから基本設定を作成してください",
        "response_mode": "blocking"  # または "streaming"
    }

    try:
        response = requests.post(
            "https://api.dify.ai/v1/chat-messages",
            headers=headers,
            json=data,
            timeout=60
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        return {"error": str(e)}
```

## 注意事項

1. ストリーミングモードを使用する場合は、クライアント側で適切に応答を処理する必要があります。
2. APIキーは秘密情報として扱い、公開リポジトリにコミットしないようにしてください。
3. 大量のリクエストを短時間に送信すると、レート制限がかかる可能性があります。
4. クレジット消費は各API呼び出し前に必ず確認し、不足している場合はユーザーに通知してください。
5. エラー発生時は適切にリトライやフォールバック処理を実装することをお勧めします。
