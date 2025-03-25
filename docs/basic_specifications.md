# 基本仕様

## 目的

- DifyのAPIを使ったAI小説執筆支援システムの雛形を作成し、テスト。使い勝手を熟成させる・
- 作成した雛形は、小説執筆コミュニティサービス「誰でも作家life」に組み込んで一般ユーザーに提供する。
- ユーザーは与えられたクレジットを消費しながら小説を生成する。

## 名称

AI小説執筆支援

## 概要

- AIを使った小説執筆支援システムのプロトタイプ。
- Dify上に構築された執筆支援エージェントをAPI経由で利用して、小説を作成する
- ユーザーにはクレジットが与えられ、機能を使用するとクレジットを消費する。クレジットがゼロになると、クレジットが必要な機能は使えない。

## 執筆手順

1. 「基本設定作成用データ」の作成。テーマや舞台設定、使用するプロットを選択して、基本設定を作成するための土台となるデータを作成する。
消費クレジット：0

2. 「基本設定」の自動生成。「基本設定作成用データ」を元にオリジナルな作品設定と登場人物の設定、大まかなあらすじを自動生成。あらすじは3幕構成で各幕の展開も生成される。不満なら再生成。ユーザーが編集可能。
消費クレジット：1

3. 「基本設定」をユーザーが確認して手直し。ここでオリジナリティや精度を高める。
消費クレジット：0

4. 「キャラクター詳細INPUT」の作成。「基本設定」から登場人物を分割して、一人ずつ個別のデータを作成。分割はボタン1つで自動で行う。各登場人物データはユーザーが編集可能。
消費クレジット：0

5. 「キャラクター詳細」の作成。「キャラクター詳細INPUT」を1人分ずつAPIに投げて、深掘りしたキャラクター像を生成。不満なら再生成。
消費クレジット：2 （キャラクター1人1回につき）

6. 「あらすじ詳細」作成。「基本設定」と「キャラクター詳細」全員分をAPIに投げて3幕のそれぞれの構成を詳細化。3幕分の結果が返ってくるので自動分割して、3幕分のあらすじ詳細データとする。分割後の各幕のあらすじ詳細はユーザーが編集可能。
消費クレジット：2

7. 幕タイトル再生成。「あらすじ詳細」の各幕には仮の幕タイトルが付いているが、これを幕タイトルだけ再生成できる。
消費クレジット：1

8. 「エピソード詳細」の作成。1幕分の「あらすじ詳細」をAPIに投げて、指定された本数のエピソードに分割されたものが返ってくる。1本のテキストで返ってくるのでそれを各エピソード詳細に自動分割。分割されたエピソード詳細はユーザーが編集可能。
消費クレジット：3

9. 「エピソード本文」の執筆。分割された各「エピソード詳細」をAPIに投げて、各エピソードの本文を1本ずつ執筆する。APIから返ってきたエピソード本文はユーザーが編集可能。
消費クレジット：4

10. エピソードタイトル再生成。「エピソード本文」の各幕には仮のエピソードタイトルが付いているが、これをエピソードタイトルだけ再生成できる。
消費クレジット：1

11. 小説タイトル生成。全エピソードを元に小説タイトルを生成。
消費クレジット：3



## Dify API 仕様

1. 「基本設定作成用データ」の作成
  - input
    - 主題（選択肢・単一選択）
    - 時代と場所（選択肢・単一選択）
    - 作品世界と舞台設定（選択肢・単一選択）
    - プロットパターン（選択肢・単一選択）
    - 愛情表現（選択肢・複数選択）
    - 感情表現（選択肢・複数選択）
    - 雰囲気演出（選択肢・複数選択）
    - 官能表現（選択肢・複数選択）
    - 精神的要素（選択肢・複数選択）
    - 社会的要素（選択肢・複数選択）
    - 過去の謎（選択肢・複数選択）
  - output
    - 「基本設定作成用データ」
  - APIリファレンス
    - https://cloud.dify.ai/app/d4c27a11-237a-49e6-bdd3-28c410ff6f96/develop
  - APIシークレットキー
    - app-RVzFPhndqQyflqMxkmBAx8uV

