/**
 * 作品時光機 - 履歷風格
 * 展示學生的作品成長歷程
 */

// 輔助函數：獲取 API 基礎 URL
function getApiBase() {
    return (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.API_BASE_URL) 
        ? APP_CONFIG.API_BASE_URL 
        : '/api';
}

class PortfolioTimeline {
    constructor(containerId, studentId) {
        this.container = document.getElementById(containerId);
        this.studentId = studentId;
        this.portfolios = [];
        this.filteredPortfolios = [];
        this.init();
    }

    async init() {
        // 防止重複初始化
        if (this.initialized) {
            console.log('作品時光機已經初始化，跳過重複初始化');
            return;
        }
        
        this.renderLoading();
        
        // 載入篩選器選項
        await this.loadFilterOptions();
        
        // 嘗試載入真實數據
        try {
            await this.fetchPortfolios();
            if (this.portfolios.length === 0) {
                console.log('API返回空數據，嘗試使用示例數據');
                this.loadSampleData();
            } else {
                console.log(`成功載入 ${this.portfolios.length} 個真實作品`);
            }
        } catch (error) {
            console.log('載入真實數據失敗，使用示例數據:', error.message);
            this.loadSampleData();
        }
        
        this.renderTimeline();
        this.updateStats();
        this.hideLoading();
        
        // 標記為已初始化
        this.initialized = true;
    }

    renderLoading() {
        const loadingState = document.getElementById('loadingState');
        if (loadingState) {
            loadingState.style.display = 'flex';
        }
    }

    hideLoading() {
        const loadingState = document.getElementById('loadingState');
        if (loadingState) {
            loadingState.style.display = 'none';
        }
    }

