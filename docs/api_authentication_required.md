# API認証要件

現在の開発環境では、APIエンドポイントにアクセスする際に明示的なユーザー認証は行っていません。`backend/novel_gen/utils.py` に定義されている `AlwaysAuthenticatedAuthentication` を `REST_FRAMEWORK` の `DEFAULT_AUTHENTICATION_CLASSES` に追加することで、すべてのリクエストをデフォルトユーザー `default_user` として処理します。

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'novel_gen.utils.AlwaysAuthenticatedAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
}
```

- `AlwaysAuthenticatedAuthentication` は常に認証済みのユーザーを返すため、`request.user` が空になることはありません。
- `DEFAULT_PERMISSION_CLASSES` が `AllowAny` のため、すべてのエンドポイントに認証なしでアクセスできます。

将来的には `AlwaysAuthenticatedAuthentication` を削除し、Django Allauth と SimpleJWT を利用した通常の認証方式に移行する想定です。
