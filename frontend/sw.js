/**
 * Portfolio+ Service Worker
 * 提供離線支援、緩存管理和背景同步功能
 */

const CACHE_VERSION = '2.0';
const CACHE_NAME = `portfolio-v${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `portfolio-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `portfolio-dynamic-v${CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `portfolio-images-v${CACHE_VERSION}`;

// 需要緩存的靜態資源
const STATIC_ASSETS = [
    '/portfolio/frontend/index.html',
    '/portfolio/frontend/css/app.css',
    '/portfolio/frontend/css/themes.css',
    '/portfolio/frontend/css/social-share.css',
    '/portfolio/frontend/css/lazy-loading.css',
    '/portfolio/frontend/css/responsive-improvements.css',
    '/portfolio/frontend/js/config.js',
    '/portfolio/frontend/js/api-service.js',
    '/portfolio/frontend/js/utils.js',
    '/portfolio/frontend/js/app.js',
    '/portfolio/frontend/js/theme-manager.js',
    '/portfolio/frontend/js/social-share.js',
    '/portfolio/frontend/js/lazy-loading.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// 圖片緩存時間（7天）
const IMAGE_CACHE_TIME = 7 * 24 * 60 * 60 * 1000;

// API端點緩存策略
const API_CACHE_STRATEGIES = {
    'student/notifications.php': 'network-first',
    'student/activities.php': 'network-first',
    'student/badges.php': 'cache-first',
    'student/portfolio.php': 'network-first',
    'student/profile.php': 'cache-first'
};

// Service Worker安裝事件
self.addEventListener('install', event => {
    console.log('[SW] 安裝中... 版本:', CACHE_VERSION);
    
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then(cache => {
                console.log('[SW] 緩存靜態資源...');
                // 逐個添加，避免單個失敗導致全部失敗
                return Promise.allSettled(
                    STATIC_ASSETS.map(url => {
                        return cache.add(url).catch(err => {
                            console.warn('[SW] 緩存失敗:', url, err);
                        });
                    })
                );
            })
            .then(() => {
                console.log('[SW] 安裝完成');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('[SW] 安裝失敗:', error);
            })
    );
});

// Service Worker激活事件
self.addEventListener('activate', event => {
    console.log('[SW] 激活中... 版本:', CACHE_VERSION);
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                // 刪除所有舊版本的緩存
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (!cacheName.includes(CACHE_VERSION)) {
                            console.log('[SW] 刪除舊緩存:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[SW] 激活完成，接管所有頁面');
                return self.clients.claim();
            })
    );
});

// 攔截網路請求
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // 只處理 GET 請求
    if (request.method !== 'GET') {
        return;
    }
    
    // 處理跨域資源（如 CDN）
    if (url.origin !== location.origin) {
        // 緩存 CDN 資源（如 Font Awesome）
        if (url.href.includes('cdnjs.cloudflare.com') || url.href.includes('fonts.')) {
            event.respondWith(cacheFirstStrategy(request));
        }
        return;
    }
    
    // 處理圖片請求
    if (isImageRequest(request)) {
        event.respondWith(handleImageRequest(request));
        return;
    }
    
    // 處理API請求
    if (url.pathname.includes('/api/')) {
        event.respondWith(handleApiRequest(request));
        return;
    }
    
    // 處理靜態資源請求
    if (isStaticAsset(request.url)) {
        event.respondWith(handleStaticRequest(request));
        return;
    }
    
    // 處理HTML頁面請求
    if (request.destination === 'document') {
        event.respondWith(handlePageRequest(request));
        return;
    }
});

// 處理API請求
async function handleApiRequest(request) {
    const url = new URL(request.url);
    const endpoint = url.pathname.replace('/portfolio/api/', '');
    
    try {
        // 根據策略處理不同的API端點
        const strategy = API_CACHE_STRATEGIES[endpoint] || 'network-first';
        
        switch (strategy) {
            case 'cache-first':
                return await cacheFirstStrategy(request);
            case 'network-first':
                return await networkFirstStrategy(request);
            case 'cache-only':
                return await cacheOnlyStrategy(request);
            case 'network-only':
                return await networkOnlyStrategy(request);
            default:
                return await networkFirstStrategy(request);
        }
    } catch (error) {
        console.error('API請求處理失敗:', error);
        
        // 嘗試從緩存獲取
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // 返回離線頁面
        return new Response(
            JSON.stringify({
                status: 503,
                message: '服務暫時不可用，請檢查網路連接',
                offline: true
            }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// 緩存優先策略
async function cacheFirstStrategy(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
}

// 網路優先策略
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

// 僅緩存策略
async function cacheOnlyStrategy(request) {
    const cachedResponse = await caches.match(request);
    
    if (!cachedResponse) {
        throw new Error('緩存中沒有找到資源');
    }
    
    return cachedResponse;
}

// 僅網路策略
async function networkOnlyStrategy(request) {
    return await fetch(request);
}

// 處理靜態資源請求
async function handleStaticRequest(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('靜態資源請求失敗:', error);
        throw error;
    }
}

// 處理頁面請求
async function handlePageRequest(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // 返回離線頁面
        return new Response(
            `
            <!DOCTYPE html>
            <html>
            <head>
                <title>離線模式 - Portfolio+</title>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .offline-message { max-width: 500px; margin: 0 auto; }
                    .retry-btn { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; }
                </style>
            </head>
            <body>
                <div class="offline-message">
                    <h1>🔌 離線模式</h1>
                    <p>您目前處於離線狀態，部分功能可能無法使用。</p>
                    <p>請檢查您的網路連接後重試。</p>
                    <button class="retry-btn" onclick="window.location.reload()">重新載入</button>
                </div>
            </body>
            </html>
            `,
            {
                status: 200,
                headers: { 'Content-Type': 'text/html' }
            }
        );
    }
}

// 檢查是否為靜態資源
function isStaticAsset(url) {
    const staticExtensions = ['.css', '.js', '.woff', '.woff2', '.ttf', '.eot'];
    return staticExtensions.some(ext => url.includes(ext));
}

// 檢查是否為圖片請求
function isImageRequest(request) {
    return request.destination === 'image' || 
           /\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(request.url);
}

// 處理圖片請求（專用緩存策略）
async function handleImageRequest(request) {
    const cache = await caches.open(IMAGE_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    // 檢查緩存是否過期
    if (cachedResponse) {
        const cachedDate = new Date(cachedResponse.headers.get('date'));
        const now = new Date();
        
        // 如果緩存未過期，直接返回
        if (now - cachedDate < IMAGE_CACHE_TIME) {
            return cachedResponse;
        }
    }
    
    try {
        // 從網路獲取新圖片
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // 克隆回應並緩存
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // 網路錯誤，返回緩存（即使過期）
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // 返回預設圖片
        return getPlaceholderImage();
    }
}

// 獲取預設佔位圖片
function getPlaceholderImage() {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
            <rect width="300" height="200" fill="#f0f0f0"/>
            <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999" font-size="14">
                圖片無法載入
            </text>
        </svg>
    `;
    
    return new Response(svg, {
        headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'no-cache'
        }
    });
}

