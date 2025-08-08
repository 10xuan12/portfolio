/**
 * Portfolio+ 統一假資料檔案
 * 所有介面都可以引用這個檔案來獲取假資料
 * 當後端API準備好時，只需要替換這個檔案的引用即可
 */

// 全域假資料物件
const MockData = {
    // ==================== 使用者資料 ====================
    users: {
        // 學生使用者
        students: [
            {
                id: 1,
                name: '張小明',
                email: 'zhang@example.com',
                role: 'student',
                department: '資訊管理學系',
                grade: '大學三年級',
                avatar: '張',
                phone: '0912-345-678',
                address: '台北市信義區',
                website: 'https://zhang-portfolio.com',
                summary: '專精於前端開發，有豐富的 React 專案經驗，作品包含響應式網站和行動應用程式。',
                skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'HTML5', 'CSS3'],
                created_at: '2024-01-01',
                last_login: '2024-01-15 14:30:00'
            },
            {
                id: 2,
                name: '李小華',
                email: 'li@example.com',
                role: 'student',
                department: '資訊工程學系',
                grade: '大學四年級',
                avatar: '李',
                phone: '0923-456-789',
                address: '新北市板橋區',
                website: 'https://li-portfolio.com',
                summary: '專精於後端開發和資料庫設計，有豐富的 Python 和 Java 專案經驗。',
                skills: ['Python', 'Java', 'MySQL', 'Django', 'Spring Boot'],
                created_at: '2024-01-02',
                last_login: '2024-01-15 13:45:00'
            },
            {
                id: 3,
                name: '王小美',
                email: 'wang@example.com',
                role: 'student',
                department: '統計學系',
                grade: '碩士生',
                avatar: '王',
                phone: '0934-567-890',
                address: '台中市西區',
                website: 'https://wang-portfolio.com',
                summary: '專精於數據分析和機器學習，有豐富的統計建模和預測分析經驗。',
                skills: ['Python', 'R', 'SQL', 'Machine Learning', 'Statistics'],
                created_at: '2024-01-03',
                last_login: '2024-01-15 12:15:00'
            }
        ],
        
        // 企業使用者
        enterprises: [
            {
                id: 101,
                name: '科技公司 A',
                email: 'hr@techcompany-a.com',
                role: 'enterprise',
                industry: '科技業',
                size: '500-1000人',
                location: '台北市',
                website: 'https://techcompany-a.com',
                description: '專注於軟體開發和數位轉型的科技公司',
                founded_year: 2010,
                avatar: 'A',
                phone: '02-1234-5678',
                address: '台北市信義區信義路五段7號',
                created_at: '2024-01-01',
                last_login: '2024-01-15 15:20:00'
            },
            {
                id: 102,
                name: '設計工作室 B',
                email: 'contact@designstudio-b.com',
                role: 'enterprise',
                industry: '設計業',
                size: '50-100人',
                location: '台北市',
                website: 'https://designstudio-b.com',
                description: '專注於UI/UX設計和品牌設計的創意工作室',
                founded_year: 2015,
                avatar: 'B',
                phone: '02-2345-6789',
                address: '台北市大安區敦化南路二段201號',
                created_at: '2024-01-02',
                last_login: '2024-01-15 14:10:00'
            }
        ],
        
        // 管理員使用者
        admins: [
            {
                id: 201,
                name: '系統管理員',
                email: 'admin@portfolio-plus.com',
                role: 'admin',
                avatar: 'A',
                created_at: '2024-01-01',
                last_login: '2024-01-15 16:00:00'
            }
        ]
    },

    // ==================== 作品資料 ====================
    portfolios: [
        {
            id: 1,
            title: '響應式網站設計',
            description: '使用 HTML5、CSS3 和 JavaScript 製作的現代化響應式網站，支援各種裝置尺寸。',
            author_id: 1,
            author_name: '張小明',
            department: '資訊管理學系',
            category: 'web',
            status: 'published',
            tags: ['HTML5', 'CSS3', 'JavaScript', '響應式'],
            image: 'https://via.placeholder.com/400x200/667eea/ffffff?text=Web+Design',
            url: 'https://example.com',
            github: 'https://github.com/example/web-design',
            views: 156,
            likes: 23,
            comments: 8,
            created_at: '2024-01-15',
            updated_at: '2024-01-15'
        },
        {
            id: 2,
            title: '行動應用程式',
            description: '使用 React Native 開發的跨平台行動應用程式，提供流暢的使用者體驗。',
            author_id: 2,
            author_name: '李小華',
            department: '資訊工程學系',
            category: 'mobile',
            status: 'published',
            tags: ['React Native', 'JavaScript', 'Firebase', '跨平台'],
            image: 'https://via.placeholder.com/400x200/764ba2/ffffff?text=Mobile+App',
            url: 'https://example.com/app',
            github: 'https://github.com/example/mobile-app',
            views: 203,
            likes: 45,
            comments: 12,
            created_at: '2024-01-14',
            updated_at: '2024-01-14'
        },
        {
            id: 3,
            title: 'UI/UX 設計作品',
            description: '使用 Figma 設計的現代化使用者介面，注重使用者體驗和視覺美感。',
            author_id: 3,
            author_name: '王小美',
            department: '統計學系',
            category: 'design',
            status: 'review',
            tags: ['Figma', 'UI/UX', '設計系統', '原型設計'],
            image: 'https://via.placeholder.com/400x200/f093fb/ffffff?text=UI+Design',
            url: '',
            github: '',
            views: 0,
            likes: 0,
            comments: 0,
            created_at: '2024-01-13',
            updated_at: '2024-01-13'
        },
        {
            id: 4,
            title: 'Python 數據分析',
            description: '使用 Python 和 pandas 進行數據分析，包含資料清理、視覺化和預測建模。',
            author_id: 3,
            author_name: '王小美',
            department: '統計學系',
            category: 'data',
            status: 'published',
            tags: ['Python', 'Pandas', 'Matplotlib', '數據分析'],
            image: 'https://via.placeholder.com/400x200/4ade80/ffffff?text=Data+Analysis',
            url: 'https://example.com/analysis',
            github: 'https://github.com/example/data-analysis',
            views: 98,
            likes: 15,
            comments: 5,
            created_at: '2024-01-12',
            updated_at: '2024-01-12'
        }
    ],

    // ==================== 職缺資料 ====================
    jobs: [
        {
            id: 1,
            title: '前端工程師',
            company_id: 101,
            company_name: '科技公司 A',
            description: '負責公司產品的前端開發，使用 React 和 TypeScript。',
            requirements: ['JavaScript', 'React', 'TypeScript', 'HTML5', 'CSS3'],
            location: '台北市',
            salary_range: '40,000-60,000',
            type: '全職',
            status: 'active',
            applications: 5,
            created_at: '2024-01-10',
            deadline: '2024-02-10'
        },
        {
            id: 2,
            title: 'UI/UX 設計師',
            company_id: 102,
            company_name: '設計工作室 B',
            description: '負責產品的使用者介面設計和使用者體驗優化。',
            requirements: ['Figma', 'Adobe Creative Suite', 'UI/UX Design', 'Prototyping'],
            location: '台北市',
            salary_range: '35,000-50,000',
            type: '全職',
            status: 'active',
            applications: 3,
            created_at: '2024-01-08',
            deadline: '2024-02-08'
        }
    ],

    // ==================== 通知資料 ====================
    notifications: [
        {
            id: 1,
            user_id: 1,
            type: 'view',
            title: '有人瀏覽了您的作品',
            message: '有人瀏覽了您的作品「響應式網站設計」',
            is_read: false,
            created_at: '2024-01-15 14:30:00'
        },
        {
            id: 2,
            user_id: 1,
            type: 'like',
            title: '有人對您的作品按讚',
            message: '有人對您的作品「響應式網站設計」按讚',
            is_read: false,
            created_at: '2024-01-15 13:45:00'
        },
        {
            id: 3,
            user_id: 1,
            type: 'comment',
            title: '有人評論了您的作品',
            message: '有人評論了您的作品「響應式網站設計」',
            is_read: true,
            created_at: '2024-01-15 12:15:00'
        }
    ],

    // ==================== 統計資料 ====================
    stats: {
        // 平台統計
        platform: {
            total_users: 1234,
            total_portfolios: 567,
            total_views: 45678,
            total_likes: 8901,
            total_comments: 2345,
            active_users_today: 45
        },
        
        // 學生統計
        student: {
            total_portfolios: 12,
            total_views: 1234,
            total_likes: 89,
            total_comments: 23,
            this_month_views: 156,
            this_month_likes: 12,
            this_month_comments: 5
        },
        
        // 企業統計
        enterprise: {
            total_views: 1234,
            total_favorites: 89,
            total_contacts: 23,
            total_jobs: 5,
            this_month_views: 156,
            this_month_favorites: 12,
            this_month_contacts: 3
        },
        
        // 管理員統計
        admin: {
            total_users: 1234,
            total_portfolios: 567,
            pending_reviews: 89,
            active_users_today: 45,
            total_reports: 12,
            system_health: 'good'
        }
    },

    // ==================== 活動記錄 ====================
    activities: [
        {
            id: 1,
            user_id: 1,
            type: 'upload',
            text: '上傳了新作品「UI/UX 設計作品」',
            time: '2 小時前',
            portfolio_id: 3
        },
        {
            id: 2,
            user_id: 1,
            type: 'view',
            text: '有人瀏覽了您的作品「響應式網站設計」',
            time: '4 小時前',
            portfolio_id: 1
        },
        {
            id: 3,
            user_id: 1,
            type: 'like',
            text: '有人對您的作品「行動應用程式」按讚',
            time: '6 小時前',
            portfolio_id: 2
        }
    ],

    // ==================== 徽章資料 ====================
    badges: [
        {
            id: 1,
            name: '作品上傳者',
            description: '上傳了第一個作品',
            icon: 'fas fa-upload',
            earned: true,
            earned_date: '2024-01-15'
        },
        {
            id: 2,
            name: '人氣創作者',
            description: '作品獲得100次瀏覽',
            icon: 'fas fa-eye',
            earned: true,
            earned_date: '2024-01-14'
        },
        {
            id: 3,
            name: '優秀設計師',
            description: '作品獲得50個讚',
            icon: 'fas fa-heart',
            earned: false
        }
    ],

    // ==================== 評論資料 ====================
    comments: [
        {
            id: 1,
            portfolio_id: 1,
            user_id: 101,
            user_name: '科技公司 A',
            content: '設計很現代化，程式碼結構也很清晰！',
            created_at: '2024-01-15 14:30:00'
        },
        {
            id: 2,
            portfolio_id: 1,
            user_id: 102,
            user_name: '設計工作室 B',
            content: '響應式設計做得很好，在不同裝置上都能正常顯示。',
            created_at: '2024-01-15 13:45:00'
        }
    ],

    // ==================== 搜尋結果 ====================
    searchResults: {
        portfolios: [
            {
                id: 1,
                title: '響應式網站設計',
                author: '張小明',
                department: '資訊管理學系',
                category: 'web',
                views: 156,
                likes: 23,
                tags: ['HTML5', 'CSS3', 'JavaScript']
            },
            {
                id: 2,
                title: '行動應用程式',
                author: '李小華',
                department: '資訊工程學系',
                category: 'mobile',
                views: 203,
                likes: 45,
                tags: ['React Native', 'JavaScript', 'Firebase']
            }
        ],
        users: [
            {
                id: 1,
                name: '張小明',
                department: '資訊管理學系',
                grade: '大學三年級',
                skills: ['JavaScript', 'React', 'Node.js'],
                portfolios_count: 3
            },
            {
                id: 2,
                name: '李小華',
                department: '資訊工程學系',
                grade: '大學四年級',
                skills: ['Python', 'Java', 'MySQL'],
                portfolios_count: 2
            }
        ]
    },

    // ==================== 分析資料 ====================
    analytics: {
        // 瀏覽趨勢
        trends: {
            views: [120, 135, 142, 156, 168, 145, 132, 148, 156, 167, 178, 189],
            favorites: [8, 12, 15, 18, 22, 19, 16, 20, 23, 25, 28, 30],
            contacts: [2, 3, 5, 4, 6, 5, 3, 4, 6, 7, 8, 9]
        },
        
        // 熱門技能
        skills: [
            { name: 'JavaScript', percentage: 85 },
            { name: 'React', percentage: 72 },
            { name: 'Python', percentage: 68 },
            { name: 'UI/UX 設計', percentage: 55 },
            { name: 'Node.js', percentage: 42 }
        ],
        
        // 科系分布
        departments: [
            { name: '資訊管理學系', percentage: 35 },
            { name: '資訊工程學系', percentage: 28 },
            { name: '統計學系', percentage: 22 },
            { name: '其他', percentage: 15 }
        ],
        
        // 熱門作品
        popularPortfolios: [
            {
                title: '響應式網站設計',
                author: '張小明',
                department: '資訊管理學系',
                views: 156,
                likes: 23
            },
            {
                title: 'React 電商平台',
                author: '李小華',
                department: '資訊工程學系',
                views: 134,
                likes: 18
            },
            {
                title: 'Python 數據分析',
                author: '王小美',
                department: '統計學系',
                views: 98,
                likes: 15
            }
        ]
    }
};

