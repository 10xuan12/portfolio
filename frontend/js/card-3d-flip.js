/**
 * 作品 3D 卡片翻轉效果
 * 支援懸停翻轉和點擊翻轉（手機版）
 */

class Card3DFlip {
    constructor() {
        this.isMobile = this.checkMobile();
        this.init();
    }

    /**
     * 初始化
     */
    init() {
        // 監聽 DOM 變化，為新卡片添加翻轉效果
        this.observeCards();
        
        // 為現有卡片添加翻轉效果
        this.applyToExistingCards();
        
        // 手機版點擊翻轉
        if (this.isMobile) {
            this.enableMobileFlip();
        }
    }

    /**
     * 檢查是否為手機
     */
    checkMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * 將普通卡片轉換為 3D 翻轉卡片
     */
    convertToFlipCard(card, portfolioData) {
        // 檢查是否已經是翻轉卡片
        if (card.classList.contains('portfolio-card-flip')) {
            return;
        }
        
        // 檢查卡片是否在作品管理頁面（不轉換）
        if (window.location.pathname.includes('portfolio.html') && !window.location.pathname.includes('portfolios.html')) {
            return;
        }
        
        // 保存原始內容
        const originalContent = card.innerHTML;
        
        // 創建翻轉結構
        card.innerHTML = '';
        card.classList.add('portfolio-card-flip');
        
        const flipInner = document.createElement('div');
        flipInner.className = 'portfolio-card-flip-inner';
        
        // 正面
        const front = document.createElement('div');
        front.className = 'portfolio-card-front';
        front.innerHTML = originalContent;
        
        // 添加翻轉提示
        const hint = document.createElement('div');
        hint.className = 'flip-hint';
        hint.textContent = '懸停查看詳情';
        front.appendChild(hint);
        
        // 背面
        const back = document.createElement('div');
        back.className = 'portfolio-card-back';
        back.innerHTML = this.createBackSide(portfolioData);
        
        flipInner.appendChild(front);
        flipInner.appendChild(back);
        card.appendChild(flipInner);
        
        // 添加點擊事件（查看詳情）
        const viewBtn = back.querySelector('.portfolio-card-back-btn');
        if (viewBtn && portfolioData.id) {
            viewBtn.onclick = (e) => {
                e.stopPropagation();
                this.viewPortfolio(portfolioData.id);
            };
        }
    }

    /**
     * 創建卡片背面內容
     */
    createBackSide(data) {
        const skills = data.skills || data.tags || ['JavaScript', 'React', 'CSS'];
        const description = data.description || '這是一個精彩的作品展示';
        
        return `
            <div class="portfolio-card-back-header">
                <div class="portfolio-card-back-icon">✨</div>
                <h3 class="portfolio-card-white-title">${data.title || '作品標題'}</h3>
            </div>
            
            <div class="portfolio-card-back-body">
                <p class="portfolio-card-white-description">
                    ${this.truncate(description, 100)}
                </p>
                
                <div class="portfolio-card-white-skills">
                    <p class="portfolio-card-back-skills-title">使用技能</p>
                    <div class="portfolio-card-back-skills-list">
                        ${this.renderSkills(skills)}
                    </div>
                </div>
            </div>

        `;
    }

    /**
     * 渲染技能標籤
     */
    renderSkills(skills) {
        if (typeof skills === 'string') {
            skills = skills.split(',').map(s => s.trim());
        }
        
        if (!Array.isArray(skills)) {
            skills = ['HTML', 'CSS', 'JavaScript'];
        }
        
        return skills.slice(0, 5).map(skill => 
            `<span class="skill-tag-small">${skill}</span>`
        ).join('');
    }

    /**
     * 截斷文字
     */
    truncate(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    /**
     * 格式化數字
     */
    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }


    /**
     * 為現有卡片添加翻轉效果
     */
    applyToExistingCards() {
        // 只在首頁、企業端作品瀏覽頁面啟用 3D 翻轉
        const allowedPages = ['index.html', 'portfolios.html', 'dashboard.html', 'search.html'];
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        if (!allowedPages.includes(currentPage)) {
            console.log('當前頁面不啟用 3D 翻轉:', currentPage);
            return;
        }
        
        const cards = document.querySelectorAll('.portfolio-card:not(.portfolio-card-flip)');
        cards.forEach(card => {
            const data = this.extractCardData(card);
            if (data) {
                this.convertToFlipCard(card, data);
            }
        });
    }

    /**
     * 從卡片元素提取數據
     */
    extractCardData(card) {
        return {
            id: card.getAttribute('data-id') || card.getAttribute('data-portfolio-id'),
            title: card.querySelector('h3, .card-title, .portfolio-card-title')?.textContent || '作品標題',
            description: card.querySelector('p, .card-description')?.textContent || '',
            views: parseInt(card.getAttribute('data-views')) || 0,
            likes: parseInt(card.getAttribute('data-likes')) || 0,
            comments: parseInt(card.getAttribute('data-comments')) || 0,
            skills: card.getAttribute('data-skills') || '',
            tags: card.getAttribute('data-tags') || ''
        };
    }

    /**
     * 監聽新卡片添加
     */
    observeCards() {
        // 只在特定頁面啟用監聽
        const allowedPages = ['index.html', 'portfolios.html', 'dashboard.html', 'search.html'];
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        if (!allowedPages.includes(currentPage)) {
            return;
        }
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        if (node.classList && node.classList.contains('portfolio-card') && !node.classList.contains('portfolio-card-flip')) {
                            const data = this.extractCardData(node);
                            if (data) {
                                this.convertToFlipCard(node, data);
                            }
                        }
                        
                        // 檢查子元素
                        const cards = node.querySelectorAll && node.querySelectorAll('.portfolio-card:not(.portfolio-card-flip)');
                        if (cards) {
                            cards.forEach(card => {
                                const data = this.extractCardData(card);
                                if (data) {
                                    this.convertToFlipCard(card, data);
                                }
                            });
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * 啟用手機版點擊翻轉
     */
    enableMobileFlip() {
        document.addEventListener('click', (e) => {
            const flipCard = e.target.closest('.portfolio-card-flip');
            if (flipCard) {
                flipCard.classList.toggle('active');
            }
        });
    }
}

// 創建全局實例
window.card3DFlip = new Card3DFlip();

// 全局方法
window.enableCard3DFlip = function(cardElement, portfolioData) {
    window.card3DFlip.convertToFlipCard(cardElement, portfolioData);
};