// 背景同步
self.addEventListener('sync', event => {
    console.log('背景同步觸發:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

// 執行背景同步
async function doBackgroundSync() {
    try {
        // 這裡可以實現離線時的操作同步
        console.log('執行背景同步...');
        
        // 例如：同步離線時的作品上傳
        // await syncOfflinePortfolios();
        
    } catch (error) {
        console.error('背景同步失敗:', error);
    }
}

// 推送通知
self.addEventListener('push', event => {
    console.log('收到推送通知:', event);
    
    const options = {
        body: '您有新的通知',
        icon: '/portfolio/images/logo.jpg',
        badge: '/portfolio/images/badge.png',
        tag: 'portfolio-notification',
        data: {
            url: '/portfolio/frontend/student/notifications.html'
        }
    };
    
    if (event.data) {
        const payload = event.data.json();
        options.body = payload.message || options.body;
        options.data = payload.data || options.data;
    }
    
    event.waitUntil(
        self.registration.showNotification('Portfolio+', options)
    );
});

// 通知點擊事件
self.addEventListener('notificationclick', event => {
    console.log('通知被點擊:', event);
    
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow(event.notification.data.url || '/portfolio/frontend/')
    );
});

// 監聽來自主線程的訊息
self.addEventListener('message', event => {
    console.log('Service Worker 收到訊息:', event.data);
    
    switch (event.data.type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
        case 'CLEAR_CACHE':
            clearAllCaches();
            break;
        case 'CACHE_URL':
            cacheUrl(event.data.url);
            break;
    }
});

// 清除所有緩存
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('所有緩存已清除');
}

// 緩存特定URL
async function cacheUrl(url) {
    try {
        const response = await fetch(url);
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            await cache.put(url, response);
            console.log('URL已緩存:', url);
        }
    } catch (error) {
        console.error('緩存URL失敗:', error);
    }
}

// 緩存管理工具
const CacheManager = {
    /**
     * 清理過期緩存
     */
    async cleanExpiredCache() {
        const imageCache = await caches.open(IMAGE_CACHE_NAME);
        const requests = await imageCache.keys();
        const now = new Date();
        
        for (const request of requests) {
            const response = await imageCache.match(request);
            if (response) {
                const cachedDate = new Date(response.headers.get('date'));
                if (now - cachedDate > IMAGE_CACHE_TIME) {
                    await imageCache.delete(request);
                    console.log('[SW] 清理過期圖片:', request.url);
                }
            }
        }
    },
    
    /**
     * 限制緩存大小
     */
    async limitCacheSize(cacheName, maxItems) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        if (keys.length > maxItems) {
            // 刪除最舊的項目
            const itemsToDelete = keys.length - maxItems;
            for (let i = 0; i < itemsToDelete; i++) {
                await cache.delete(keys[i]);
            }
            console.log(`[SW] 限制緩存大小，刪除了 ${itemsToDelete} 個項目`);
        }
    },
    
    /**
     * 預緩存重要頁面
     */
    async precacheImportantPages() {
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        const pages = [
            '/portfolio/frontend/student/dashboard.html',
            '/portfolio/frontend/enterprise/dashboard.html',
            '/portfolio/frontend/login.html'
        ];
        
        for (const page of pages) {
            try {
                const response = await fetch(page);
                if (response.ok) {
                    await cache.put(page, response);
                }
            } catch (err) {
                console.warn('[SW] 預緩存失敗:', page);
            }
        }
    }
};

// 定期清理過期緩存（每小時）
setInterval(() => {
    CacheManager.cleanExpiredCache();
    CacheManager.limitCacheSize(IMAGE_CACHE_NAME, 100);
    CacheManager.limitCacheSize(DYNAMIC_CACHE_NAME, 50);
}, 60 * 60 * 1000);

console.log('[SW] Service Worker 已載入，版本:', CACHE_VERSION);
