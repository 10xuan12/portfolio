/**
 * 作品分享卡片生成器
 * 使用 html2canvas 生成分享圖片
 */

class ShareCardGenerator {
    constructor() {
        this.currentTemplate = 1;
        this.portfolioData = null;
        this.init();
    }

    /**
     * 初始化
     */
    init() {
        this.loadLibraries();
        this.createModal();
    }

    /**
     * 載入必要的庫
     */
    loadLibraries() {
        // 載入 html2canvas
        if (typeof html2canvas === 'undefined') {
            const script1 = document.createElement('script');
            script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            document.head.appendChild(script1);
        }
        
        // 載入 QRCode.js
        if (typeof QRCode === 'undefined') {
            const script2 = document.createElement('script');
            script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
            document.head.appendChild(script2);
        }
    }

    /**
     * 創建模態框
     */
    createModal() {
        const modal = document.createElement('div');
        modal.className = 'share-card-modal';
        modal.id = 'shareCardModal';
        
        modal.innerHTML = `
            <div class="share-card-modal-content">
                <div class="share-card-modal-header">
                    <h2>📤 生成分享卡片</h2>
                    <button class="share-card-modal-close" onclick="shareCardGenerator.closeModal()">×</button>
                </div>
                
                <div class="share-card-modal-body">
                    <h3>選擇模板</h3>
                    <div class="share-card-templates">
                        <div class="share-card-template active" onclick="shareCardGenerator.selectTemplate(1)">
                            <div class="share-card-template-preview" style="background: linear-gradient(135deg, #273ec3 0%, #00AEEF 100%);">
                                ✨
                            </div>
                            <div class="share-card-template-name">現代簡約</div>
                        </div>
                        <div class="share-card-template" onclick="shareCardGenerator.selectTemplate(2)">
                            <div class="share-card-template-preview" style="background: linear-gradient(135deg, #ea4f4f 0%, #ffdd00 100%);">
                                🎨
                            </div>
                            <div class="share-card-template-name">活力橙</div>
                        </div>
                        <div class="share-card-template" onclick="shareCardGenerator.selectTemplate(3)">
                            <div class="share-card-template-preview" style="background: linear-gradient(135deg, #5ead73 0%, #00AEEF 100%);">
                                🌿
                            </div>
                            <div class="share-card-template-name">清新綠</div>
                        </div>
                    </div>
                    
                    <h3>預覽</h3>
                    <div class="share-card-preview">
                        <canvas id="shareCardCanvas"></canvas>
                    </div>
                    
                    <div class="share-card-actions">
                        <button class="share-card-action-btn" onclick="shareCardGenerator.downloadCard()">
                            <i class="fas fa-download"></i> 下載圖片
                        </button>
                        <button class="share-card-action-btn secondary" onclick="shareCardGenerator.copyToClipboard()">
                            <i class="fas fa-copy"></i> 複製圖片
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 點擊背景關閉
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    /**
     * 打開生成器
     */
    async openGenerator(portfolioData) {
        this.portfolioData = portfolioData;
        
        // 確保數據完整
        this.portfolioData = {
            id: portfolioData.id || 1,
            title: portfolioData.title || '作品標題',
            author: portfolioData.author || portfolioData.authorName || '創作者',
            description: portfolioData.description || '這是一個精彩的作品',
            image: portfolioData.image || portfolioData.imageUrl || portfolioData.thumbnail_url || 'https://via.placeholder.com/500x350',
            views: portfolioData.views || 0,
            likes: portfolioData.likes || 0,
            comments: portfolioData.comments || 0,
            url: portfolioData.url || window.location.href
        };
        
        const modal = document.getElementById('shareCardModal');
        modal.classList.add('active');
        
        // 等待庫載入完成
        await this.waitForLibraries();
        
        // 生成卡片
        await this.generateCard();
    }

    /**
     * 等待庫載入
     */
    async waitForLibraries() {
        let attempts = 0;
        while (typeof html2canvas === 'undefined' && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
    }

    /**
     * 關閉模態框
     */
    closeModal() {
        const modal = document.getElementById('shareCardModal');
        modal.classList.remove('active');
    }

    /**
     * 選擇模板
     */
    async selectTemplate(templateId) {
        this.currentTemplate = templateId;
        
        // 更新模板選中狀態
        document.querySelectorAll('.share-card-template').forEach((el, index) => {
            el.classList.toggle('active', index + 1 === templateId);
        });
        
        // 重新生成卡片
        await this.generateCard();
    }

    /**
     * 生成分享卡片
     */
    async generateCard() {
        if (typeof html2canvas === 'undefined') {
            alert('圖片生成庫尚未載入，請稍候再試');
            return;
        }
        
        // 創建臨時容器
        const container = document.createElement('div');
        container.className = 'share-card-content';
        container.innerHTML = this.getTemplateHTML(this.currentTemplate);
        document.body.appendChild(container);
        
        // 生成 QR Code
        const qrContainer = container.querySelector('.card-qr-code');
        if (qrContainer && typeof QRCode !== 'undefined') {
            qrContainer.innerHTML = '';
            new QRCode(qrContainer, {
                text: this.portfolioData.url,
                width: 120,
                height: 120
            });
        }
        
        // 等待圖片載入
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
            // 轉換為 Canvas
            const canvas = await html2canvas(container, {
                scale: 2,
                backgroundColor: null,
                logging: false,
                useCORS: true
            });
            
            // 顯示預覽
            const previewCanvas = document.getElementById('shareCardCanvas');
            const ctx = previewCanvas.getContext('2d');
            previewCanvas.width = canvas.width;
            previewCanvas.height = canvas.height;
            ctx.drawImage(canvas, 0, 0);
            
            // 保存 canvas 供下載使用
            this.currentCanvas = canvas;
        } catch (error) {
            console.error('生成卡片失敗:', error);
            alert('生成失敗，請重試');
        }
        
        // 移除臨時容器
        document.body.removeChild(container);
    }

    /**
     * 獲取模板 HTML
     */
    getTemplateHTML(templateId) {
        const data = this.portfolioData;
        const gradients = [
            'linear-gradient(135deg, #273ec3 0%, #00AEEF 100%)',
            'linear-gradient(135deg, #ea4f4f 0%, #ffdd00 100%)',
            'linear-gradient(135deg, #5ead73 0%, #00AEEF 100%)'
        ];
        
        return `
            <div class="share-card-template-1" style="background: ${gradients[templateId - 1]};">
                <div class="card-header">
                    <h1 class="card-title">${data.title}</h1>
                    <p class="card-author">by ${data.author}</p>
                </div>
                
                <div class="card-body">
                    <div class="card-image">
                        <img src="${data.image}" alt="${data.title}" crossorigin="anonymous">
                    </div>
                    
                    <div class="card-info">
                        <div class="card-stats">
                            <div class="stat-item">
                                <span class="stat-number">${this.formatNumber(data.views)}</span>
                                <span class="stat-label">瀏覽</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">${this.formatNumber(data.likes)}</span>
                                <span class="stat-label">讚</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">${this.formatNumber(data.comments)}</span>
                                <span class="stat-label">評論</span>
                            </div>
                        </div>
                        
                        <div class="card-qr">
                            <div class="card-qr-code"></div>
                            <p class="card-qr-text">掃碼查看作品</p>
                        </div>
                    </div>
                </div>
                
                <div class="card-footer">
                    <p>Portfolio+ | 讓作品說話，讓才華發光 ✨</p>
                </div>
            </div>
        `;
    }

    /**
     * 下載卡片
     */
    downloadCard() {
        if (!this.currentCanvas) {
            alert('請先生成卡片');
            return;
        }
        
        this.currentCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.portfolioData.title}_分享卡片_${new Date().getTime()}.png`;
            a.click();
            URL.revokeObjectURL(url);
            
            // 顯示通知
            if (typeof showAchievement === 'function') {
                showAchievement({
                    type: 'badge',
                    title: '下載成功！',
                    subtitle: '📥 分享卡片',
                    description: '圖片已保存到本機',
                    icon: '✅',
                    duration: 3000
                });
            }
        });
    }

    /**
     * 複製到剪貼板
     */
    async copyToClipboard() {
        if (!this.currentCanvas) {
            alert('請先生成卡片');
            return;
        }
        
        try {
            this.currentCanvas.toBlob(async (blob) => {
                const item = new ClipboardItem({ 'image/png': blob });
                await navigator.clipboard.write([item]);
                
                // 顯示通知
                if (typeof showAchievement === 'function') {
                    showAchievement({
                        type: 'badge',
                        title: '已複製到剪貼板！',
                        subtitle: '📋 分享卡片',
                        description: '可以直接貼上分享',
                        icon: '✅',
                        duration: 3000
                    });
                } else {
                    alert('已複製到剪貼板！');
                }
            });
        } catch (error) {
            console.error('複製失敗:', error);
            alert('複製失敗，請使用下載功能');
        }
    }

    /**
     * 格式化數字
     */
    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }
}

// 創建全局實例
window.shareCardGenerator = new ShareCardGenerator();

// 全局方法
window.generateShareCard = function(portfolioData) {
    window.shareCardGenerator.openGenerator(portfolioData);
};

