// Browser Linux Emulator - Performance Cache Service Worker
const CACHE_NAME = 'linux-emulator-v1';
const CORE_CACHE_FILES = [
    '/',
    '/index.html',
    '/script.js',
    '/style.css',
    '/libv86.js',
    '/v86.wasm',
    '/freedos722.img',
    '/bios/seabios.bin',
    '/bios/vgabios.bin'
];

// 설치 이벤트 - 핵심 파일들을 캐시
self.addEventListener('install', event => {
    console.log('⚡ Service Worker installing - caching core files');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(CORE_CACHE_FILES);
            })
            .then(() => {
                console.log('✅ Core files cached successfully');
                return self.skipWaiting();
            })
            .catch(error => {
                console.log('⚠️ Cache failed for some files:', error);
            })
    );
});

// 활성화 이벤트 - 이전 캐시 정리
self.addEventListener('activate', event => {
    console.log('🔄 Service Worker activating - cleaning old caches');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('✅ Cache cleanup completed');
            return self.clients.claim();
        })
    );
});

// Fetch 이벤트 - 캐시 우선 전략
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // API 요청은 캐시하지 않음
    if (url.pathname.startsWith('/api/')) {
        return;
    }
    
    // 핵심 파일들에 대한 캐시 우선 전략
    if (CORE_CACHE_FILES.some(file => url.pathname.endsWith(file) || url.pathname === file)) {
        event.respondWith(
            caches.match(event.request).then(response => {
                if (response) {
                    console.log('📦 Serving from cache:', url.pathname);
                    return response;
                }
                
                console.log('🌐 Fetching from network:', url.pathname);
                return fetch(event.request).then(response => {
                    // 성공적인 응답만 캐시
                    if (response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return response;
                });
            }).catch(() => {
                console.log('❌ Failed to serve:', url.pathname);
                // 오프라인 상태에서의 폴백 처리
                if (url.pathname === '/' || url.pathname.endsWith('.html')) {
                    return caches.match('/index.html');
                }
            })
        );
    }
});

// 메시지 이벤트 - 캐시 관리
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        console.log('🗑️ Manual cache clear requested');
        caches.delete(CACHE_NAME).then(() => {
            event.ports[0].postMessage({ success: true });
        });
    }
});

console.log('🚀 Service Worker loaded - Performance optimizations active'); 