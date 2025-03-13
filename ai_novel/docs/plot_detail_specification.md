# あらすじ詳細（プロット詳細）仕様書

## 1. 概要

あらすじ詳細（プロット詳細）は、AI小説執筆支援システムにおいて、小説のあらすじを詳細に定義するためのデータです。基本設定とキャラクター詳細をもとに、AIが小説のあらすじを3幕構成で生成し、管理するために使用されます。

## 2. データ構造

### 2.1 フロントエンド側のデータ構造 (TypeScript)

```typescript
// あらすじ詳細の型定義
export interface PlotDetail {
  id: number;
  ai_story: number | Story;
  act1: string;      // 第1幕
  act2: string;      // 第2幕
  act3: string;      // 第3幕
  raw_content?: string;  // 生データ（任意）
  created_at: string;
  updated_at: string;
}
```

### 2.2 バックエンド側のデータ構造 (Django Model)

```python
class PlotDetail(TimeStampedModel):
    """あらすじ詳細"""
    ai_story = models.ForeignKey(AIStory, on_delete=models.CASCADE, related_name='plot_details')
    act1 = models.TextField(_('第1幕'))
    act2 = models.TextField(_('第2幕'))
    act3 = models.TextField(_('第3幕'))
    raw_content = models.TextField(_('生データ'))  # APIから返ってきたそのままのテキスト
    is_edited = models.BooleanField(_('編集済み'), default=False)

    class Meta:
        verbose_name = _('あらすじ詳細')
        verbose_name_plural = _('あらすじ詳細')
        ordering = ['id']
```

## 3. フィールドの対応関係

フロントエンドとバックエンドのフィールドは以下のように対応しています：

| フロントエンド (PlotDetail) | バックエンド (PlotDetail) | 説明 |
|----------------------------|---------------------------|------|
| id                         | id                        | 一意のID |
| ai_story                   | ai_story                  | 関連する小説 |
| act1                       | act1                      | 第1幕 |
| act2                       | act2                      | 第2幕 |
| act3                       | act3                      | 第3幕 |
| raw_content                | raw_content               | 生データ |
| created_at                 | created_at                | 作成日時 |
| updated_at                 | updated_at                | 更新日時 |

## 4. データフロー

### 4.1 あらすじ詳細生成のフロー

1. ユーザーがあらすじ詳細の生成を要求
2. フロントエンドが `generatePlotDetail` API関数を呼び出し
3. バックエンドが基本設定とキャラクター詳細を取得
4. Dify APIを使用してあらすじ詳細を生成
5. 生成されたあらすじを3幕に分割して保存
6. フロントエンドに結果を返却

### 4.2 バックエンドでのデータ処理

1. `CreatePlotDetailView` がリクエストを受信
2. 基本設定データとキャラクター詳細を取得
3. Dify APIを使用してあらすじ詳細を生成
4. 生成されたコンテンツを3幕に分割
5. データベースにデータを保存
   - 小説（AIStory）との関連付け
   - 生成されたコンテンツを各幕に保存
   - 生データを `raw_content` フィールドに保存

## 5. API仕様

### 5.1 あらすじ詳細の生成

- **エンドポイント**: `/api/stories/{storyId}/create-plot-detail/`
- **メソッド**: POST
- **リクエストボディ**: なし
- **レスポンス**:
  ```json
  {
    "success": true,
    "data": {
      "task_id": "string",
      "status": "pending",
      "created_at": "string",
      "updated_at": "string"
    }
  }
  ```

### 5.2 あらすじ詳細の取得

- **エンドポイント**: `/api/stories/{storyId}/plot-detail/`
- **メソッド**: GET
- **レスポンス**:
  ```json
  {
    "success": true,
    "data": {
      "id": "number",
      "ai_story": {
        "id": "number",
        "title": "string",
        "description": "string"
      },
      "act1": "string",
      "act2": "string",
      "act3": "string",
      "raw_content": "string",
      "created_at": "string",
      "updated_at": "string"
    }
  }
  ```

