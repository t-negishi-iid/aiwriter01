"""
シンプルなis_liveエンドポイント
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.request import Request


class StoryIsLiveView(APIView):
    """
    特定の小説IDに対するis_liveエンドポイント
    リクエストボディに"Do you live?"が含まれていれば"I am still living."を返す
    """

    def post(self, request: Request, story_id: int) -> Response:
        """POSTリクエストを処理"""
        request_data = request.data

        if isinstance(request_data, dict) and request_data.get('message') == 'Do you live?':
            return Response({'results': 'I am still living.'})

        return Response({'results': 'I do not understand your question.'})

    def get(self, request: Request, story_id: int) -> Response:
        """GETリクエストを処理"""
        return Response({'results': 'I am still living.'})
