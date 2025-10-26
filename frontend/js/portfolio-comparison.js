/**
 * 作品對比工具 - 履歷風格
 * 企業可同時查看多個學生作品進行比較
 */

class PortfolioComparison {
    constructor(containerId, resultsId) {
        this.container = document.getElementById(containerId);
        this.resultsContainer = document.getElementById(resultsId);
        this.selectedPortfolios = [];
        this.allPortfolios = [];
        this.maxSelection = 4;
        this.charts = {};
        this.sampleData = [];
        
        // 檢查容器是否存在
        if (!this.container) {
            console.error(`Container element with ID '${containerId}' not found`);
            return;
        }
        
        if (!this.resultsContainer) {
            console.error(`Results container element with ID '${resultsId}' not found`);
        }
        
        this.init();
    }

    async init() {
        // 載入篩選器選項
        await this.loadFilterOptions();
        
        // 嘗試載入真實數據
        try {
            await this.fetchPortfolios();
            if (this.allPortfolios.length === 0) {
                console.log('API返回空數據，嘗試使用示例數據');
                this.loadSampleData();
            } else {
                console.log(`成功載入 ${this.allPortfolios.length} 個真實作品`);
            }
        } catch (error) {
            console.log('載入真實數據失敗，使用示例數據:', error.message);
            this.loadSampleData();
        }
        
        this.renderPortfolioGrid();
        this.addEventListeners();
    }

    async fetchPortfolios() {
        try {
            console.log('正在從API載入作品數據...');
            const response = await fetch('/portfolio/api/enterprise/portfolios.php?action=get_all_published_portfolios&limit=50');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('API響應:', data);

            if (data.status === 200 && data.data) {
                this.allPortfolios = data.data;
                console.log(`成功載入 ${this.allPortfolios.length} 個作品`);
            } else if (data.success && data.data) {
                // 兼容不同的API響應格式
                this.allPortfolios = data.data;
                console.log(`成功載入 ${this.allPortfolios.length} 個作品 (兼容格式)`);
            } else {
                console.warn('API返回空數據或錯誤:', data.message || '未知錯誤');
                this.allPortfolios = [];
            }
        } catch (error) {
            console.error("載入作品列表時發生錯誤:", error);
            this.allPortfolios = [];
            throw error; // 重新拋出錯誤，讓上層處理
        }
    }

    // 載入示例數據
    loadSampleData() {
        this.sampleData = [
            {
                id: 1,
                student_id: 1,
                student_name: '張小明',
                title: '電商網站前端開發',
                description: '使用React和Node.js開發的全功能電商平台，包含用戶管理、商品展示、購物車等功能。',
                category: '前端開發',
                category_color: '#3B82F6',
                skills: ['React', 'JavaScript', 'CSS3', 'Node.js'],
                major: '資訊工程',
                school: '台灣大學',
                grade: '大四',
                views: 1250,
                likes: 89,
                comments: 23,
                cover_image: '/portfolio/uploads/portfolios/ecommerce-demo.jpg',
                published_at: '2024-01-15',
                is_featured: true
            },
            {
                id: 2,
                student_id: 2,
                student_name: '李美華',
                title: '智能推薦系統',
                description: '基於機器學習的電影推薦系統，使用Python和TensorFlow實現協同過濾算法。',
                category: '資料分析',
                category_color: '#10B981',
                skills: ['Python', 'TensorFlow', 'Machine Learning', 'Pandas'],
                major: '資訊管理',
                school: '清華大學',
                grade: '碩二',
                views: 980,
                likes: 67,
                comments: 18,
                cover_image: '/portfolio/uploads/portfolios/ml-recommendation.jpg',
                published_at: '2024-01-10',
                is_featured: false
            },
            {
                id: 3,
                student_id: 3,
                student_name: '王大偉',
                title: '移動端UI設計',
                description: '為金融App設計的現代化UI界面，注重用戶體驗和視覺設計。',
                category: 'UI/UX設計',
                category_color: '#F59E0B',
                skills: ['Figma', 'Adobe XD', 'UI/UX', 'Prototyping'],
                major: '設計',
                school: '實踐大學',
                grade: '大三',
                views: 756,
                likes: 45,
                comments: 12,
                cover_image: '/portfolio/uploads/portfolios/mobile-ui.jpg',
                published_at: '2024-01-08',
                is_featured: true
            },
            {
                id: 4,
                student_id: 4,
                student_name: '陳志強',
                title: '區塊鏈投票系統',
                description: '基於以太坊的透明投票系統，確保投票過程的公正性和不可篡改性。',
                category: '後端開發',
                category_color: '#8B5CF6',
                skills: ['Solidity', 'Web3.js', 'Blockchain', 'Smart Contract'],
                major: '資訊工程',
                school: '成功大學',
                grade: '碩一',
                views: 1120,
                likes: 78,
                comments: 25,
                cover_image: '/portfolio/uploads/portfolios/blockchain-voting.jpg',
                published_at: '2024-01-05',
                is_featured: false
            },
            {
                id: 5,
                student_id: 5,
                student_name: '林雅婷',
                title: 'iOS購物App',
                description: '使用Swift開發的原生iOS購物應用，包含完整的電商功能。',
                category: '行動開發',
                category_color: '#EF4444',
                skills: ['Swift', 'iOS', 'UIKit', 'Core Data'],
                major: '資訊工程',
                school: '交通大學',
                grade: '大四',
                views: 890,
                likes: 56,
                comments: 19,
                cover_image: '/portfolio/uploads/portfolios/ios-shopping.jpg',
                published_at: '2024-01-03',
                is_featured: true
            },
            {
                id: 6,
                student_id: 6,
                student_name: '黃建國',
                title: '數據可視化儀表板',
                description: '使用D3.js和React開發的互動式數據可視化平台。',
                category: '資料分析',
                category_color: '#10B981',
                skills: ['D3.js', 'React', 'Data Visualization', 'Chart.js'],
                major: '資訊管理',
                school: '政治大學',
                grade: '碩二',
                views: 650,
                likes: 42,
                comments: 15,
                cover_image: '/portfolio/uploads/portfolios/data-dashboard.jpg',
                published_at: '2024-01-01',
                is_featured: false
            }
        ];
        
        this.allPortfolios = this.sampleData;
        this.renderPortfolioGrid();
    }

