/**
 * 作品熱門度標籤系統
 * 自動根據數據標記作品的熱門程度
 */

class PopularityTagSystem {
    constructor() {
        this.thresholds = {
            hot: { views: 1000, likes: 50, comments: 20 },
            trending: { viewsGrowth: 0.5, likesGrowth: 0.3 }, // 50% 增長率
            new: { daysOld: 7 },
            featured: { score: 80 }, // 綜合評分
            recommended: { score: 60 }
        };
    }

    /**
     * 為作品生成標籤
     * @param {Object} portfolio - 作品數據
     * @returns {Array} 標籤陣列
     */
    generateTags(portfolio) {
        const tags = [];
        
        // 檢查是否為新作
        if (this.isNew(portfolio.createdAt)) {
            tags.push({
                type: 'new',
                label: '新作',
                icon: '✨',
                tooltip: '最近 7 天內上傳'
            });
        }
        
        // 檢查是否熱門
        if (this.isHot(portfolio)) {
            const heat = this.calculateHeat(portfolio);
            tags.push({
                type: 'hot',
                label: '熱門',
                icon: '🔥',
                tooltip: `瀏覽 ${portfolio.views || 0} 次`,
                heat: heat
            });
        }
        
        // 檢查是否趨勢
        if (this.isTrending(portfolio)) {
            tags.push({
                type: 'trending',
                label: '趨勢',
                icon: '📈',
                tooltip: '瀏覽量快速增長中'
            });
        }
        
        // 檢查是否精選
        if (this.isFeatured(portfolio)) {
            tags.push({
                type: 'featured',
                label: '精選',
                icon: '⭐',
                tooltip: '編輯精選作品'
            });
        }
        
        // 檢查是否推薦
        if (this.isRecommended(portfolio) && !this.isFeatured(portfolio)) {
            tags.push({
                type: 'recommended',
                label: '推薦',
                icon: '👍',
                tooltip: '高質量作品'
            });
        }
        
        return tags;
    }