// ==================== 工具函數 ====================

/**
 * 根據ID取得使用者資料
 */
MockData.getUserById = function(id) {
    const allUsers = [...this.users.students, ...this.users.enterprises, ...this.users.admins];
    return allUsers.find(user => user.id === id);
};

/**
 * 根據角色取得使用者列表
 */
MockData.getUsersByRole = function(role) {
    switch(role) {
        case 'student':
            return this.users.students;
        case 'enterprise':
            return this.users.enterprises;
        case 'admin':
            return this.users.admins;
        default:
            return [];
    }
};

/**
 * 根據ID取得作品資料
 */
MockData.getPortfolioById = function(id) {
    return this.portfolios.find(portfolio => portfolio.id === id);
};

/**
 * 根據作者ID取得作品列表
 */
MockData.getPortfoliosByAuthor = function(authorId) {
    return this.portfolios.filter(portfolio => portfolio.author_id === authorId);
};

/**
 * 根據狀態取得作品列表
 */
MockData.getPortfoliosByStatus = function(status) {
    return this.portfolios.filter(portfolio => portfolio.status === status);
};

/**
 * 根據使用者ID取得通知列表
 */
MockData.getNotificationsByUser = function(userId) {
    return this.notifications.filter(notification => notification.user_id === userId);
};