2. 「基本設定」の作成
  - input
    - 「基本設定作成用データ」
  - output
    - 「基本設定」（作品設定とあらすじと登場人物）
  - APIリファレンス
    - https://cloud.dify.ai/app/912fa9b1-2a4a-4340-b748-427e4d538164/develop
  - APIシークレットキー
    - app-X1e1XPXOKzot8lWteTdVCgey


3. 「キャラクター詳細」作成
  - input
    - 「基本設定」
    - 「登場人物設定」（1人分）
  - output
    - 「キャラクター詳細」（1人分）
  - APIリファレンス
    - https://cloud.dify.ai/app/f1bb67ff-db37-49c6-b0b2-3790bcd488b3/develop
  - APIシークレットキー
    - app-zd3lFB9WVQNBY6jMhyI6mJPl

4. 「あらすじ詳細」作成
- input
    - 「基本設定」
    - 「キャラクター詳細」（全員分）
- output
    - 「あらすじ詳細」（3幕分）
  - APIリファレンス
    - https://cloud.dify.ai/app/60eff6b9-b713-4702-9924-49d42bb47f61/develop
  - APIシークレットキー
    - app-PYmSirQZfKrIE7mK0dtgBCww

5. 「幕内エピソード詳細」作成
- input
    - 「基本設定」
    - 「キャラクター詳細」（全員分）
    - 「あらすじ詳細」（3幕分）
    - 「あらすじ詳細」（エピソードを詳細化する1幕分）
    - エピソード数（正の整数値。詳細化する幕をいくつのエピソードに分割するか）
- output
    - 「エピソード詳細」（1エピソード分）
  - APIリファレンス
    - https://cloud.dify.ai/app/e38052bf-bbde-4e50-9776-d3c2af98d30a/develop
  - APIシークレットキー
    - app-BCSZGXvGxReumppDeWaYD8CM

6. 「エピソード本文」執筆
- input
    - 「基本設定」
    - 「キャラクター詳細」（全員分）
    - 「あらすじ詳細」（3幕分）
    - 「エピソード詳細」（執筆する1エピソード分）
    - 文字数（正の整数値。執筆するエピソードの文字数）
- output
    - 「エピソード本文」（1エピソード分）
  - APIリファレンス
    - https://cloud.dify.ai/app/0382253c-5aa6-488e-9022-2131fc268571/develop
  - APIシークレットキー
    - app-J845W1BSeaOD3z4hKVGQ5aQu

7. 「タイトル」作成
- input
    - 「基本設定」
    - 「キャラクター詳細」（全員分）
    - 「あらすじ詳細」（3幕分）
    - 「ターゲット文章」（エピソード本文、幕のあらすじ、小説本文など）
- output
    - 「タイトル」
  - APIリファレンス
    - https://cloud.dify.ai/app/b2bd1609-9fd1-4cdd-8f95-4f2b32bcdf75/develop
  - APIシークレットキー
    - app-wOwBxUnKb9kA8BYqQinc8Mb9





# 選択肢取得API
@api_view(['GET'])
def get_basic_setting_options(request):
    """基本設定作成用データの選択肢を取得するAPI"""
    options = {
        'themes': ['自己成長・成長物語', '恋愛成就', '復讐譚', '英雄の旅', ...],
        'timeAndPlaces': ['現代日本・都市部', '中世ヨーロッパ風ファンタジー世界', ...],
        # 他の選択肢も同様に定義
    }
    return Response(options)

