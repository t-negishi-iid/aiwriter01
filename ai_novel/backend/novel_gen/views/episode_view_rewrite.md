# エピソードビューの完全作り直し

## エピソードビューの役割

- ActDetail（幕の詳細）を指定された数のエピソードに分割する。（Dify APIを使用）
- 各エピソードの作成、取得、更新、削除を行う
- 幕に属する全エピソードの一覧を取得する
- エピソードの並び順を入れ替える

## 作成するAPI

### ActDetailから分割されたエピソード群を生成する

URL：/api/stories/{story_id}/acts/{act_id}/create-episodes/

メソッド: POST

リクエストパラメータ:

- episode_count (int): 分割するエピソードの数

レスポンス:

- 200 OK: エピソードの作成に成功した場合
- 400 Bad Request: リクエストパラメータの検証に失敗した場合
- 401 Unauthorized: 認証が必要な場合
- 403 Forbidden: 認証されていないユーザーがアクセスしようとした場合
- 404 Not Found: 指定されたストーリーまたは幕が存在しない場合
- 500 Internal Server Error: 予期せぬ内部エラーが発生した場合

内部処理：

1. user_idがstory_idを所有しているか検証する。NGなら403
2. story_idがact_idを所有しているか検証する。NGなら403
3. act_idからActDetail.raw_contentを取得する
4. story_idからBasicSetting.raw_contentを取得する
5. story_idから全キャラクターのCharacterDetail.raw_contentを取得して配列化する
6. 3、4、5とエピソード数を渡してDify APIを呼び出す
7. Dify APIのレスポンスを解析して複数のエピソードに分割
8. 分割したエピソードを保存する
9. クレジットを消費する
10. successレスポンスを返す

### 幕に属する全エピソードの一覧を取得する

URL：/api/stories/{story_id}/acts/{act_id}/episodes/

メソッド: GET

レスポンス:

- 200 OK: エピソードの一覧を取得した場合
- 401 Unauthorized: 認証が必要な場合
- 403 Forbidden: 認証されていないユーザーがアクセスしようとした場合
- 404 Not Found: 指定されたストーリーまたは幕が存在しない場合
- 500 Internal Server Error: 予期せぬ内部エラーが発生した場合

内部処理:

1. user_idがstory_idを所有しているか検証する。NGなら403
2. story_idがact_idを所有しているか検証する。NGなら403
3. act_idから属する全エピソードを取得する
4. エピソードの一覧を返す

### エピソードの並び順を入れ替える

URL：/api/stories/{story_id}/acts/{act_id}/episodes/{episode_id}/

メソッド: PUT

リクエストパラメータ:

- episode_number (int): エピソードの新しい番号

レスポンス:

- 200 OK: エピソードの並び順を入れ替えた場合
- 400 Bad Request: リクエストパラメータの検証に失敗した場合
- 401 Unauthorized: 認証が必要な場合
- 403 Forbidden: 認証されていないユーザーがアクセスしようとした場合
- 404 Not Found: 指定されたストーリーまたは幕が存在しない場合
- 500 Internal Server Error: 予期せぬ内部エラーが発生した場合

内部処理:

内部処理:

1. トランザクションを開始する
2. user_idがstory_idを所有しているか検証する。NGなら403
3. story_idがact_idを所有しているか検証する。NGなら403
4. 対象のエピソード（source_episode）を取得する
5. 現在の位置（current_position = source_episode.episode_number）を記録
6. 移動先の位置（target_position = リクエストのepisode_number）を取得
7. 同じ幕内のすべてのエピソードを取得

8. PostgreSQLのbulk updateを使用して一括更新:

   # 上に移動する場合（current_position > target_position）

   if current_position > target_position:
       # PostgreSQLのCASE式を使用したbulk update
       EpisodeDetail.objects.filter(
           act_id=act_id,
           episode_number__gte=target_position,
           episode_number__lt=current_position
       ).update(
           episode_number=models.F('episode_number') + 1
       )

   # 下に移動する場合（current_position < target_position）

   elif current_position < target_position:
       # PostgreSQLのCASE式を使用したbulk update
       EpisodeDetail.objects.filter(
           act_id=act_id,
           episode_number__gt=current_position,
           episode_number__lte=target_position
       ).update(
           episode_number=models.F('episode_number') - 1
       )

   # 対象エピソードを更新

   source_episode.episode_number = target_position
   source_episode.save()