    async fetchPortfolios() {
        // 防止重複請求
        if (this.isLoading) {
            console.log('正在載入中，跳過重複請求');
            return;
        }
        
        this.isLoading = true;
        
        try {
            console.log('正在從API載入作品數據...');
            const response = await fetch(`${getApiBase()}/student/portfolio.php?action=list&user_id=${this.studentId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('API響應:', data);

            if (data.status === 200 && data.data) {
                // 使用 Set 去重，避免重複作品
                const uniquePortfolios = [];
                const seenIds = new Set();
                
                for (const portfolio of data.data) {
                    if (!seenIds.has(portfolio.id)) {
                        seenIds.add(portfolio.id);
                        uniquePortfolios.push(portfolio);
                    }
                }
                
                this.portfolios = uniquePortfolios.sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at));
                this.filteredPortfolios = [...this.portfolios];
                console.log(`成功載入 ${this.portfolios.length} 個作品（已去重）`);
            } else if (data.success && data.data) {
                // 兼容不同的API響應格式
                const uniquePortfolios = [];
                const seenIds = new Set();
                
                for (const portfolio of data.data) {
                    if (!seenIds.has(portfolio.id)) {
                        seenIds.add(portfolio.id);
                        uniquePortfolios.push(portfolio);
                    }
                }
                
                this.portfolios = uniquePortfolios.sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at));
                this.filteredPortfolios = [...this.portfolios];
                console.log(`成功載入 ${this.portfolios.length} 個作品 (兼容格式，已去重)`);
            } else {
                console.warn('API返回空數據或錯誤:', data.message || '未知錯誤');
                this.portfolios = [];
                this.filteredPortfolios = [];
            }
        } catch (error) {
            console.error("載入作品列表時發生錯誤:", error);
            this.portfolios = [];
            this.filteredPortfolios = [];
            throw error; // 重新拋出錯誤，讓上層處理
        } finally {
            this.isLoading = false;
        }
    }

    // 載入篩選器選項
    async loadFilterOptions() {
        try {
            // 載入分類選項
            await this.loadCategories();
            
            // 載入科系選項
            await this.loadDepartments();
            
        } catch (error) {
            console.error('載入篩選器選項失敗:', error);
        }
    }

    // 載入分類選項
    async loadCategories() {
        try {
            const categorySelect = document.getElementById('categoryFilter');
            if (!categorySelect) {
                console.warn('Category filter element not found');
                return;
            }

            console.log('正在從API載入分類數據...');
            const response = await fetch(`${getApiBase()}/student/portfolio.php?action=categories`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('分類API響應:', data);
            
            if (data.status === 200 && data.data && data.data.length > 0) {
                // 清空現有選項（保留"全部類型"）
                categorySelect.innerHTML = '<option value="">全部類型</option>';
                
                // 添加分類選項
                data.data.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.slug || category.name;
                    option.textContent = category.name;
                    categorySelect.appendChild(option);
                });
                console.log(`成功載入 ${data.data.length} 個分類選項`);
            } else if (data.success && data.data && data.data.length > 0) {
                // 兼容不同的API響應格式
                categorySelect.innerHTML = '<option value="">全部類型</option>';
                
                data.data.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.slug || category.name;
                    option.textContent = category.name;
                    categorySelect.appendChild(option);
                });
                console.log(`成功載入 ${data.data.length} 個分類選項 (兼容格式)`);
            } else {
                console.warn('API返回空分類數據，使用示例數據');
                this.loadSampleCategories();
            }
        } catch (error) {
            console.error('載入分類失敗:', error);
            this.loadSampleCategories();
        }
    }

    // 載入科系選項
    async loadDepartments() {
        const departmentSelect = document.getElementById('departmentFilter');
        if (!departmentSelect) {
            console.warn('Department filter element not found');
            return;
        }

        try {
            console.log('正在從API載入科系數據...');
            const response = await fetch(`${getApiBase()}/student/skill-analysis.php?action=get_departments`);
            const data = await response.json();
            
            if (data.status === 200 && data.data) {
                console.log('成功載入科系數據:', data.data);
                // 清空現有選項（保留"全部科系"）
                departmentSelect.innerHTML = '<option value="">全部科系</option>';
                
                // 添加科系選項
                data.data.forEach(department => {
                    const option = document.createElement('option');
                    option.value = department.name || department;
                    option.textContent = department.name || department;
                    departmentSelect.appendChild(option);
                });
            } else {
                console.warn('API返回空科系數據，使用示例數據');
                this.loadSampleDepartments();
            }
        } catch (error) {
            console.error('載入科系失敗:', error);
            this.loadSampleDepartments();
        }
    }

    // 載入示例數據
    loadSampleData() {
        this.portfolios = [
            {
                id: 1,
                title: '電商網站前端開發',
                description: '使用React和Node.js開發的全功能電商平台，包含用戶管理、商品展示、購物車等功能。',
                category: '前端開發',
                category_color: '#3B82F6',
                tags: ['React', 'JavaScript', 'CSS3', 'Node.js'],
                major: '資訊工程',
                school: '台灣大學',
                grade: '大四',
                views: 1250,
                likes: 89,
                comments: 23,
                cover_image: '/portfolio/uploads/portfolios/ecommerce-demo.jpg',
                published_at: '2024-01-15',
                created_at: '2024-01-15',
                status: 'published'
            },
            {
                id: 2,
                title: '智能推薦系統',
                description: '基於機器學習的電影推薦系統，使用Python和TensorFlow實現協同過濾算法。',
                category: '資料分析',
                category_color: '#10B981',
                tags: ['Python', 'TensorFlow', 'Machine Learning', 'Pandas'],
                major: '資訊管理',
                school: '清華大學',
                grade: '碩二',
                views: 980,
                likes: 67,
                comments: 18,
                cover_image: '/portfolio/uploads/portfolios/ml-recommendation.jpg',
                published_at: '2024-01-10',
                created_at: '2024-01-10',
                status: 'published'
            },
            {
                id: 3,
                title: '移動端UI設計',
                description: '為金融App設計的現代化UI界面，注重用戶體驗和視覺設計。',
                category: 'UI/UX設計',
                category_color: '#F59E0B',
                tags: ['Figma', 'Adobe XD', 'UI/UX', 'Prototyping'],
                major: '設計',
                school: '實踐大學',
                grade: '大三',
                views: 750,
                likes: 45,
                comments: 12,
                cover_image: '/portfolio/uploads/portfolios/ui-design.jpg',
                published_at: '2024-01-05',
                created_at: '2024-01-05',
                status: 'published'
            },
            {
                id: 4,
                title: '區塊鏈智能合約',
                description: '使用Solidity開發的DeFi智能合約，實現去中心化金融功能。',
                category: '區塊鏈',
                category_color: '#8B5CF6',
                tags: ['Solidity', 'Web3', 'Ethereum', 'Smart Contract'],
                major: '資訊工程',
                school: '成功大學',
                grade: '大四',
                views: 1100,
                likes: 78,
                comments: 25,
                cover_image: '/portfolio/uploads/portfolios/blockchain.jpg',
                published_at: '2023-12-20',
                created_at: '2023-12-20',
                status: 'published'
            },
            {
                id: 5,
                title: '數據可視化儀表板',
                description: '使用D3.js和React開發的互動式數據可視化儀表板。',
                category: '數據分析',
                category_color: '#06B6D4',
                tags: ['D3.js', 'React', 'Data Visualization', 'Chart.js'],
                major: '資訊管理',
                school: '政治大學',
                grade: '碩一',
                views: 850,
                likes: 52,
                comments: 15,
                cover_image: '/portfolio/uploads/portfolios/dashboard.jpg',
                published_at: '2023-12-10',
                created_at: '2023-12-10',
                status: 'published'
            }
        ];
        
        this.filteredPortfolios = [...this.portfolios];
        console.log(`載入 ${this.portfolios.length} 個示例作品`);
    }

    // 載入示例分類
    loadSampleCategories() {
        const categorySelect = document.getElementById('categoryFilter');
        if (!categorySelect) return;
        
        const sampleCategories = [
            { name: '前端開發', slug: 'frontend' },
            { name: '後端開發', slug: 'backend' },
            { name: 'UI/UX設計', slug: 'design' },
            { name: '資料分析', slug: 'data' },
            { name: '區塊鏈', slug: 'blockchain' },
            { name: '行動開發', slug: 'mobile' }
        ];
        
        categorySelect.innerHTML = '<option value="">全部類型</option>';
        sampleCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.slug;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    }

    // 載入示例科系
    loadSampleDepartments() {
        const departmentSelect = document.getElementById('departmentFilter');
        if (!departmentSelect) return;
        
        const sampleDepartments = [
            '資訊工程',
            '資訊管理',
            '電腦科學',
            '軟體工程',
            '設計',
            '商業管理',
            '其他'
        ];
        
        departmentSelect.innerHTML = '<option value="">全部科系</option>';
        sampleDepartments.forEach(department => {
            const option = document.createElement('option');
            option.value = department;
            option.textContent = department;
            departmentSelect.appendChild(option);
        });
    }

    renderTimeline() {
        if (!this.filteredPortfolios || this.filteredPortfolios.length === 0) {
            this.container.innerHTML = `
                <div class="no-data-state">
                    <div class="no-data-icon"></div>
                    <h3>暫無作品歷程</h3>
                    <p>您還沒有上傳任何作品，開始創建您的第一個作品吧！</p>
                    <button class="btn btn-primary" onclick="window.location.href='upload.html'">
                        <i class="fas fa-plus"></i>
                        上傳作品
                    </button>
                </div>
            `;
            return;
        }

        let timelineHtml = '';
        
        this.filteredPortfolios.forEach((portfolio, index) => {
            const date = new Date(portfolio.published_at);
            const day = date.getDate();
            const month = date.toLocaleDateString('zh-TW', { month: 'short' });
            const year = date.getFullYear();
            
            timelineHtml += `
                <div class="timeline-item">
                    <div class="timeline-card">
                        <div class="timeline-header">
                            <div class="timeline-date">
                                <div class="day">${day}</div>
                                <div class="month">${month}</div>
                                <div class="year">${year}</div>
                            </div>
                            <div class="timeline-meta">
                                <h3 class="timeline-title">${portfolio.title}</h3>
                            <div class="timeline-category">
                                <i class="fas fa-tag"></i>
                                ${portfolio.category || '其他'}
                            </div>
                                <p class="timeline-description">${portfolio.description || '暫無描述'}</p>
                            </div>
                        </div>
                        
                        <div class="timeline-stats">
                            <div class="timeline-stat">
                                <i class="fas fa-eye timeline-stat-icon"></i>
                                <span>${portfolio.view_count || portfolio.views || 0} 次瀏覽</span>
                            </div>
                            <div class="timeline-stat">
                                <i class="fas fa-heart timeline-stat-icon"></i>
                                <span>${portfolio.like_count || portfolio.likes || 0} 個讚</span>
                            </div>
                            <div class="timeline-stat">
                                <i class="fas fa-comment timeline-stat-icon"></i>
                                <span>${portfolio.comment_count || portfolio.comments || 0} 則評論</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        this.container.innerHTML = timelineHtml;
    }

    updateStats() {
        const totalPortfolios = this.portfolios.length;
        const timelineSpan = this.calculateTimelineSpan();
        const skillGrowth = this.calculateSkillGrowth();

        document.getElementById('totalPortfolios').textContent = totalPortfolios;
        document.getElementById('timelineSpan').textContent = timelineSpan;
        document.getElementById('skillGrowth').textContent = skillGrowth + '%';
    }

    calculateTimelineSpan() {
        if (this.portfolios.length < 2) return '0 天';
        
        const dates = this.portfolios.map(p => new Date(p.published_at));
        const earliest = new Date(Math.min(...dates));
        const latest = new Date(Math.max(...dates));
        const diffTime = Math.abs(latest - earliest);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 30) return `${diffDays} 天`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} 個月`;
        return `${Math.floor(diffDays / 365)} 年`;
    }

    calculateSkillGrowth() {
        if (this.portfolios.length < 2) return 0;
        
        // 簡單的成長計算：基於作品數量和時間跨度
        const timeSpan = this.calculateTimelineSpan();
        const portfolioCount = this.portfolios.length;
        
        // 假設每個月至少1個作品為100%成長
        let months = 1;
        if (timeSpan.includes('年')) {
            months = parseInt(timeSpan) * 12;
        } else if (timeSpan.includes('個月')) {
            months = parseInt(timeSpan);
        } else {
            months = Math.ceil(parseInt(timeSpan) / 30);
        }
        
        const growthRate = Math.min((portfolioCount / months) * 100, 100);
        return Math.round(growthRate);
    }

    filterTimeline(category, timeRange) {
        let filtered = [...this.portfolios];

        // 按類別篩選
        if (category) {
            filtered = filtered.filter(portfolio => portfolio.category === category);
        }

        // 按時間範圍篩選
        if (timeRange) {
            const now = new Date();
            let cutoffDate;

            switch (timeRange) {
                case '1year':
                    cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                    break;
                case '6months':
                    cutoffDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
                    break;
                case '3months':
                    cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                    break;
            }

            if (cutoffDate) {
                filtered = filtered.filter(portfolio => new Date(portfolio.published_at) >= cutoffDate);
            }
        }

        this.filteredPortfolios = filtered;
        this.renderTimeline();
    }

    showErrorState(message) {
        this.container.innerHTML = `
            <div class="no-data-state">
                <div class="no-data-icon"></div>
                <h3>載入失敗</h3>
                <p>${message}</p>
                <button class="btn btn-secondary" onclick="location.reload()">
                    <i class="fas fa-sync-alt"></i>
                    重新載入
                </button>
            </div>
        `;
        this.hideLoading();
    }
}

// 全域函數
function refreshTimeline() {
    location.reload();
}

function exportTimeline() {
    // 匯出時光機功能
    const timeline = document.getElementById('timelineContainer');
    if (timeline) {
        // 這裡可以實現匯出為PDF或圖片的功能
        alert('匯出功能開發中...');
    }
}

function filterTimeline() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const timeFilter = document.getElementById('timeFilter').value;
    
    if (window.portfolioTimeline) {
        window.portfolioTimeline.filterTimeline(categoryFilter, timeFilter);
    }
}

// 載入示例數據
function loadSampleData() {
    if (window.portfolioTimeline) {
        window.portfolioTimeline.loadSampleData();
        window.portfolioTimeline.renderTimeline();
        window.portfolioTimeline.updateStats();
    }
}

// 重新載入真實數據
async function reloadRealData() {
    if (window.portfolioTimeline) {
        try {
            console.log('手動重新載入真實數據...');
            await window.portfolioTimeline.fetchPortfolios();
            window.portfolioTimeline.renderTimeline();
            window.portfolioTimeline.updateStats();
            console.log('真實數據載入完成');
        } catch (error) {
            console.error('載入真實數據失敗:', error);
            alert('載入真實數據失敗，請檢查API連接');
        }
    }
}