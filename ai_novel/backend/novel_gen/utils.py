"""
AI小説執筆支援システムのユーティリティ関数
"""
import os
import json
import logging
from django.conf import settings
from typing import Dict, List, Any, Optional, Union, Tuple

logger = logging.getLogger(__name__)


def get_basic_setting_options() -> Dict[str, List[str]]:
    """
    基本設定作成用データの選択肢を取得する

    Returns:
        Dict[str, List[str]]: 選択肢の辞書
    """
    # 本番環境では設定データからロードするか、DBから取得するように実装
    options = {
        'themes': [
            '自己成長・成長物語',
            '恋愛成就',
            '復讐譚',
            '英雄の旅',
            '救済物語',
            '悲劇的転落',
            '自己発見',
            '冒険と探索',
            '社会批評',
            '心理的葛藤と自己克服'
        ],
        'timeAndPlaces': [
            '現代日本・都市部',
            '現代日本・地方',
            '近未来・日本',
            '中世ヨーロッパ風ファンタジー世界',
            '近代・明治/大正/昭和初期の日本',
            '遠未来・宇宙',
            '架空の歴史世界',
            '現代アメリカ',
            '戦国時代・日本',
            '江戸時代・日本'
        ],
        'worldSettings': [
            'リアル志向・現実的世界観',
            'ファンタジー世界・魔法あり',
            'SF・テクノロジー発展社会',
            'ディストピア・崩壊した社会',
            'ポストアポカリプス・文明崩壊後',
            'サイバーパンク・近未来都市',
            'スチームパンク・蒸気機関発達世界',
            'ダークファンタジー・暗黒世界',
            '異世界転移設定',
            'パラレルワールド・並行世界'
        ],
        'plotPatterns': [
            '成長物語',
            '冒険と帰還',
            '恋愛と成就',
            '試練と勝利',
            '復讐の達成',
            '謎解き',
            '救済と救出',
            '転落と再生',
            '運命への抗い',
            '自己発見'
        ],
        'loveExpressions': [
            '純愛',
            '片思い',
            '三角関係',
            '年の差恋愛',
            '初恋',
            '再会と再燃',
            '禁断の恋',
            '運命の相手',
            '相思相愛',
            '身分違いの恋'
        ],
        'emotionalExpressions': [
            '喜び・歓喜',
            '悲しみ・哀愁',
            '怒り・憤怒',
            '恐怖・恐れ',
            '不安・懸念',
            '嫉妬・羨望',
            '後悔・悔恨',
            '孤独・孤立感',
            '希望・期待',
            '罪悪感・自責'
        ],
        'atmosphere': [
            '明るく爽やか',
            '暗く重苦しい',
            '神秘的・幻想的',
            '緊迫・スリリング',
            '牧歌的・穏やか',
            'コミカル・ユーモラス',
            'シリアス・重厚',
            'メルヘン・童話的',
            'ノスタルジック・懐古的',
            'ドラマチック・感動的'
        ],
        'sensualExpressions': [
            '控えめな表現のみ',
            '抱擁・キスシーンあり',
            '情熱的な描写あり',
            '大人向けの官能表現あり',
            'エロティックな描写なし',
            '暗示的な表現のみ',
            '恋愛感情の描写のみ',
            '過激な表現あり',
            '性的緊張感の描写あり',
            '純愛的な表現のみ'
        ],
        'mentalElements': [
            'トラウマと克服',
            '自己成長',
            'アイデンティティの探求',
            '心の闇との対峙',
            '精神的成熟',
            '自己犠牲',
            '内なる恐怖との戦い',
            '記憶の喪失と発見',
            '罪悪感からの解放',
            '精神的葛藤'
        ],
        'socialElements': [
            '身分格差',
            '文化的対立',
            '世代間の価値観の相違',
            '伝統と革新の衝突',
            '階級闘争',
            '差別と偏見',
            'ジェンダー問題',
            '環境問題',
            '政治的陰謀',
            '戦争と平和'
        ],
        'pastMysteries': [
            '秘められた出生の秘密',
            '忘れられた過去の記憶',
            '家族の隠された歴史',
            '封印された古代の力',
            '前世からの因縁',
            '未解決の事件',
            '失われた遺産',
            '呪いと宿命',
            '隠された正体',
            '消された歴史'
        ]
    }
    return options


def check_and_consume_credit(user, api_type: str) -> Tuple[bool, str]:
    """
    クレジットを確認して消費する

    Args:
        user: ユーザーモデルまたはユーザーID
        api_type: API種別

    Returns:
        Tuple[bool, str]: (成功フラグ, メッセージ)
    """
    from .models import UserProfile, CreditHistory
    from django.contrib.auth.models import User

    # ユーザーIDの場合はUserオブジェクトを取得
    if isinstance(user, int):
        try:
            user = User.objects.get(id=user)
        except User.DoesNotExist:
            return False, "ユーザーが存在しません"

    # クレジット消費量マップ
    credit_map = {
        'basic_setting_data': 0,
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

    try:
        profile = UserProfile.objects.get(user=user)

        if profile.has_sufficient_credit(required_credit):
            if required_credit > 0:  # クレジット0の場合は消費しない
                profile.use_credit(required_credit)
            return True, f"{required_credit}クレジットを消費しました"
        else:
            return False, f"クレジットが不足しています（必要: {required_credit}, 所持: {profile.credit}）"
    except Exception as e:
        logger.error(f"クレジット消費エラー: {str(e)}")
        return False, f"クレジット処理エラー: {str(e)}"


def load_template_file(template_name: str) -> str:
    """
    テンプレートファイルを読み込む

    Args:
        template_name: テンプレートファイル名

    Returns:
        str: テンプレート内容
    """
    template_path = os.path.join(
        settings.BASE_DIR,
        'novel_gen_system_data',
        '04_templates',
        template_name
    )

    try:
        with open(template_path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        logger.error(f"テンプレートファイルが見つかりません: {template_path}")
        return ""
    except Exception as e:
        logger.error(f"テンプレート読み込みエラー: {str(e)}")
        return ""


def format_basic_setting_data(data: Dict[str, Any]) -> str:
    """
    基本設定作成用データをフォーマットする

    Args:
        data: 基本設定作成用データ

    Returns:
        str: フォーマット済みテキスト
    """
    template = load_template_file('01_基本設定作成用データテンプレート.md')

    if not template:
        return json.dumps(data, ensure_ascii=False, indent=2)

    # リスト型データは文字列に結合
    love_expressions = ', '.join(data.get('loveExpressions', []))
    emotional_expressions = ', '.join(data.get('emotionalExpressions', []))
    atmosphere = ', '.join(data.get('atmosphere', []))
    sensual_expressions = ', '.join(data.get('sensualExpressions', []))
    mental_elements = ', '.join(data.get('mentalElements', []))
    social_elements = ', '.join(data.get('socialElements', []))
    past_mysteries = ', '.join(data.get('pastMysteries', []))

    # テンプレートにデータを埋め込む
    filled_template = template.format(
        theme=data.get('theme', ''),
        time_and_place=data.get('timeAndPlace', ''),
        world_setting=data.get('worldSetting', ''),
        plot_pattern=data.get('plotPattern', ''),
        love_expressions=love_expressions,
        emotional_expressions=emotional_expressions,
        atmosphere=atmosphere,
        sensual_expressions=sensual_expressions,
        mental_elements=mental_elements,
        social_elements=social_elements,
        past_mysteries=past_mysteries
    )

    return filled_template
