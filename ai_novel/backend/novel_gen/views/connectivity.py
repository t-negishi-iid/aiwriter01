from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([AllowAny])
def is_live(request):
    """
    フロントエンドとバックエンドの疎通確認用の簡易エンドポイント
    認証不要でシンプルに "live" を返します
    """
    return Response({"results": "live"})