/**
 * 根據使用者ID取得活動記錄
 */
MockData.getActivitiesByUser = function(userId) {
    return this.activities.filter(activity => activity.user_id === userId);
};

/**
 * 根據使用者ID取得徽章列表
 */
MockData.getBadgesByUser = function(userId) {
    // 這裡可以根據實際需求調整徽章邏輯
    return this.badges;
};

/**
 * 根據作品ID取得評論列表
 */
MockData.getCommentsByPortfolio = function(portfolioId) {
    return this.comments.filter(comment => comment.portfolio_id === portfolioId);
};

/**
 * 搜尋作品
 */
MockData.searchPortfolios = function(keyword, filters = {}) {
    let results = this.portfolios;
    
    // 關鍵字搜尋
    if (keyword) {
        results = results.filter(portfolio => 
            portfolio.title.toLowerCase().includes(keyword.toLowerCase()) ||
            portfolio.description.toLowerCase().includes(keyword.toLowerCase()) ||
            portfolio.tags.some(tag => tag.toLowerCase().includes(keyword.toLowerCase()))
        );
    }
    
    // 分類篩選
    if (filters.category) {
        results = results.filter(portfolio => portfolio.category === filters.category);
    }
    
    // 狀態篩選
    if (filters.status) {
        results = results.filter(portfolio => portfolio.status === filters.status);
    }
    
    return results;
};

/**
 * 搜尋使用者
 */
MockData.searchUsers = function(keyword, filters = {}) {
    let results = [...this.users.students, ...this.users.enterprises];
    
    // 關鍵字搜尋
    if (keyword) {
        results = results.filter(user => 
            user.name.toLowerCase().includes(keyword.toLowerCase()) ||
            user.department.toLowerCase().includes(keyword.toLowerCase()) ||
            user.skills.some(skill => skill.toLowerCase().includes(keyword.toLowerCase()))
        );
    }
    
    // 角色篩選
    if (filters.role) {
        results = results.filter(user => user.role === filters.role);
    }
    
    // 科系篩選
    if (filters.department) {
        results = results.filter(user => user.department === filters.department);
    }
    
    return results;
};

/**
 * 格式化日期
 */
MockData.formatDate = function(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW');
};

/**
 * 格式化時間
 */
MockData.formatTime = function(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW');
};

/**
 * 格式化數字
 */
MockData.formatNumber = function(num) {
    return new Intl.NumberFormat('zh-TW').format(num);
};

// 匯出假資料
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MockData;
} else {
    window.MockData = MockData;
}
