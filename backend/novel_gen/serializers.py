import json
import logging
from rest_framework import serializers
from novel_gen.models import BasicSettingData

# ロガーの設定
logger = logging.getLogger('novel_gen')

class BasicSettingDataCreateSerializer(serializers.ModelSerializer):
    """基本設定作成用データ作成シリアライザ"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        logger.debug("BasicSettingDataCreateSerializer initialized")
        if args:
            logger.debug(f"Serializer args: {args}")
        if kwargs:
            logger.debug(f"Serializer kwargs: {json.dumps({k: str(v) for k, v in kwargs.items()}, ensure_ascii=False)}")

    def validate(self, attrs):
        logger.debug(f"BasicSettingDataCreateSerializer.validate called with attrs: {json.dumps(attrs, ensure_ascii=False, indent=2)}")
        return super().validate(attrs)

    def create(self, validated_data):
        logger.debug(f"BasicSettingDataCreateSerializer.create called with validated_data: {json.dumps(validated_data, ensure_ascii=False, indent=2)}")
        try:
            instance = super().create(validated_data)
            logger.debug(f"BasicSettingData created with ID: {instance.id}")
            return instance
        except Exception as e:
            logger.exception(f"Exception in BasicSettingDataCreateSerializer.create: {str(e)}")
            raise

    class Meta:
        model = BasicSettingData
        fields = ('id', 'ai_story', 'theme', 'time_and_place', 'world_setting',
                 'plot_pattern', 'love_expressions', 'emotional_expressions',
                 'atmosphere', 'sensual_expressions', 'mental_elements',
                 'social_elements', 'past_mysteries', 'raw_content',
                 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')