### 5.3 あらすじ詳細の更新

- **エンドポイント**: `/api/stories/{storyId}/plot-detail/`
- **メソッド**: PATCH
- **リクエストボディ**:
  ```json
  {
    "act1": "string",
    "act2": "string",
    "act3": "string"
  }
  ```
- **レスポンス**:
  ```json
  {
    "success": true,
    "data": {
      "id": "number",
      "ai_story": {
        "id": "number",
        "title": "string",
        "description": "string"
      },
      "act1": "string",
      "act2": "string",
      "act3": "string",
      "raw_content": "string",
      "created_at": "string",
      "updated_at": "string"
    }
  }
  ```

## 6. Dify API連携

### 6.1 あらすじ詳細生成API

```python
def create_plot_detail(
    self,
    basic_setting: str,
    character_details: List[Dict[str, Any]],
    user_id: str,
    blocking: bool = True
) -> Dict[str, Any]:
    """
    あらすじ詳細を生成

    Args:
        basic_setting: 基本設定
        character_details: キャラクター詳細リスト
        user_id: ユーザーID
        blocking: ブロッキングモード（同期処理）

    Returns:
        Dict[str, Any]: レスポンス
    """
    # キャラクター詳細を文字列にシリアライズ
    character_details_str = json.dumps(character_details, ensure_ascii=False)

    inputs = {
        "basic_setting": basic_setting,
        "character_details": character_details_str
    }

    return self._make_api_request("plot_detail", inputs, user_id, blocking)
```

## 7. フロントエンド実装

### 7.1 あらすじ詳細の表示と編集

フロントエンドでは、あらすじ詳細を3幕構成で表示し、各幕ごとに編集できるUIを提供します。

```typescript
// あらすじ詳細の取得
const getPlotDetail = async (storyId: string | number): Promise<ApiResponse<PlotDetail>> => {
  // バックエンドにはplot/エンドポイントがないため、基本設定から情報を取得
  return fetchApi<PlotDetail>(`/stories/${storyId}/basic-setting/`)
}

// あらすじ詳細の生成
const generatePlotDetail = async (storyId: string | number): Promise<ApiResponse<TaskStatus>> => {
  return fetchApi<TaskStatus>(`/stories/${storyId}/create-plot-detail/`, {
    method: "POST",
  })
}

// あらすじ詳細の更新
const updatePlotDetail = async (storyId: string | number, data: Partial<PlotDetail>): Promise<ApiResponse<PlotDetail>> => {
  return fetchApi<PlotDetail>(`/stories/${storyId}/basic-setting/`, {
    method: "PATCH",
    body: JSON.stringify(removeEmptyValues(data)),
  })
}
```

## 8. 実装上の注意点

1. **3幕構成**:
   - あらすじ詳細は、第1幕（導入）、第2幕（展開）、第3幕（結末）の3幕構成で管理されます。
   - AIによる生成結果を適切に3幕に分割する処理が必要です。

2. **キャラクター詳細との連携**:
   - あらすじ詳細の生成には、事前に作成されたキャラクター詳細が必要です。
   - キャラクター詳細が不足している場合は、適切なエラーメッセージを表示する必要があります。

3. **raw_content フィールド**:
   - APIからのレスポンスをそのまま保存するために使用されます。
   - 将来的な分析や再生成のために保持されます。

4. **エラーハンドリング**:
   - フロントエンド側では、APIリクエスト失敗時にエラーメッセージをユーザーに表示します。
   - バックエンド側では、バリデーションエラーや処理エラーを適切なHTTPステータスコードとエラーメッセージで返します。

5. **非同期処理**:
   - あらすじ詳細の生成は時間がかかるため、非同期処理として実装されています。
   - タスクIDを返し、フロントエンドはタスクの完了を定期的にポーリングして確認します。
