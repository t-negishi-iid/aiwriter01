import logging
import time
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger('novel_gen')

class RequestResponseLoggingMiddleware(MiddlewareMixin):
    """
    シンプル化されたリクエスト・レスポンスログミドルウェア
    """

    def process_request(self, request):
        """リクエストの処理前に最小限の情報をログに記録"""
        request.start_time = time.time()
        # リクエストパスとメソッドのみ記録
        logger.info(f"Request: {request.method} {request.path}")
        return None

    def process_response(self, request, response):
        """レスポンスの処理後に最小限の情報をログに記録"""
        # 処理時間を計算
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
            logger.info(f"Response: {response.status_code} for {request.method} {request.path} ({duration:.3f}s)")
        else:
            logger.info(f"Response: {response.status_code} for {request.method} {request.path}")

        return response

    def process_exception(self, request, exception):
        """例外発生時に最小限の情報をログに記録"""
        logger.error(f"Exception in {request.method} {request.path}: {str(exception)}")
        return None