    // 載入篩選器選項
    async loadFilterOptions() {
        try {
            // 載入分類選項
            await this.loadCategories();
            
            // 載入科系選項
            await this.loadDepartments();
            
            // 載入技能等級選項（如果元素存在）
            const skillLevelSelect = document.getElementById('skillLevelFilter');
            if (skillLevelSelect) {
                this.loadSkillLevels();
            }
            
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

            const response = await fetch('/portfolio/api/enterprise/portfolios.php?action=categories');
            const data = await response.json();
            
            if (data.status === 200 && data.data) {
                // 清空現有選項（保留"全部類型"）
                categorySelect.innerHTML = '<option value="">全部類型</option>';
                
                // 添加分類選項
                data.data.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.slug || category.name;
                    option.textContent = category.name;
                    categorySelect.appendChild(option);
                });
            } else {
                // 如果API失敗，使用示例數據
                this.loadSampleCategories();
            }
        } catch (error) {
            console.error('載入分類失敗:', error);
            this.loadSampleCategories();
        }
    }

    // 載入示例分類（僅在API失敗時使用）
    loadSampleCategories() {
        const categorySelect = document.getElementById('categoryFilter');
        if (!categorySelect) {
            console.warn('Category filter element not found for sample data');
            return;
        }

        console.log('使用示例分類數據');
        const sampleCategories = [
            '前端開發', '後端開發', 'UI/UX設計', '資料分析', 
            '行動開發', '遊戲開發', '人工智慧', '區塊鏈'
        ];
        
        sampleCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
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
            const response = await fetch('/portfolio/api/student/skill-analysis.php?action=get_departments');
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

    // 載入示例科系（僅在API失敗時使用）
    loadSampleDepartments() {
        const departmentSelect = document.getElementById('departmentFilter');
        if (!departmentSelect) {
            console.warn('Department filter element not found for sample data');
            return;
        }

        console.log('使用示例科系數據');
        const departments = [
            '資訊工程', '資訊管理', '資訊科學', '電腦科學',
            '軟體工程', '網路工程', '多媒體設計', '數位媒體',
            '商業管理', '企業管理', '行銷管理', '其他科系'
        ];
        
        departments.forEach(department => {
            const option = document.createElement('option');
            option.value = department;
            option.textContent = department;
            departmentSelect.appendChild(option);
        });
    }

    // 載入技能等級選項
    loadSkillLevels() {
        const skillLevelSelect = document.getElementById('skillLevelFilter');
        if (!skillLevelSelect) {
            console.warn('Skill level filter element not found');
            return;
        }

        const skillLevels = [
            { value: 'beginner', text: '初級 (0-2年)' },
            { value: 'intermediate', text: '中級 (2-5年)' },
            { value: 'advanced', text: '高級 (5-8年)' },
            { value: 'expert', text: '專家級 (8年+)' }
        ];
        
        skillLevels.forEach(level => {
            const option = document.createElement('option');
            option.value = level.value;
            option.textContent = level.text;
            skillLevelSelect.appendChild(option);
        });
    }

    renderPortfolioGrid() {
        // 檢查容器是否存在
        if (!this.container) {
            console.error('Container element not found');
            return;
        }

        if (!this.allPortfolios || this.allPortfolios.length === 0) {
            this.container.innerHTML = `
                <div class="no-data-state">
                    <div class="no-data-icon"></div>
                    <h3>暫無可對比的作品</h3>
                    <p>目前沒有可用的作品進行對比</p>
                </div>
            `;
            return;
        }

        let gridHtml = '';
        
        this.allPortfolios.forEach((portfolio, index) => {
            const isSelected = this.selectedPortfolios.some(p => p.id === portfolio.id);
            // 使用作品標題進行智能分類檢測
            const categoryData = this.getCategoryData(portfolio.category_name || portfolio.category, portfolio.title);
            const thumbnail = portfolio.cover_image || this.getDefaultThumbnail(categoryData.name);
            
            // 調試輸出
            if (index < 3) {
                console.log(`作品 ${index + 1}:`, {
                    title: portfolio.title,
                    originalCategory: portfolio.category_name || portfolio.category,
                    detectedCategory: categoryData.name,
                    icon: categoryData.icon,
                    color: categoryData.color
                });
            }
            
            gridHtml += `
                <div class="portfolio-card ${isSelected ? 'selected' : ''}" 
                     data-portfolio-id="${portfolio.id}" 
                     onclick="togglePortfolioSelection(${portfolio.id})">
                    <div class="portfolio-thumbnail">
                        <img src="${thumbnail}" alt="${portfolio.title}" onerror="this.style.display='none'">
                    </div>
                    <div class="portfolio-info">
                        <h3>${portfolio.title}</h3>
                        <div class="portfolio-meta">
                            <div class="portfolio-category" style="background: ${categoryData.color}">
                                <i class="${categoryData.icon}"></i>
                                ${categoryData.name}
                            </div>
                        </div>
                        <div class="portfolio-stats">
                            <div class="portfolio-stat">
                                <i class="fas fa-eye view-icon"></i>
                                <span>${portfolio.view_count || 0}</span>
                            </div>
                            <div class="portfolio-stat">
                                <i class="fas fa-heart like-icon"></i>
                                <span>${portfolio.like_count || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        this.container.innerHTML = gridHtml;
    }

    // 獲取分類數據（包括圖標、顏色和名稱）
    getCategoryData(categoryName, portfolioTitle = '') {
        // 優先使用作品標題進行智能分類判斷
        const titleForDetection = portfolioTitle || categoryName;
        const category = this.detectCategory(titleForDetection);
        
        const categoryMap = {
            '前端開發': { name: '前端開發', icon: 'fas fa-code', color: '#3B82F6' },
            '後端開發': { name: '後端開發', icon: 'fas fa-server', color: '#8B5CF6' },
            'UI/UX設計': { name: 'UI/UX設計', icon: 'fas fa-palette', color: '#F59E0B' },
            '資料分析': { name: '資料分析', icon: 'fas fa-chart-bar', color: '#10B981' },
            '行動開發': { name: '行動開發', icon: 'fas fa-mobile-alt', color: '#EF4444' },
            '遊戲開發': { name: '遊戲開發', icon: 'fas fa-gamepad', color: '#EC4899' },
            '人工智慧': { name: '人工智慧', icon: 'fas fa-brain', color: '#6366F1' },
            '機器學習': { name: '機器學習', icon: 'fas fa-robot', color: '#8B5CF6' },
            '區塊鏈': { name: '區塊鏈', icon: 'fas fa-link', color: '#14B8A6' },
            '雲端運算': { name: '雲端運算', icon: 'fas fa-cloud', color: '#06B6D4' },
            '網路安全': { name: '網路安全', icon: 'fas fa-shield-alt', color: '#DC2626' },
            '資料庫': { name: '資料庫', icon: 'fas fa-database', color: '#7C3AED' },
            '建築設計': { name: '建築設計', icon: 'fas fa-building', color: '#059669' },
            '工業設計': { name: '工業設計', icon: 'fas fa-cogs', color: '#D97706' },
            '產品設計': { name: '產品設計', icon: 'fas fa-box', color: '#EA580C' },
            '平面設計': { name: '平面設計', icon: 'fas fa-image', color: '#F59E0B' },
            '3D設計': { name: '3D設計', icon: 'fas fa-cube', color: '#8B5CF6' },
            '動畫設計': { name: '動畫設計', icon: 'fas fa-film', color: '#EC4899' },
            '網頁設計': { name: '網頁設計', icon: 'fas fa-desktop', color: '#3B82F6' },
            '多媒體設計': { name: '多媒體設計', icon: 'fas fa-photo-video', color: '#F59E0B' },
            '系統開發': { name: '系統開發', icon: 'fas fa-project-diagram', color: '#6366F1' },
            '嵌入式系統': { name: '嵌入式系統', icon: 'fas fa-microchip', color: '#EF4444' },
            '物聯網': { name: '物聯網', icon: 'fas fa-wifi', color: '#14B8A6' },
            '自動化': { name: '自動化', icon: 'fas fa-industry', color: '#64748B' },
            '其他': { name: '其他', icon: 'fas fa-folder', color: '#94A3B8' }
        };
        
        return categoryMap[category] || { name: category || '未分類', icon: 'fas fa-folder', color: '#94A3B8' };
    }

    // 智能檢測分類
    detectCategory(title) {
        if (!title) return '其他';
        
        const titleLower = title.toLowerCase();
        
        // 定義關鍵字映射
        const keywordMap = {
            '前端開發': ['前端', 'frontend', 'react', 'vue', 'angular', 'web開發', '網頁', 'html', 'css', 'javascript'],
            '後端開發': ['後端', 'backend', 'api', 'server', 'node', 'python', 'java', 'php', '伺服器'],
            'UI/UX設計': ['ui', 'ux', '介面', '使用者', '體驗', 'user interface', 'user experience', 'figma', 'sketch'],
            '資料分析': ['資料', 'data', '分析', 'analytics', '數據', '統計', 'visualization', '視覺化'],
            '行動開發': ['行動', 'mobile', 'app', 'ios', 'android', 'flutter', 'react native', '應用程式'],
            '遊戲開發': ['遊戲', 'game', 'unity', 'unreal', '3d遊戲'],
            '人工智慧': ['ai', '人工智慧', 'artificial intelligence', '智能', '深度學習', 'deep learning'],
            '機器學習': ['machine learning', '機器學習', 'ml', 'tensorflow', 'pytorch', '模型'],
            '區塊鏈': ['blockchain', '區塊鏈', 'crypto', 'ethereum', 'smart contract', '智能合約'],
            '雲端運算': ['cloud', '雲端', 'aws', 'azure', 'gcp', '雲計算'],
            '網路安全': ['security', '安全', 'cybersecurity', '資安', '防護'],
            '資料庫': ['database', '資料庫', 'sql', 'nosql', 'mongodb', 'mysql'],
            '建築設計': ['建築', 'architecture', '永續', 'sustainable', '建設'],
            '工業設計': ['工業', 'industrial', '製造', '產線'],
            '產品設計': ['產品', 'product', '設計'],
            '平面設計': ['平面', 'graphic', '海報', 'poster', '視覺'],
            '3D設計': ['3d', '立體', '建模', 'modeling'],
            '動畫設計': ['動畫', 'animation', '影片', 'video'],
            '網頁設計': ['網頁設計', 'web design', '網站'],
            '多媒體設計': ['多媒體', 'multimedia', '影音'],
            '系統開發': ['系統', 'system', '平台', 'platform'],
            '嵌入式系統': ['嵌入式', 'embedded', 'iot device'],
            '物聯網': ['iot', '物聯網', 'internet of things'],
            '自動化': ['自動化', 'automation', '智慧工廠', 'smart factory', '工廠']
        };
        
        // 檢查每個類別的關鍵字
        for (const [category, keywords] of Object.entries(keywordMap)) {
            for (const keyword of keywords) {
                if (titleLower.includes(keyword.toLowerCase())) {
                    return category;
                }
            }
        }
        
        return '其他';
    }

    getDefaultThumbnail(category) {
        const thumbnails = {
            '前端開發': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDI4MCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyODAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjE0MCIgeT0iNjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY0NzQ4QiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWbvueJh+WKoOi9vTwvdGV4dD4KPC9zdmc+',
            '後端開發': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDI4MCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyODAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjE0MCIgeT0iNjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY0NzQ4QiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuiAgeWKoOi9vTwvdGV4dD4KPC9zdmc+',
            'UI/UX設計': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDI4MCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyODAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjE0MCIgeT0iNjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY0NzQ4QiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlVJL1VY6K6+6K6hPC90ZXh0Pgo8L3N2Zz4=',
            '資料分析': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDI4MCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyODAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjE0MCIgeT0iNjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY0NzQ4QiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPumHjeW6puWKoOi9vTwvdGV4dD4KPC9zdmc+',
            '行動開發': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDI4MCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyODAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjE0MCIgeT0iNjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY0NzQ4QiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuiAgeWKoOi9vTwvdGV4dD4KPC9zdmc+'
        };
        return thumbnails[category] || thumbnails['前端開發'];
    }

    togglePortfolioSelection(portfolioId) {
        const portfolio = this.allPortfolios.find(p => p.id === portfolioId);
        if (!portfolio) return;

        const existingIndex = this.selectedPortfolios.findIndex(p => p.id === portfolioId);
        
        if (existingIndex > -1) {
            // 取消選擇
            this.selectedPortfolios.splice(existingIndex, 1);
        } else if (this.selectedPortfolios.length < this.maxSelection) {
            // 添加選擇
            this.selectedPortfolios.push(portfolio);
        } else {
            // 已達最大選擇數量
            alert(`最多只能選擇 ${this.maxSelection} 個作品進行對比`);
            return;
        }

        this.renderPortfolioGrid();
        this.updateComparisonResults();
    }

    updateComparisonResults() {
        const count = this.selectedPortfolios.length;
        document.getElementById('selectedCount').textContent = count;

        if (count >= 2) {
            this.resultsContainer.style.display = 'block';
            this.renderComparisonResults();
        } else {
            this.resultsContainer.style.display = 'none';
        }
    }

    renderComparisonResults() {
        this.renderOverviewTab();
        this.renderSkillsTab();
        this.renderPortfoliosTab();
    }

    renderOverviewTab() {
        const overviewTab = document.getElementById('overview-tab');
        
        overviewTab.innerHTML = `
            <div class="comparison-summary">
                <h3>對比摘要</h3>
                <div class="summary-grid">
                    ${this.selectedPortfolios.map(portfolio => `
                        <div class="summary-card">
                            <h4>${portfolio.title}</h4>
                            <p><strong>類型：</strong>${portfolio.category_name || portfolio.category || '未分類'}</p>
                            <p><strong>瀏覽數：</strong>${portfolio.view_count || 0}</p>
                            <p><strong>讚數：</strong>${portfolio.like_count || 0}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="comparison-chart">
                <h3>綜合評分對比</h3>
                <div class="chart-container">
                    <canvas id="overviewChart"></canvas>
                </div>
            </div>
        `;

        setTimeout(() => {
            this.renderOverviewChart();
        }, 100);
    }

    renderSkillsTab() {
        const skillsTab = document.getElementById('skills-tab');
        
        // 動態分析所有學生的技能
        const allSkills = this.analyzeAllSkills();
        const skillLabels = Object.keys(allSkills);
        
        skillsTab.innerHTML = `
            <div class="skills-comparison">
                <div class="skills-radar-container">
                    <h3>技能雷達圖對比</h3>
                    <div class="chart-container">
                        <canvas id="skillsRadarChart"></canvas>
                    </div>
                </div>
                
                <div class="skills-breakdown">
                    <h3>技能詳細對比</h3>
                    <div class="skills-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>技能項目</th>
                                    ${this.selectedPortfolios.map(p => `<th>${p.student_name || p.title}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${skillLabels.map(skill => `
                                    <tr>
                                        <td>${skill}</td>
                                        ${this.selectedPortfolios.map(p => `<td>${this.getSkillScore(p, skill)}%</td>`).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        setTimeout(() => {
            this.renderSkillsRadarChart(skillLabels);
        }, 100);
    }

    renderPortfoliosTab() {
        const portfoliosTab = document.getElementById('portfolios-tab');
        
        portfoliosTab.innerHTML = `
            <div class="portfolios-details">
                ${this.selectedPortfolios.map(portfolio => `
                    <div class="portfolio-detail-card">
                        <div class="detail-header">
                            <h3>${portfolio.title}</h3>
                            <div class="detail-category">${portfolio.category_name || portfolio.category || '未分類'}</div>
                        </div>
                        <div class="detail-content">
                            <p><strong>描述：</strong>${portfolio.description || '暫無描述'}</p>
                            <div class="detail-stats">
                                <div class="detail-stat">
                                    <span class="stat-label">瀏覽數：</span>
                                    <span class="stat-value">${portfolio.view_count || 0}</span>
                                </div>
                                <div class="detail-stat">
                                    <span class="stat-label">讚數：</span>
                                    <span class="stat-value">${portfolio.like_count || 0}</span>
                                </div>
                                <div class="detail-stat">
                                    <span class="stat-label">評論數：</span>
                                    <span class="stat-value">${portfolio.comment_count || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderOverviewChart() {
        const canvas = document.getElementById('overviewChart');
        if (!canvas) return;

        if (this.charts.overviewChart) {
            this.charts.overviewChart.destroy();
        }

        const ctx = canvas.getContext('2d');
        
        this.charts.overviewChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: this.selectedPortfolios.map(p => p.title),
                datasets: [
                    {
                        label: '瀏覽數',
                        data: this.selectedPortfolios.map(p => p.view_count || 0),
                        backgroundColor: 'rgba(59, 130, 246, 0.6)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 1
                    },
                    {
                        label: '讚數',
                        data: this.selectedPortfolios.map(p => p.like_count || 0),
                        backgroundColor: 'rgba(16, 185, 129, 0.6)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 0 },
                plugins: {
                    title: {
                        display: true,
                        text: '作品數據對比',
                        font: { size: 14 }
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { font: { size: 12 } }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { font: { size: 11 } }
                    },
                    x: {
                        ticks: { font: { size: 11 } }
                    }
                }
            }
        });
    }

    renderSkillsRadarChart(skillLabels = null) {
        const canvas = document.getElementById('skillsRadarChart');
        if (!canvas) return;

        if (this.charts.skillsRadarChart) {
            this.charts.skillsRadarChart.destroy();
        }

        const ctx = canvas.getContext('2d');
        
        // 使用傳入的技能標籤，如果沒有則使用預設
        const skillCategories = skillLabels || ['前端開發', '後端開發', 'UI/UX設計', '資料分析'];
        
        const colors = [
            'rgba(59, 130, 246, 0.6)',
            'rgba(16, 185, 129, 0.6)',
            'rgba(245, 158, 11, 0.6)',
            'rgba(139, 92, 246, 0.6)',
            'rgba(239, 68, 68, 0.6)',
            'rgba(168, 85, 247, 0.6)',
            'rgba(34, 197, 94, 0.6)',
            'rgba(251, 146, 60, 0.6)'
        ];

        this.charts.skillsRadarChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: skillCategories,
                datasets: this.selectedPortfolios.map((portfolio, index) => ({
                    label: portfolio.student_name || portfolio.title,
                    data: skillCategories.map(skill => this.getSkillScore(portfolio, skill)),
                    backgroundColor: colors[index % colors.length],
                    borderColor: colors[index % colors.length].replace('0.6', '1'),
                    borderWidth: 2,
                    pointBackgroundColor: colors[index % colors.length].replace('0.6', '1'),
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: colors[index % colors.length].replace('0.6', '1')
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 0 },
                plugins: {
                    title: {
                        display: true,
                        text: '技能雷達圖對比',
                        font: { size: 14 }
                    },
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: { 
                            font: { size: 12 },
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.r + '%';
                            }
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        pointLabels: { font: { size: 11 } },
                        ticks: {
                            stepSize: 20,
                            font: { size: 10 },
                            color: '#64748b'
                        },
                        grid: {
                            color: 'rgba(100, 116, 139, 0.2)'
                        },
                        angleLines: {
                            color: 'rgba(100, 116, 139, 0.2)'
                        }
                    }
                }
            }
        });
    }

    getSkillScore(portfolio, skill) {
        // 根據作品分類和技能標籤計算技能分數
        let score = 0;
        
        // 基礎分數：根據作品分類
        const categoryName = portfolio.category_name || portfolio.category;
        if (categoryName === skill) {
            score += 70;
        }
        
        // 技能標籤匹配
        if (portfolio.skills && Array.isArray(portfolio.skills)) {
            const skillKeywords = this.getSkillKeywords(skill);
            const matchedSkills = portfolio.skills.filter(s => 
                skillKeywords.some(keyword => s.toLowerCase().includes(keyword.toLowerCase()))
            );
            score += matchedSkills.length * 20;
        }
        
        // 直接技能名稱匹配
        if (portfolio.skills && Array.isArray(portfolio.skills)) {
            const directMatch = portfolio.skills.some(s => 
                s.toLowerCase() === skill.toLowerCase() || 
                s.toLowerCase().includes(skill.toLowerCase())
            );
            if (directMatch) {
                score += 50;
            }
        }
        
        // 根據作品統計數據調整分數
        const engagement = (portfolio.views || 0) + (portfolio.likes || 0) * 2 + (portfolio.comments || 0) * 3;
        score += Math.min(engagement / 50, 30);
        
        // 如果沒有任何匹配，給予基礎分數
        if (score === 0) {
            score = Math.floor(Math.random() * 30) + 10; // 10-40分
        }
        
        return Math.min(Math.max(score, 0), 100);
    }

    // 分析所有學生的技能
    analyzeAllSkills() {
        const allSkills = {};
        const skillCounts = {};
        
        // 從所有選中的作品中收集技能
        this.selectedPortfolios.forEach(portfolio => {
            // 添加作品分類作為技能
            const categoryName = portfolio.category_name || portfolio.category;
            if (categoryName) {
                allSkills[categoryName] = true;
                skillCounts[categoryName] = (skillCounts[categoryName] || 0) + 1;
            }
            
            // 添加技能標籤
            if (portfolio.skills && Array.isArray(portfolio.skills)) {
                portfolio.skills.forEach(skill => {
                    const normalizedSkill = this.normalizeSkillName(skill);
                    if (normalizedSkill) {
                        allSkills[normalizedSkill] = true;
                        skillCounts[normalizedSkill] = (skillCounts[normalizedSkill] || 0) + 1;
                    }
                });
            }
        });
        
        // 轉換為陣列並按出現頻率排序
        const skillList = Object.keys(allSkills).sort((a, b) => {
            return (skillCounts[b] || 0) - (skillCounts[a] || 0);
        });
        
        // 如果沒有技能，返回預設技能分類
        if (skillList.length === 0) {
            return {
                '前端開發': true,
                '後端開發': true,
                'UI/UX設計': true,
                '資料分析': true
            };
        }
        
        // 優先顯示技能分類，然後是具體技能
        const skillCategories = ['前端開發', '後端開發', 'UI/UX設計', '資料分析', '行動開發', '遊戲開發', '人工智慧', '區塊鏈'];
        const finalSkills = {};
        
        // 先添加技能分類
        skillCategories.forEach(category => {
            if (allSkills[category]) {
                finalSkills[category] = true;
            }
        });
        
        // 再添加其他技能，限制總數
        const remainingSlots = 8 - Object.keys(finalSkills).length;
        skillList.filter(skill => !skillCategories.includes(skill))
                 .slice(0, remainingSlots)
                 .forEach(skill => {
                     finalSkills[skill] = true;
                 });
        
        return finalSkills;
    }

    // 標準化技能名稱
    normalizeSkillName(skill) {
        const skillMap = {
            'javascript': 'JavaScript',
            'js': 'JavaScript',
            'react': 'React',
            'vue': 'Vue.js',
            'angular': 'Angular',
            'node': 'Node.js',
            'nodejs': 'Node.js',
            'python': 'Python',
            'java': 'Java',
            'php': 'PHP',
            'css': 'CSS',
            'html': 'HTML',
            'sql': 'SQL',
            'mysql': 'MySQL',
            'mongodb': 'MongoDB',
            'git': 'Git',
            'docker': 'Docker',
            'aws': 'AWS',
            'figma': 'Figma',
            'photoshop': 'Photoshop',
            'illustrator': 'Illustrator',
            'sketch': 'Sketch',
            'xd': 'Adobe XD'
        };
        
        const lowerSkill = skill.toLowerCase();
        return skillMap[lowerSkill] || skill;
    }

    // 獲取技能關鍵字
    getSkillKeywords(skill) {
        const keywords = {
            '前端開發': ['javascript', 'react', 'vue', 'angular', 'html', 'css', '前端', 'frontend'],
            '後端開發': ['node', 'python', 'java', 'php', '後端', 'backend', 'api', 'server'],
            'UI/UX設計': ['figma', 'sketch', 'photoshop', 'illustrator', 'ui', 'ux', '設計', 'design'],
            '資料分析': ['python', 'sql', 'excel', 'tableau', 'powerbi', '資料', 'data', '分析'],
            '行動開發': ['react native', 'flutter', 'swift', 'kotlin', 'android', 'ios', 'mobile'],
            '遊戲開發': ['unity', 'unreal', 'c#', 'c++', '遊戲', 'game', '3d'],
            '人工智慧': ['python', 'tensorflow', 'pytorch', 'machine learning', 'ai', 'ml', '深度學習'],
            '區塊鏈': ['solidity', 'web3', 'ethereum', 'blockchain', '智能合約', 'crypto']
        };
        
        return keywords[skill] || [skill.toLowerCase()];
    }

    addEventListeners() {
        // 標籤頁切換
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            }
        });
    }

    switchTab(tabName) {
        // 更新按鈕狀態
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // 更新內容顯示
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    clearSelection() {
        this.selectedPortfolios = [];
        this.renderPortfolioGrid();
        this.updateComparisonResults();
    }

    filterPortfolios(category, skillLevel) {
        // 這裡可以實現篩選邏輯
        console.log('Filtering portfolios:', { category, skillLevel });
    }

    // 篩選學生
    filterStudents(category, department, skillLevel) {
        let filtered = this.allPortfolios;
        
        if (category) {
            filtered = filtered.filter(portfolio => {
                const categoryName = portfolio.category_name || portfolio.category;
                return categoryName === category;
            });
        }
        
        if (department) {
            filtered = filtered.filter(portfolio => 
                portfolio.major && portfolio.major.includes(department)
            );
        }
        
        this.renderPortfolioGrid(filtered);
    }

    exportComparison() {
        // 匯出對比結果
        alert('匯出功能開發中...');
    }

    showErrorState(message) {
        this.container.innerHTML = `
            <div class="no-data-state">
                <div class="no-data-icon"></div>
                <h3>載入失敗</h3>
                <p>${message}</p>
                <button class="btn btn-secondary" onclick="location.reload()">
                    <div class="btn-icon refresh-icon"></div>
                    重新載入
                </button>
            </div>
        `;
    }
}

// 全域函數
function togglePortfolioSelection(portfolioId) {
    if (window.portfolioComparison) {
        window.portfolioComparison.togglePortfolioSelection(portfolioId);
    }
}

function clearAllSelections() {
    if (window.portfolioComparison) {
        window.portfolioComparison.clearSelection();
    }
}

function exportComparison() {
    if (window.portfolioComparison) {
        window.portfolioComparison.exportComparison();
    }
}

function filterPortfolios() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const skillFilter = document.getElementById('skillFilter').value;
    
    if (window.portfolioComparison) {
        window.portfolioComparison.filterPortfolios(categoryFilter, skillFilter);
    }
}

function filterStudents() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const departmentFilter = document.getElementById('departmentFilter').value;
    
    if (window.portfolioComparison) {
        window.portfolioComparison.filterStudents(categoryFilter, departmentFilter);
    }
}

function startComparison() {
    if (window.portfolioComparison) {
        window.portfolioComparison.startComparison();
    }
}

// 載入示例數據
function loadSampleData() {
    if (window.portfolioComparison) {
        window.portfolioComparison.loadSampleData();
    }
}

// 重新載入真實數據
async function reloadRealData() {
    if (window.portfolioComparison) {
        try {
            console.log('手動重新載入真實數據...');
            await window.portfolioComparison.fetchPortfolios();
            window.portfolioComparison.renderPortfolioGrid();
            console.log('真實數據載入完成');
        } catch (error) {
            console.error('載入真實數據失敗:', error);
            alert('載入真實數據失敗，請檢查API連接');
        }
    }
}