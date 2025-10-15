/**
 * 每日精選作品推薦系統
 * 自動挑選並輪播展示高質量作品
 */

class FeaturedDailySystem {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            autoPlay: true,
            autoPlayInterval: 5000,
            showIndicators: true,
            showNavigation: true,
            showProgress: true,
            maxFeatured: 5,
            onSlideChange: null,
            onPortfolioClick: null,
            ...options
        };
        
        this.portfolios = [];
        this.currentIndex = 0;
        this.autoPlayTimer = null;
        this.progressTimer = null;
        this.progressValue = 0;
        
        if (this.container) {
            this.init();
        }
    }

    /**
     * 初始化系統
     */
    init() {
        this.container.className = 'featured-daily-container';
    }

    /**
     * 設定作品數據
     * @param {Array} portfolios - 作品陣列
     */
    setPortfolios(portfolios) {
        this.portfolios = this.selectFeaturedPortfolios(portfolios);
        this.currentIndex = 0;
        this.render();
        
        if (this.options.autoPlay && this.portfolios.length > 1) {
            this.startAutoPlay();
        }
    }

    /**
     * 從作品列表中智能挑選精選作品
     */
    selectFeaturedPortfolios(portfolios) {
        if (!portfolios || portfolios.length === 0) return [];
        
        // 計算每個作品的評分
        const scored = portfolios.map(portfolio => ({
            ...portfolio,
            score: this.calculateScore(portfolio)
        }));
        
        // 按評分排序並取前 N 個
        return scored
            .sort((a, b) => b.score - a.score)
            .slice(0, this.options.maxFeatured);
    }

    /**
     * 計算作品評分
     */
    calculateScore(portfolio) {
        let score = 0;
        
        // 瀏覽量 (最高 30 分)
        score += Math.min((portfolio.views || 0) / 50, 30);
        
        // 讚數 (最高 25 分)
        score += Math.min((portfolio.likes || 0) / 5, 25);
        
        // 評論數 (最高 20 分)
        score += Math.min((portfolio.comments || 0) / 3, 20);
        
        // 分享數 (最高 15 分)
        score += Math.min((portfolio.shares || 0) * 5, 15);
        
        // 新鮮度 (最高 10 分)
        if (portfolio.createdAt) {
            const daysOld = this.getDaysOld(portfolio.createdAt);
            if (daysOld <= 7) score += 10;
            else if (daysOld <= 30) score += 5;
        }
        
        // 管理員標記為精選 (額外 50 分)
        if (portfolio.isFeatured) score += 50;
        
        return score;
    }

    /**
     * 計算作品發布天數
     */
    getDaysOld(createdAt) {
        const created = new Date(createdAt);
        const now = new Date();
        return Math.floor((now - created) / (1000 * 60 * 60 * 24));
    }

    /**
     * 渲染界面
     */
    render() {
        if (!this.container) return;
        
        this.container.innerHTML = '';
        
        // 渲染標題
        this.renderHeader();
        
        if (this.portfolios.length === 0) {
            this.renderEmpty();
            return;
        }
        
        // 渲染輪播
        this.renderCarousel();
    }

    /**
     * 渲染標題
     */
    renderHeader() {
        const header = document.createElement('div');
        header.className = 'featured-daily-header';
        
        const today = new Date();
        const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
        
        header.innerHTML = `
            <h2 class="featured-daily-title">
                <span class="featured-daily-title-icon">⭐</span>
                今日精選
            </h2>
            <div class="featured-daily-date">📅 ${dateStr}</div>
        `;
        
        this.container.appendChild(header);
    }

    /**
     * 渲染輪播
     */
    renderCarousel() {
        const carousel = document.createElement('div');
        carousel.className = 'featured-carousel';
        
        // 創建包裝器
        const wrapper = document.createElement('div');
        wrapper.className = 'featured-carousel-wrapper';
        
        // 添加作品卡片
        this.portfolios.forEach((portfolio, index) => {
            const card = this.createCard(portfolio, index);
            wrapper.appendChild(card);
        });
        
        carousel.appendChild(wrapper);
        
        // 添加導航按鈕
        if (this.options.showNavigation && this.portfolios.length > 1) {
            carousel.appendChild(this.createNavButton('prev'));
            carousel.appendChild(this.createNavButton('next'));
        }
        
        // 添加進度條
        if (this.options.showProgress && this.options.autoPlay) {
            const progress = document.createElement('div');
            progress.className = 'featured-progress';
            progress.innerHTML = '<div class="featured-progress-bar"></div>';
            carousel.appendChild(progress);
        }
        
        this.container.appendChild(carousel);
        
        // 添加指示器
        if (this.options.showIndicators && this.portfolios.length > 1) {
            this.renderIndicators();
        }
    }

    /**
     * 創建作品卡片
     */
    createCard(portfolio, index) {
        const card = document.createElement('div');
        card.className = 'featured-card';
        card.setAttribute('data-index', index);
        
        const imageUrl = portfolio.imageUrl || portfolio.thumbnailUrl || 'https://via.placeholder.com/800x600?text=作品圖片';
        const authorAvatar = portfolio.authorAvatar || 'https://via.placeholder.com/50?text=頭像';
        
        card.innerHTML = `
            <div class="featured-card-image">
                <img src="${imageUrl}" alt="${portfolio.title}" loading="lazy">
                <div class="featured-badge">
                    <span>⭐</span>
                    <span>今日精選</span>
                </div>
                <div class="featured-card-overlay"></div>
            </div>
            <div class="featured-card-content">
                <div class="featured-card-category">${portfolio.category || '作品展示'}</div>
                <h3 class="featured-card-title">${portfolio.title}</h3>
                <p class="featured-card-description">${this.truncateText(portfolio.description || '優秀作品展示', 120)}</p>
                
                <div class="featured-card-author">
                    <img src="${authorAvatar}" alt="${portfolio.authorName}" class="featured-author-avatar">
                    <div class="featured-author-info">
                        <p class="featured-author-name">${portfolio.authorName || '創作者'}</p>
                        <p class="featured-author-bio">${portfolio.authorBio || portfolio.department || '資訊管理系'}</p>
                    </div>
                </div>
                
                <div class="featured-card-stats">
                    <div class="featured-stat">
                        <span class="featured-stat-icon">👁️</span>
                        <span class="featured-stat-value">${this.formatNumber(portfolio.views || 0)}</span>
                    </div>
                    <div class="featured-stat">
                        <span class="featured-stat-icon">❤️</span>
                        <span class="featured-stat-value">${this.formatNumber(portfolio.likes || 0)}</span>
                    </div>
                    <div class="featured-stat">
                        <span class="featured-stat-icon">💬</span>
                        <span class="featured-stat-value">${this.formatNumber(portfolio.comments || 0)}</span>
                    </div>
                </div>
                
                <button class="featured-card-button" data-portfolio-id="${portfolio.id}">
                    查看作品
                    <span>→</span>
                </button>
            </div>
        `;
        
        // 添加點擊事件
        const button = card.querySelector('.featured-card-button');
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handlePortfolioClick(portfolio);
        });
        
        card.addEventListener('click', () => {
            this.handlePortfolioClick(portfolio);
        });
        
        return card;
    }

    /**
     * 創建導航按鈕
     */
    createNavButton(direction) {
        const nav = document.createElement('div');
        nav.className = `featured-nav ${direction}`;
        
        const btn = document.createElement('button');
        btn.className = 'featured-nav-btn';
        btn.innerHTML = direction === 'prev' ? '‹' : '›';
        btn.addEventListener('click', () => {
            direction === 'prev' ? this.prev() : this.next();
        });
        
        nav.appendChild(btn);
        return nav;
    }

    /**
     * 渲染指示器
     */
    renderIndicators() {
        const indicators = document.createElement('div');
        indicators.className = 'featured-indicators';
        
        this.portfolios.forEach((_, index) => {
            const indicator = document.createElement('button');
            indicator.className = `featured-indicator ${index === this.currentIndex ? 'active' : ''}`;
            indicator.addEventListener('click', () => this.goToSlide(index));
            indicators.appendChild(indicator);
        });
        
        this.container.appendChild(indicators);
    }

    /**
     * 渲染空狀態
     */
    renderEmpty() {
        const empty = document.createElement('div');
        empty.className = 'featured-empty';
        empty.innerHTML = `
            <div class="featured-empty-icon">📦</div>
            <div class="featured-empty-text">暫無精選作品</div>
        `;
        this.container.appendChild(empty);
    }

    /**
     * 切換到指定幻燈片
     */
    goToSlide(index) {
        this.currentIndex = index;
        this.updateSlide();
        this.resetAutoPlay();
    }

    /**
     * 下一張
     */
    next() {
        this.currentIndex = (this.currentIndex + 1) % this.portfolios.length;
        this.updateSlide();
        this.resetAutoPlay();
    }

    /**
     * 上一張
     */
    prev() {
        this.currentIndex = (this.currentIndex - 1 + this.portfolios.length) % this.portfolios.length;
        this.updateSlide();
        this.resetAutoPlay();
    }

    /**
     * 更新幻燈片顯示
     */
    updateSlide() {
        const wrapper = this.container.querySelector('.featured-carousel-wrapper');
        if (wrapper) {
            wrapper.style.transform = `translateX(-${this.currentIndex * 100}%)`;
        }
        
        // 更新指示器
        const indicators = this.container.querySelectorAll('.featured-indicator');
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.currentIndex);
        });
        
        // 回調
        if (this.options.onSlideChange) {
            this.options.onSlideChange(this.currentIndex, this.portfolios[this.currentIndex]);
        }
    }

    /**
     * 開始自動播放
     */
    startAutoPlay() {
        if (this.autoPlayTimer) return;
        
        this.autoPlayTimer = setInterval(() => {
            this.next();
        }, this.options.autoPlayInterval);
        
        if (this.options.showProgress) {
            this.startProgress();
        }
    }

    /**
     * 停止自動播放
     */
    stopAutoPlay() {
        if (this.autoPlayTimer) {
            clearInterval(this.autoPlayTimer);
            this.autoPlayTimer = null;
        }
        this.stopProgress();
    }

    /**
     * 重置自動播放
     */
    resetAutoPlay() {
        this.stopAutoPlay();
        if (this.options.autoPlay && this.portfolios.length > 1) {
            this.startAutoPlay();
        }
    }

    /**
     * 開始進度條
     */
    startProgress() {
        this.progressValue = 0;
        this.updateProgress();
        
        this.progressTimer = setInterval(() => {
            this.progressValue += 100 / (this.options.autoPlayInterval / 100);
            this.updateProgress();
            
            if (this.progressValue >= 100) {
                this.progressValue = 0;
            }
        }, 100);
    }

    /**
     * 停止進度條
     */
    stopProgress() {
        if (this.progressTimer) {
            clearInterval(this.progressTimer);
            this.progressTimer = null;
        }
        this.progressValue = 0;
        this.updateProgress();
    }

    /**
     * 更新進度條
     */
    updateProgress() {
        const progressBar = this.container.querySelector('.featured-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${this.progressValue}%`;
        }
    }

    /**
     * 處理作品點擊
     */
    handlePortfolioClick(portfolio) {
        if (this.options.onPortfolioClick) {
            this.options.onPortfolioClick(portfolio);
        } else {
            // 默認行為：跳轉到作品詳情頁
            window.location.href = `portfolio-detail.html?id=${portfolio.id}`;
        }
    }

    /**
     * 截斷文字
     */
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    /**
     * 格式化數字
     */
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    /**
     * 銷毀實例
     */
    destroy() {
        this.stopAutoPlay();
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// 全局快捷方法
window.createFeaturedDaily = function(containerId, portfolios, options = {}) {
    const featured = new FeaturedDailySystem(containerId, options);
    featured.setPortfolios(portfolios);
    return featured;
};

// 匯出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FeaturedDailySystem;
}

