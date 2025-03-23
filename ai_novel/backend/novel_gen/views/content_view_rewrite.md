# エピソードコンテントビューの完全作り直し

## エピソードコンテントビューの役割

- EpisodeDetail（幕の詳細）を指定された文字数で小説本文を生成する。（Dify APIを使用）
- 各エピソード本文の作成、取得、更新、削除を行う
- 幕に属する全エピソード本文の一覧を取得する
- エピソード本文の並び順を入れ替える

## 作成するView

- CreateEpisodeContentView
  - Dify APIでエピソード詳細からエピソード本文を作成する
- EpisodeContentListView
  - 幕に属する全エピソード本文の一覧を取得する、新規作成する
- EpisodeContentDetailView
  - エピソード本文の取得、更新、削除を行う

## 作成するAPI

### EpisodeDetailからエピソード本文を生成する

URL：/api/stories/{story_id}/acts/{act_number}/episodes/content/{episode_number}/create/

メソッド: POST

リクエストパラメータ:

- basic_setting_id (int): BasicSetting.id
- word_count (int): エピソード本文の文字数

レスポンス:

- 200 OK: エピソード本文の作成に成功した場合
- 400 Bad Request: リクエストパラメータの検証に失敗した場合
- 401 Unauthorized: 認証が必要な場合
- 403 Forbidden: 認証されていないユーザーがアクセスしようとした場合
- 404 Not Found: 指定されたストーリーまたは幕またはエピソード詳細または作品設定が存在しない場合
- 500 Internal Server Error: 予期せぬ内部エラーが発生した場合

内部処理：

1. user_idがstory_idを所有しているか検証する。NGなら403
2. story_idとact_numberからactを取得する。actが存在しなければ403
3. act_idとepisode_numberからEpisodeDetail.raw_content を取得する。存在しなければ403
4. basic_setting_idからBasicSetting.raw_contentを取得する.存在しなければ403
5. story_idがBasicSettingを所有しているか検証する。NGなら403
6. story_idから全キャラクターのCharacterDetail.raw_contentを取得して配列化する
7. 3、4、5、6とword_countを渡してDify APIを呼び出す
8. Dify APIのレスポンスを取得する
9. 取得したエピソード本文を保存する
10. クレジットを消費する
11. successレスポンスを返す

### 幕に属する全エピソード本文の一覧を取得する

URL：/api/stories/{story_id}/acts/{act_number}/episodes/content/

メソッド: GET

レスポンス:

- 200 OK: エピソード本文の一覧を取得した場合
- 401 Unauthorized: 認証が必要な場合
- 403 Forbidden: 認証されていないユーザーがアクセスしようとした場合
- 404 Not Found: 指定されたストーリーまたは幕またはエピソード詳細が存在しない場合
- 500 Internal Server Error: 予期せぬ内部エラーが発生した場合

内部処理:

1. user_idがstory_idを所有しているか検証する。NGなら403
2. story_idとact_numberからactを取得する。存在しなければ403
3. act_idから属する全エピソード詳細に紐付いたエピソード本文を取得する
4. エピソードの一覧を返す

## エピソード本文の新規作成

URL：/api/stories/{story_id}/acts/{act_number}/episodes/content/

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
3. EpisodeDetailのepisode_numberを発番する
4. EpisodeDetailにtitleとcontentとepisode_numberを保存、episode_detail_idを発番する
5. EpisodeContentにtitleとcontentとepisode_detail_idを保存、episode_content_idを発番する
6. 発番したepisode_content_idを返す

## エピソード本文の取得

URL：/api/stories/{story_id}/acts/{act_number}/episodes/content/{episode_number}/

メソッド: GET

レスポンス:

- 200 OK: エピソード本文を取得した場合
- 401 Unauthorized: 認証が必要な場合
- 403 Forbidden: 認証されていないユーザーがアクセスしようとした場合
- 404 Not Found: 指定されたストーリーまたは幕またはエピソードが存在しない場合
- 500 Internal Server Error: 予期せぬ内部エラーが発生した場合

内部処理:

1. user_idがstory_idを所有しているか検証する。NGなら403
2. story_idとact_numberからactを取得。NGなら403
3. act.idとepisode_numberからEpisodeDetailを取得。NGなら403
4. EpisodeDetail.idに紐付くEpisodeContentを取得。存在しなければ404
5. EpisodeContentを返す

## エピソード本文の更新

URL：/api/stories/{story_id}/acts/{act_number}/episodes/content/{episode_number}/

メソッド: PUT

リクエストパラメータ:

- title (str): エピソードのタイトル
- content (str): エピソードの内容

レスポンス:

- 200 OK: エピソード本文を更新した場合
- 400 Bad Request: リクエストパラメータの検証に失敗した場合
- 401 Unauthorized: 認証が必要な場合
- 403 Forbidden: 認証されていないユーザーがアクセスしようとした場合
- 404 Not Found: 指定されたストーリーまたは幕またはエピソードが存在しない場合
- 500 Internal Server Error: 予期せぬ内部エラーが発生した場合

内部処理:

1. user_idがstory_idを所有しているか検証する。NGなら403
2. story_idとact_numberからactを取得。NGなら403
3. act.idとepisode_numberからEpisodeDetailを取得。NGなら403
4. EpisodeDetail.idに紐付くEpisodeContent.idを取得。存在しなければ404
5. EpisodeContentのtitleとcontentを更新する
6. successを返す

## エピソードの削除

URL：/api/stories/{story_id}/acts/{act_number}/episodes/content/{episode_number}/

メソッド: DELETE

レスポンス:

- 200 OK: エピソードを削除した場合
- 401 Unauthorized: 認証が必要な場合
- 403 Forbidden: 認証されていないユーザーがアクセスしようとした場合
- 404 Not Found: 指定されたストーリーまたは幕またはエピソードが存在しない場合
- 500 Internal Server Error: 予期せぬ内部エラーが発生した場合

内部処理:

1. user_idがstory_idを所有しているか検証する。NGなら403
2. story_idとact_numberからactを取得。NGなら403
3. act.idとepisode_numberからEpisodeDetailを取得。NGなら403
4. EpisodeDetail.idに紐付くEpisodeContentを取得。存在しなければ404
5. EpisodeContentを削除する
6. successを返す
