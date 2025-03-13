import json
import logging
import time
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger('novel_gen')

class RequestResponseLoggingMiddleware(MiddlewareMixin):
    """
    リクエストとレスポンスの詳細をログに記録するミドルウェア
    """

    def process_request(self, request):
        """リクエストの処理前にログを記録"""
        request.start_time = time.time()

        # リクエストパスとメソッドをログに記録
        logger.debug(f"Request: {request.method} {request.path}")

        # リクエストヘッダーをログに記録
        headers = {k: v for k, v in request.headers.items()}
        logger.debug(f"Request Headers: {json.dumps(headers, ensure_ascii=False)}")

        # リクエストボディをログに記録（POSTリクエストの場合）
        if request.method in ['POST', 'PUT', 'PATCH'] and request.body:
            try:
                body = request.body.decode('utf-8')
                # JSONの場合はパースしてフォーマット
                if request.content_type and 'application/json' in request.content_type:
                    try:
                        body_json = json.loads(body)
                        logger.debug(f"Request Body: {json.dumps(body_json, ensure_ascii=False, indent=2)}")
                    except json.JSONDecodeError:
                        logger.debug(f"Request Body (raw): {body}")
                else:
                    logger.debug(f"Request Body (raw): {body}")
            except Exception as e:
                logger.debug(f"Could not log request body: {str(e)}")

        return None

    def process_response(self, request, response):
        """レスポンスの処理後にログを記録"""
        # 処理時間を計算
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
            logger.debug(f"Response time: {duration:.3f}s")

        # レスポンスステータスをログに記録
        logger.debug(f"Response: {response.status_code}")

        # レスポンスヘッダーをログに記録
        headers = {k: v for k, v in response.items()}
        logger.debug(f"Response Headers: {json.dumps(headers, ensure_ascii=False)}")

        # レスポンスボディをログに記録
        if hasattr(response, 'content'):
            try:
                content = response.content.decode('utf-8')
                # JSONの場合はパースしてフォーマット
                content_type = response.get('Content-Type', '')
                if 'application/json' in content_type:
                    try:
                        content_json = json.loads(content)
                        # 長すぎる場合は省略
                        if len(json.dumps(content_json)) > 1000:
                            logger.debug(f"Response Body (truncated): {json.dumps(content_json, ensure_ascii=False, indent=2)[:1000]}...")
                        else:
                            logger.debug(f"Response Body: {json.dumps(content_json, ensure_ascii=False, indent=2)}")
                    except json.JSONDecodeError:
                        if len(content) > 1000:
                            logger.debug(f"Response Body (raw, truncated): {content[:1000]}...")
                        else:
                            logger.debug(f"Response Body (raw): {content}")
                else:
                    if len(content) > 1000:
                        logger.debug(f"Response Body (raw, truncated): {content[:1000]}...")
                    else:
                        logger.debug(f"Response Body (raw): {content}")
            except Exception as e:
                logger.debug(f"Could not log response body: {str(e)}")

        return response

    def process_exception(self, request, exception):
        """例外発生時にログを記録"""
        logger.exception(f"Exception in request: {str(exception)}")
        return None
