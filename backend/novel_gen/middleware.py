import json
import logging
import time
from django.utils.deprecation import MiddlewareMixin

request_logger = logging.getLogger('novel_gen.requests')

class RequestLogMiddleware(MiddlewareMixin):
    """リクエストとレスポンスの詳細をログに記録するミドルウェア"""

    def process_request(self, request):
        request.start_time = time.time()

        # リクエストの詳細をログに記録
        headers = dict(request.headers)
        # 機密情報をマスク
        if 'Authorization' in headers:
            headers['Authorization'] = 'MASKED'
        if 'Cookie' in headers:
            headers['Cookie'] = 'MASKED'

        request_data = {
            'method': request.method,
            'path': request.path,
            'query_params': dict(request.GET),
            'headers': headers,
        }

        # POSTデータの記録
        if request.method in ['POST', 'PUT', 'PATCH']:
            try:
                if request.content_type == 'application/json':
                    # JSONデータの場合
                    try:
                        body = json.loads(request.body.decode('utf-8'))
                        request_data['body'] = body
                    except json.JSONDecodeError:
                        request_data['body'] = request.body.decode('utf-8')
                elif request.content_type == 'multipart/form-data':
                    # フォームデータの場合
                    request_data['body'] = dict(request.POST)
                    request_data['files'] = {k: f.name for k, f in request.FILES.items()}
                else:
                    # その他のデータ形式
                    request_data['body'] = request.body.decode('utf-8')
            except Exception as e:
                request_data['body_error'] = str(e)

        request_logger.debug(f"REQUEST: {json.dumps(request_data, ensure_ascii=False, indent=2)}")
        return None

    def process_response(self, request, response):
        # レスポンスの詳細をログに記録
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
        else:
            duration = 0

        response_data = {
            'status_code': response.status_code,
            'duration': f"{duration:.4f}s",
            'content_type': response.get('Content-Type', ''),
        }

        # レスポンスボディの記録（JSONの場合のみ）
        if response.get('Content-Type') == 'application/json':
            try:
                body = json.loads(response.content.decode('utf-8'))
                response_data['body'] = body
            except (json.JSONDecodeError, UnicodeDecodeError):
                response_data['body'] = 'Non-JSON or binary content'

        log_level = logging.DEBUG if 200 <= response.status_code < 400 else logging.ERROR
        request_logger.log(log_level, f"RESPONSE: {json.dumps(response_data, ensure_ascii=False, indent=2)}")
        return response
