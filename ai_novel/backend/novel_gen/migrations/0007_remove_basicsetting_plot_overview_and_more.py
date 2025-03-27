# Generated by Django 4.2.20 on 2025-03-26 02:50

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('novel_gen', '0006_aistory_catchphrase_aistory_summary'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='basicsetting',
            name='plot_overview',
        ),
        migrations.RemoveField(
            model_name='basicsetting',
            name='story_setting',
        ),
        migrations.AddField(
            model_name='basicsetting',
            name='act1_title',
            field=models.TextField(blank=True, verbose_name='第1幕タイトル'),
        ),
        migrations.AddField(
            model_name='basicsetting',
            name='act2_title',
            field=models.TextField(blank=True, verbose_name='第2幕タイトル'),
        ),
        migrations.AddField(
            model_name='basicsetting',
            name='act3_title',
            field=models.TextField(blank=True, verbose_name='第3幕タイトル'),
        ),
        migrations.AddField(
            model_name='basicsetting',
            name='emotional',
            field=models.TextField(default='-', verbose_name='情緒的・感覚的要素'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='basicsetting',
            name='emotional_atmosphere',
            field=models.TextField(blank=True, verbose_name='雰囲気演出'),
        ),
        migrations.AddField(
            model_name='basicsetting',
            name='emotional_feelings',
            field=models.TextField(blank=True, verbose_name='感情表現'),
        ),
        migrations.AddField(
            model_name='basicsetting',
            name='emotional_love',
            field=models.TextField(blank=True, verbose_name='愛情表現'),
        ),
        migrations.AddField(
            model_name='basicsetting',
            name='emotional_sensuality',
            field=models.TextField(blank=True, verbose_name='官能的表現'),
        ),
        migrations.AddField(
            model_name='basicsetting',
            name='key_items',
            field=models.TextField(default='-', verbose_name='主な固有名詞'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='basicsetting',
            name='mystery',
            field=models.TextField(default='-', verbose_name='物語の背景となる過去の謎'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='basicsetting',
            name='plot_pattern',
            field=models.TextField(default='-', verbose_name='プロットパターン'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='basicsetting',
            name='summary',
            field=models.TextField(default='-', verbose_name='サマリー'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='basicsetting',
            name='theme',
            field=models.TextField(default='-', verbose_name='テーマ（主題）'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='basicsetting',
            name='theme_description',
            field=models.TextField(blank=True, verbose_name='テーマ（主題）の説明'),
        ),
        migrations.AddField(
            model_name='basicsetting',
            name='time_place',
            field=models.TextField(default='-', verbose_name='時代と場所'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='basicsetting',
            name='title',
            field=models.TextField(default='-', verbose_name='タイトル'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='basicsetting',
            name='world_setting',
            field=models.TextField(default='-', verbose_name='作品世界と舞台設定'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='basicsetting',
            name='world_setting_basic',
            field=models.TextField(blank=True, verbose_name='基本的な世界観'),
        ),
        migrations.AddField(
            model_name='basicsetting',
            name='world_setting_features',
            field=models.TextField(blank=True, verbose_name='特徴的な要素'),
        ),
        migrations.AddField(
            model_name='basicsetting',
            name='writing_style',
            field=models.TextField(default='-', verbose_name='参考とする作風'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='basicsetting',
            name='writing_style_expression',
            field=models.TextField(blank=True, verbose_name='表現技法'),
        ),
        migrations.AddField(
            model_name='basicsetting',
            name='writing_style_structure',
            field=models.TextField(blank=True, verbose_name='文体と構造的特徴'),
        ),
        migrations.AddField(
            model_name='basicsetting',
            name='writing_style_theme',
            field=models.TextField(blank=True, verbose_name='テーマと主題'),
        ),
        migrations.AlterField(
            model_name='aistory',
            name='summary',
            field=models.TextField(blank=True, max_length=200, null=True, verbose_name='概要'),
        ),
        migrations.AlterField(
            model_name='basicsetting',
            name='characters',
            field=models.TextField(verbose_name='主な登場人物'),
        ),
    ]