    /**
     * 渲染標籤到 DOM 元素
     * @param {HTMLElement} container - 容器元素
     * @param {Array} tags - 標籤陣列
     */
    renderTags(container, tags) {
        if (!container || !tags || tags.length === 0) return;
        
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'popularity-tags';
        
        tags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = `popularity-tag ${tag.type}`;
            if (tag.tooltip) {
                tagElement.setAttribute('data-tooltip', tag.tooltip);
            }
            
            tagElement.innerHTML = `
                <span class="popularity-tag-icon">${tag.icon}</span>
                <span class="popularity-tag-label">${tag.label}</span>
                ${tag.heat ? this.renderHeatIndicator(tag.heat) : ''}
            `;
            
            tagsContainer.appendChild(tagElement);
        });
        
        container.appendChild(tagsContainer);
    }

    /**
     * 渲染熱度指示器
     * @param {Number} heat - 熱度值 (1-5)
     */
    renderHeatIndicator(heat) {
        const bars = Math.min(Math.max(heat, 1), 5);
        let barsHTML = '';
        for (let i = 0; i < 5; i++) {
            barsHTML += `<span class="${i < bars ? 'active' : ''}"></span>`;
        }
        return `<span class="heat-indicator"><span class="heat-bar">${barsHTML}</span></span>`;
    }

    /**
     * 判斷是否為新作品
     */
    isNew(createdAt) {
        if (!createdAt) return false;
        const created = new Date(createdAt);
        const now = new Date();
        const daysOld = (now - created) / (1000 * 60 * 60 * 24);
        return daysOld <= this.thresholds.new.daysOld;
    }

    /**
     * 判斷是否為熱門作品
     */
    isHot(portfolio) {
        return (
            (portfolio.views || 0) >= this.thresholds.hot.views ||
            (portfolio.likes || 0) >= this.thresholds.hot.likes ||
            (portfolio.comments || 0) >= this.thresholds.hot.comments
        );
    }

    /**
     * 計算熱度級別 (1-5)
     */
    calculateHeat(portfolio) {
        const views = portfolio.views || 0;
        const likes = portfolio.likes || 0;
        const comments = portfolio.comments || 0;
        
        let heat = 1;
        
        if (views >= 5000 || likes >= 200 || comments >= 100) heat = 5;
        else if (views >= 3000 || likes >= 100 || comments >= 50) heat = 4;
        else if (views >= 2000 || likes >= 70 || comments >= 30) heat = 3;
        else if (views >= 1000 || likes >= 50 || comments >= 20) heat = 2;
        
        return heat;
    }

    /**
     * 判斷是否為趨勢作品
     */
    isTrending(portfolio) {
        // 如果有增長數據
        if (portfolio.viewsGrowth !== undefined) {
            return portfolio.viewsGrowth >= this.thresholds.trending.viewsGrowth;
        }
        
        // 簡化版：最近 7 天內且瀏覽量高
        if (this.isNew(portfolio.createdAt)) {
            return (portfolio.views || 0) >= 500;
        }
        
        return false;
    }

    /**
     * 判斷是否為精選作品
     */
    isFeatured(portfolio) {
        // 檢查是否有管理員標記為精選
        if (portfolio.isFeatured) return true;
        
        // 或者綜合評分很高
        const score = this.calculateScore(portfolio);
        return score >= this.thresholds.featured.score;
    }

    /**
     * 判斷是否為推薦作品
     */
    isRecommended(portfolio) {
        const score = this.calculateScore(portfolio);
        return score >= this.thresholds.recommended.score;
    }

    /**
     * 計算作品綜合評分 (0-100)
     */
    calculateScore(portfolio) {
        const views = portfolio.views || 0;
        const likes = portfolio.likes || 0;
        const comments = portfolio.comments || 0;
        const shares = portfolio.shares || 0;
        
        // 簡化的評分算法
        let score = 0;
        score += Math.min((views / 100), 30); // 瀏覽量最高 30 分
        score += Math.min((likes / 10), 25);  // 讚數最高 25 分
        score += Math.min((comments / 5), 25); // 評論數最高 25 分
        score += Math.min((shares / 2), 20);   // 分享數最高 20 分
        
        return Math.min(Math.round(score), 100);
    }

    /**
     * 批量為作品元素添加標籤
     * @param {String} selector - 作品卡片選擇器
     * @param {Array} portfolios - 作品數據陣列
     */
    applyTagsToElements(selector, portfolios) {
        const elements = document.querySelectorAll(selector);
        
        elements.forEach((element, index) => {
            const portfolio = portfolios[index];
            if (!portfolio) return;
            
            const tags = this.generateTags(portfolio);
            if (tags.length > 0) {
                this.renderTags(element, tags);
            }
        });
    }

    /**
     * 為單個作品元素添加標籤
     */
    applyTagsToElement(element, portfolio) {
        const tags = this.generateTags(portfolio);
        if (tags.length > 0) {
            this.renderTags(element, tags);
        }
    }

    /**
     * 更新標籤閾值設定
     */
    updateThresholds(newThresholds) {
        this.thresholds = { ...this.thresholds, ...newThresholds };
    }
}

// 創建全局實例
window.popularityTagSystem = new PopularityTagSystem();

// 便捷方法
window.addPopularityTags = function(element, portfolio) {
    window.popularityTagSystem.applyTagsToElement(element, portfolio);
};

window.generatePopularityTags = function(portfolio) {
    return window.popularityTagSystem.generateTags(portfolio);
};

// 示例使用方法
document.addEventListener('DOMContentLoaded', function() {
    // 示例：為現有作品卡片添加標籤
    // const samplePortfolio = {
    //     id: 1,
    //     createdAt: '2025-10-10',
    //     views: 1500,
    //     likes: 80,
    //     comments: 25,
    //     shares: 10,
    //     isFeatured: false
    // };
    // 
    // const portfolioCard = document.querySelector('.portfolio-card');
    // if (portfolioCard) {
    //     addPopularityTags(portfolioCard, samplePortfolio);
    // }
});

// 匯出供其他模組使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PopularityTagSystem;
}

