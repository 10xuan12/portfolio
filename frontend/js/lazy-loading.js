/**
 * Portfolio+ 圖片延遲載入功能
 * 使用 Intersection Observer API 優化圖片載入效能
 */

const LazyLoading = {
    // Intersection Observer 實例
    observer: null,
    
    // 設定選項
    options: {
        root: null, // 使用 viewport 作為根元素
        rootMargin: '50px', // 提前 50px 開始載入
        threshold: 0.01 // 當元素 1% 可見時觸發
    },
    
    /**
     * 初始化延遲載入
     */
    init() {
        // 檢查瀏覽器是否支援 Intersection Observer
        if ('IntersectionObserver' in window) {
            this.setupObserver();
            this.observeImages();
            this.observeBackgrounds();
            this.observeIframes();
        } else {
            // 降級方案：直接載入所有圖片
            console.warn('瀏覽器不支援 Intersection Observer，使用降級方案');
            this.fallbackLoad();
        }
    },
    
    /**
     * 設定 Observer
     */
    setupObserver() {
        this.observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadElement(entry.target);
                    observer.unobserve(entry.target); // 載入後停止觀察
                }
            });
        }, this.options);
    },
    
    /**
     * 觀察圖片元素
     */
    observeImages() {
        const images = document.querySelectorAll('img[data-src], img[data-srcset]');
        images.forEach(img => {
            // 添加佔位符
            this.addPlaceholder(img);
            // 開始觀察
            this.observer.observe(img);
        });
    },
    
    /**
     * 觀察背景圖片
     */
    observeBackgrounds() {
        const elements = document.querySelectorAll('[data-bg], [data-bg-set]');
        elements.forEach(el => {
            this.observer.observe(el);
        });
    },
    
    /**
     * 觀察 iframe (影片等)
     */
    observeIframes() {
        const iframes = document.querySelectorAll('iframe[data-src]');
        iframes.forEach(iframe => {
            this.observer.observe(iframe);
        });
    },
    
    /**
     * 載入元素
     * @param {HTMLElement} element - 要載入的元素
     */
    loadElement(element) {
        if (element.tagName === 'IMG') {
            this.loadImage(element);
        } else if (element.tagName === 'IFRAME') {
            this.loadIframe(element);
        } else if (element.dataset.bg || element.dataset.bgSet) {
            this.loadBackground(element);
        }
    },
    
    /**
     * 載入圖片
     * @param {HTMLImageElement} img - 圖片元素
     */
    loadImage(img) {
        const src = img.dataset.src;
        const srcset = img.dataset.srcset;
        
        // 建立新圖片預載
        const tempImg = new Image();
        
        tempImg.onload = () => {
            // 載入成功後替換
            if (src) img.src = src;
            if (srcset) img.srcset = srcset;
            
            // 添加載入完成 class
            img.classList.add('lazy-loaded');
            img.classList.remove('lazy-loading');
            
            // 移除 data 屬性
            delete img.dataset.src;
            delete img.dataset.srcset;
            
            // 觸發自訂事件
            img.dispatchEvent(new CustomEvent('lazyloaded'));
        };
        
        tempImg.onerror = () => {
            // 載入失敗處理
            img.classList.add('lazy-error');
            img.classList.remove('lazy-loading');
            console.error('圖片載入失敗:', src || srcset);
        };
        
        // 開始載入
        img.classList.add('lazy-loading');
        if (srcset) {
            tempImg.srcset = srcset;
        } else if (src) {
            tempImg.src = src;
        }
    },
    
    /**
     * 載入背景圖片
     * @param {HTMLElement} element - 元素
     */
    loadBackground(element) {
        const bg = element.dataset.bg;
        const bgSet = element.dataset.bgSet;
        
        if (bg) {
            element.style.backgroundImage = `url('${bg}')`;
            element.classList.add('lazy-loaded');
            delete element.dataset.bg;
        }
        
        if (bgSet) {
            // 處理 image-set (支援不同解析度)
            element.style.backgroundImage = bgSet;
            element.classList.add('lazy-loaded');
            delete element.dataset.bgSet;
        }
    },
    
    /**
     * 載入 iframe
     * @param {HTMLIFrameElement} iframe - iframe 元素
     */
    loadIframe(iframe) {
        const src = iframe.dataset.src;
        if (src) {
            iframe.src = src;
            iframe.classList.add('lazy-loaded');
            delete iframe.dataset.src;
        }
    },
    
    /**
     * 添加佔位符
     * @param {HTMLImageElement} img - 圖片元素
     */
    addPlaceholder(img) {
        // 如果已經有 src，就不需要佔位符
        if (img.src && img.src !== window.location.href) return;
        
        // 使用低質量圖片佔位符（如果有提供）
        const placeholder = img.dataset.placeholder;
        if (placeholder) {
            img.src = placeholder;
            return;
        }
        
        // 使用 data URI 作為佔位符（灰色）
        const width = img.dataset.width || 300;
        const height = img.dataset.height || 200;
        
        // 建立 SVG 佔位符
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
                <rect width="100%" height="100%" fill="#f0f0f0"/>
                <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999" font-size="14">
                    載入中...
                </text>
            </svg>
        `;
        
        img.src = `data:image/svg+xml;base64,${btoa(svg)}`;
    },
    
    /**
     * 降級方案：直接載入所有圖片
     */
    fallbackLoad() {
        // 載入所有圖片
        document.querySelectorAll('img[data-src]').forEach(img => {
            img.src = img.dataset.src;
            delete img.dataset.src;
        });
        
        document.querySelectorAll('img[data-srcset]').forEach(img => {
            img.srcset = img.dataset.srcset;
            delete img.dataset.srcset;
        });
        
        // 載入所有背景圖片
        document.querySelectorAll('[data-bg]').forEach(el => {
            el.style.backgroundImage = `url('${el.dataset.bg}')`;
            delete el.dataset.bg;
        });
        
        // 載入所有 iframe
        document.querySelectorAll('iframe[data-src]').forEach(iframe => {
            iframe.src = iframe.dataset.src;
            delete iframe.dataset.src;
        });
    },
    
    /**
     * 手動觸發載入（用於動態新增的元素）
     * @param {HTMLElement} element - 要載入的元素
     */
    load(element) {
        if (this.observer) {
            this.observer.observe(element);
        } else {
            this.loadElement(element);
        }
    },
    
    /**
     * 重新掃描頁面並觀察新元素
     */
    refresh() {
        if (this.observer) {
            this.observeImages();
            this.observeBackgrounds();
            this.observeIframes();
        }
    },
    
    /**
     * 銷毀 observer
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }
};

/**
 * 使用範例：
 * 
 * HTML:
 * <img data-src="actual-image.jpg" 
 *      data-placeholder="placeholder.jpg"
 *      alt="描述">
 * 
 * <div data-bg="background-image.jpg"></div>
 * 
 * <iframe data-src="https://www.youtube.com/embed/..."></iframe>
 * 
 * JavaScript:
 * LazyLoading.init();
 * 
 * // 動態新增元素後
 * LazyLoading.refresh();
 */

// 頁面載入時自動初始化
document.addEventListener('DOMContentLoaded', () => {
    LazyLoading.init();
});

// 匯出供其他模組使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LazyLoading;
}