9. トランザクションをコミット
10. 標準DRFページネーション形式に従って更新されたエピソード一覧を返す:
    return Response({
        'count': episodes.count(),
        'next': None,
        'previous': None,
        'results': EpisodeDetailSerializer(
            EpisodeDetail.objects.filter(act_id=act_id).order_by('episode_number'),
            many=True
        ).data,
        'status': 'success'
    })

## エピソードの新規作成時

URL：/api/stories/{story_id}/acts/{act_id}/episodes/new/

メソッド: POST

リクエストパラメータ:

- title (str): エピソードのタイトル
- content (str): エピソードの内容

レスポンス:

- 200 OK: エピソードを新規作成した場合
- 400 Bad Request: リクエストパラメータの検証に失敗した場合
- 401 Unauthorized: 認証が必要な場合
- 403 Forbidden: 認証されていないユーザーがアクセスしようとした場合
- 404 Not Found: 指定されたストーリーまたは幕が存在しない場合
- 500 Internal Server Error: 予期せぬ内部エラーが発生した場合

内部処理:

1. user_idがstory_idを所有しているか検証する。NGなら403
2. story_idがact_idを所有しているか検証する。NGなら403
3. episode_numberを発番する
4. titleとcontentとepisode_numberを保存する
5. 発番したepisode_idを返す

## エピソードの取得

URL：/api/stories/{story_id}/acts/{act_id}/episodes/{episode_id}/

メソッド: GET

レスポンス:

- 200 OK: エピソードを取得した場合
- 401 Unauthorized: 認証が必要な場合
- 403 Forbidden: 認証されていないユーザーがアクセスしようとした場合
- 404 Not Found: 指定されたストーリーまたは幕またはエピソードが存在しない場合
- 500 Internal Server Error: 予期せぬ内部エラーが発生した場合

内部処理:

1. user_idがstory_idを所有しているか検証する。NGなら403
2. story_idがact_idを所有しているか検証する。NGなら403
3. episode_idから属するエピソードを取得する
4. エピソードを返す

## エピソードの更新

URL：/api/stories/{story_id}/acts/{act_id}/episodes/{episode_id}/

メソッド: PUT

リクエストパラメータ:

- title (str): エピソードのタイトル
- content (str): エピソードの内容

レスポンス:

- 200 OK: エピソードを更新した場合
- 400 Bad Request: リクエストパラメータの検証に失敗した場合
- 401 Unauthorized: 認証が必要な場合
- 403 Forbidden: 認証されていないユーザーがアクセスしようとした場合
- 404 Not Found: 指定されたストーリーまたは幕またはエピソードが存在しない場合
- 500 Internal Server Error: 予期せぬ内部エラーが発生した場合

内部処理:

1. user_idがstory_idを所有しているか検証する。NGなら403
2. story_idがact_idを所有しているか検証する。NGなら403
3. episode_idから属するエピソードを取得する
4. titleとcontentを更新する
5. エピソードを更新する
6. エピソードを返す

## エピソードの削除

URL：/api/stories/{story_id}/acts/{act_id}/episodes/{episode_id}/

メソッド: DELETE

レスポンス:

- 200 OK: エピソードを削除した場合
- 401 Unauthorized: 認証が必要な場合
- 403 Forbidden: 認証されていないユーザーがアクセスしようとした場合
- 404 Not Found: 指定されたストーリーまたは幕またはエピソードが存在しない場合
- 500 Internal Server Error: 予期せぬ内部エラーが発生した場合

内部処理:

1. user_idがstory_idを所有しているか検証する。NGなら403
2. story_idがact_idを所有しているか検証する。NGなら403
3. episode_idから属するエピソードを取得する
4. エピソードを削除する
5. エピソードを返す