# 基本設定作成用データ保存API
@api_view(['POST'])
def save_basic_setting_data(request, story_id):
    """基本設定作成用データを保存するAPI"""
    data = request.data

    # データベースに保存
    story = get_object_or_404(AIStory, id=story_id)
    basic_setting_data, created = BasicSettingData.objects.update_or_create(
        ai_story=story,
        defaults={
            'theme': data['theme'],
            'time_and_place': data['timeAndPlace'],
            'world_setting': data['worldSetting'],
            'plot_pattern': data['plotPattern'],
            'love_expressions': data['loveExpressions'],
            'emotional_expressions': data['emotionalExpressions'],
            'atmosphere': data['atmosphere'],
            'sensual_expressions': data['sensualExpressions'],
            'mental_elements': data['mentalElements'],
            'social_elements': data['socialElements'],
            'past_mysteries': data['pastMysteries'],
            'raw_content': data  # 元のデータも保存
        }
    )

    return Response({'id': basic_setting_data.id, 'created': created})

# 基本設定作成用データプレビューAPI
@api_view(['POST'])
def preview_basic_setting_data(request):
    """選択内容をテンプレートに埋め込んだ結果を返すAPI"""
    data = request.data

    # テンプレートを読み込み
    template_path = os.path.join(
        settings.BASE_DIR,
        'novel_gen_system_data/04_templates/01_基本設定作成用データテンプレート.md'
    )
    with open(template_path, 'r', encoding='utf-8') as f:
        template_content = f.read()

    # テンプレートに選択内容を埋め込む
    filled_template = template_content.format(
        theme=data['theme'],
        time_and_place=data['timeAndPlace'],
        world_setting=data['worldSetting'],
        plot_pattern=data['plotPattern'],
        love_expressions=', '.join(data['loveExpressions']),
        emotional_expressions=', '.join(data['emotionalExpressions']),
        atmosphere=', '.join(data['atmosphere']),
        sensual_expressions=', '.join(data['sensualExpressions']),
        mental_elements=', '.join(data['mentalElements']),
        social_elements=', '.join(data['socialElements']),
        past_mysteries=', '.join(data['pastMysteries'])
    )

    return Response({'preview': filled_template})

class BasicSettingData(models.Model):
    """基本設定作成用データ"""
    ai_story = models.ForeignKey('AIStory', on_delete=models.CASCADE, related_name='basic_setting_data')
    theme = models.CharField(max_length=100)
    time_and_place = models.CharField(max_length=100)
    world_setting = models.CharField(max_length=100)
    plot_pattern = models.CharField(max_length=100)
    love_expressions = ArrayField(models.CharField(max_length=100), blank=True)
    emotional_expressions = ArrayField(models.CharField(max_length=100), blank=True)
    atmosphere = ArrayField(models.CharField(max_length=100), blank=True)
    sensual_expressions = ArrayField(models.CharField(max_length=100), blank=True)
    mental_elements = ArrayField(models.CharField(max_length=100), blank=True)
    social_elements = ArrayField(models.CharField(max_length=100), blank=True)
    past_mysteries = ArrayField(models.CharField(max_length=100), blank=True)
    raw_content = JSONField(blank=True, null=True)  # 元のデータを保存
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_formatted_content(self):
        """テンプレートに埋め込んだ結果を返す"""
        # テンプレートを読み込み
        template_path = os.path.join(
            settings.BASE_DIR,
            'novel_gen_system_data/04_templates/01_基本設定作成用データテンプレート.md'
        )
        with open(template_path, 'r', encoding='utf-8') as f:
            template_content = f.read()

        # テンプレートに選択内容を埋め込む
        filled_template = template_content.format(
            theme=self.theme,
            time_and_place=self.time_and_place,
            world_setting=self.world_setting,
            plot_pattern=self.plot_pattern,
            love_expressions=', '.join(self.love_expressions),
            emotional_expressions=', '.join(self.emotional_expressions),
            atmosphere=', '.join(self.atmosphere),
            sensual_expressions=', '.join(self.sensual_expressions),
            mental_elements=', '.join(self.mental_elements),
            social_elements=', '.join(self.social_elements),
            past_mysteries=', '.join(self.past_mysteries)
        )

        return filled_template

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def make_dify_api_request(api_key, endpoint, data):
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

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
