/**
 * Portfolio+ 社群分享功能
 * 支援 Facebook、Line、Twitter、Email 等分享
 */

const SocialShare = {
    /**
     * 初始化社群分享按鈕
     * @param {Object} options - 分享內容設定
     */
    init(options = {}) {
        const defaultOptions = {
            url: window.location.href,
            title: document.title,
            description: document.querySelector('meta[name="description"]')?.content || '',
            image: document.querySelector('meta[property="og:image"]')?.content || ''
        };
        
        this.options = { ...defaultOptions, ...options };
        this.renderShareButtons();
        this.bindEvents();
    },
    
    /**
     * 渲染分享按鈕
     */
    renderShareButtons() {
        const container = document.getElementById('social-share-buttons');
        if (!container) return;
        
        const buttons = `
            <div class="social-share-container">
                <button class="share-btn share-facebook" data-platform="facebook" title="分享到 Facebook">
                    <i class="fab fa-facebook-f"></i>
                    <span>Facebook</span>
                </button>
                <button class="share-btn share-line" data-platform="line" title="分享到 Line">
                    <i class="fab fa-line"></i>
                    <span>Line</span>
                </button>
                <button class="share-btn share-twitter" data-platform="twitter" title="分享到 Twitter">
                    <i class="fab fa-twitter"></i>
                    <span>Twitter</span>
                </button>
                <button class="share-btn share-linkedin" data-platform="linkedin" title="分享到 LinkedIn">
                    <i class="fab fa-linkedin-in"></i>
                    <span>LinkedIn</span>
                </button>
                <button class="share-btn share-email" data-platform="email" title="透過 Email 分享">
                    <i class="fas fa-envelope"></i>
                    <span>Email</span>
                </button>
                <button class="share-btn share-copy" data-platform="copy" title="複製連結">
                    <i class="fas fa-link"></i>
                    <span>複製連結</span>
                </button>
            </div>
        `;
        
        container.innerHTML = buttons;
    },
    
    /**
     * 綁定事件
     */
    bindEvents() {
        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const platform = btn.dataset.platform;
                this.share(platform);
            });
        });
    },
    
    /**
     * 分享到指定平台
     * @param {string} platform - 平台名稱
     */
    share(platform) {
        const { url, title, description, image } = this.options;
        const encodedUrl = encodeURIComponent(url);
        const encodedTitle = encodeURIComponent(title);
        const encodedDescription = encodeURIComponent(description);
        
        let shareUrl = '';
        
        switch (platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
                this.openPopup(shareUrl, 'Facebook');
                break;
                
            case 'line':
                shareUrl = `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`;
                this.openPopup(shareUrl, 'Line');
                break;
                
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
                this.openPopup(shareUrl, 'Twitter');
                break;
                
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
                this.openPopup(shareUrl, 'LinkedIn');
                break;
                
            case 'email':
                const emailSubject = encodeURIComponent(`分享：${title}`);
                const emailBody = encodeURIComponent(`${description}\n\n查看詳情：${url}`);
                window.location.href = `mailto:?subject=${emailSubject}&body=${emailBody}`;
                break;
                
            case 'copy':
                this.copyToClipboard(url);
                break;
                
            default:
                console.warn('不支援的分享平台:', platform);
        }
        
        // 記錄分享事件
        this.trackShare(platform);
    },
    
    /**
     * 開啟分享彈窗
     * @param {string} url - 分享 URL
     * @param {string} title - 視窗標題
     */
    openPopup(url, title) {
        const width = 600;
        const height = 500;
        const left = (screen.width - width) / 2;
        const top = (screen.height - height) / 2;
        const features = `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`;
        
        window.open(url, title, features);
    },
    
    /**
     * 複製連結到剪貼簿
     * @param {string} text - 要複製的文字
     */
    async copyToClipboard(text) {
        try {
            // 使用現代 Clipboard API
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                this.showToast('連結已複製到剪貼簿！');
            } else {
                // 降級方案：使用傳統方法
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                
                try {
                    document.execCommand('copy');
                    this.showToast('連結已複製到剪貼簿！');
                } catch (err) {
                    this.showToast('複製失敗，請手動複製', 'error');
                }
                
                document.body.removeChild(textarea);
            }
        } catch (err) {
            console.error('複製失敗:', err);
            this.showToast('複製失敗，請手動複製', 'error');
        }
    },
    
    /**
     * 顯示提示訊息
     * @param {string} message - 訊息內容
     * @param {string} type - 訊息類型 (success/error)
     */
    showToast(message, type = 'success') {
        // 檢查是否已經有 Toast 容器
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        // 建立 Toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        // 顯示動畫
        setTimeout(() => toast.classList.add('show'), 10);
        
        // 自動隱藏
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toastContainer.removeChild(toast);
                // 如果沒有其他 Toast，移除容器
                if (toastContainer.children.length === 0) {
                    document.body.removeChild(toastContainer);
                }
            }, 300);
        }, 3000);
    },
    
    /**
     * 記錄分享事件（for analytics）
     * @param {string} platform - 平台名稱
     */
    trackShare(platform) {
        // 可以整合 Google Analytics 或其他分析工具
        console.log(`分享到 ${platform}:`, this.options.url);
        
        // 如果有啟用 Google Analytics
        if (typeof gtag === 'function') {
            gtag('event', 'share', {
                'event_category': 'social',
                'event_label': platform,
                'value': this.options.url
            });
        }
    },
    
    /**
     * 更新分享內容
     * @param {Object} newOptions - 新的分享設定
     */
    update(newOptions) {
        this.options = { ...this.options, ...newOptions };
    }
};

// 為作品詳情頁產生分享按鈕 HTML
function generatePortfolioShareButtons(portfolioData) {
    const shareUrl = `${window.location.origin}/portfolio/frontend/student/portfolio-detail.html?id=${portfolioData.id}`;
    const shareTitle = `${portfolioData.title} - Portfolio+`;
    const shareDescription = portfolioData.description || '查看我在 Portfolio+ 上的作品';
    const shareImage = portfolioData.cover_image ? 
        `${window.location.origin}/portfolio/${portfolioData.cover_image}` : '';
    
    // 初始化社群分享
    SocialShare.init({
        url: shareUrl,
        title: shareTitle,
        description: shareDescription,
        image: shareImage
    });
}

// 匯出供其他模組使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SocialShare;
}

