#!/usr/bin/env python3
"""
간단한 HTTP 서버 - v86 라이브러리 서빙용
CORS 및 적절한 MIME 타입 설정
"""

import http.server
import socketserver
import os
import sys
import mimetypes
from urllib.parse import urlparse

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # CORS 헤더 추가
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        
        # 캐시 무효화 (개발용)
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        
        super().end_headers()

    def guess_type(self, path):
        # MIME 타입 수동 설정
        if path.endswith('.js'):
            return 'application/javascript'
        elif path.endswith('.wasm'):
            return 'application/wasm'
        elif path.endswith('.css'):
            return 'text/css'
        elif path.endswith('.html'):
            return 'text/html'
        elif path.endswith('.png'):
            return 'image/png'
        elif path.endswith('.jpg') or path.endswith('.jpeg'):
            return 'image/jpeg'
        elif path.endswith('.ico'):
            return 'image/x-icon'
        
        return super().guess_type(path)

def main():
    # 사용 가능한 포트 시도
    ports = [8000, 8080, 3000, 5000, 9000]
    
    for port in ports:
        try:
            with socketserver.TCPServer(("", port), CustomHTTPRequestHandler) as httpd:
                print(f"🚀 서버 시작됨: http://localhost:{port}")
                print(f"📂 디렉토리: {os.getcwd()}")
                print(f"🌐 브라우저에서 http://localhost:{port} 접속하세요")
                print("🛑 종료하려면 Ctrl+C를 누르세요")
                print("-" * 50)
                
                try:
                    httpd.serve_forever()
                except KeyboardInterrupt:
                    print(f"\n✅ 서버 종료됨 (포트 {port})")
                    sys.exit(0)
                    
        except OSError as e:
            print(f"❌ 포트 {port} 사용 불가: {e}")
            continue
    
    print("😢 사용 가능한 포트가 없습니다.")
    sys.exit(1)

if __name__ == "__main__":
    main() 