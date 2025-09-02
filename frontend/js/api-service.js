/**
 * Portfolio+ 統一 API 服務
 * 根據配置自動切換假資料和真實API
 */

// 避免重複宣告
if (typeof window.ApiService === 'undefined') {
    class ApiService {
    constructor() {
        // 延遲初始化，等待 config 函數可用
        this.initialized = false;
        this.mockDelay = 500; // 預設值
        this.initConfig();
    }

    /**
     * 初始化配置
     */
    initConfig() {
        try {
            if (typeof getConfig === 'function' && typeof getApiBaseUrl === 'function') {
                this.mockDelay = getConfig('MOCK_API_DELAY') || 500;
                this.initialized = true;
                if (typeof debugLog === 'function') {
                    debugLog('API 服務配置已初始化');
                }
            } else {
                // 如果函數還不可用，稍後再試
                setTimeout(() => this.initConfig(), 100);
            }
        } catch (error) {
            console.warn('API 服務配置初始化失敗，稍後重試:', error);
            setTimeout(() => this.initConfig(), 100);
        }
    }

    /**
     * 動態取得 API 基礎 URL
     */
    get baseUrl() {
        if (typeof getApiBaseUrl === 'function') {
            return getApiBaseUrl();
        }
        return 'http://localhost:8000/api'; // 預設值
    }

    /**
     * 動態取得是否使用假資料
     */
    get useMockData() {
        if (typeof isUsingMockData === 'function') {
            return isUsingMockData();
        }
        return false; // 預設值
    }

    /**
     * 取得完整的 API URL
     */
    getApiUrl(endpoint) {
        if (typeof getApiUrl === 'function') {
            return getApiUrl(endpoint);
        }
        return `${this.baseUrl}/${endpoint}`;
    }

    /**
     * 通用請求方法
     */
    async request(endpoint, options = {}) {
        const url = this.useMockData ? endpoint : this.getApiUrl(endpoint);
        
        if (typeof debugLog === 'function') {
            debugLog(`API 請求: ${endpoint}`, {
                useMockData: this.useMockData,
                url: url,
                method: options.method || 'GET'
            });
        }

        try {
            // 如果是假資料模式，模擬延遲
            if (this.useMockData) {
                if (typeof mockApiDelay === 'function') {
                    await mockApiDelay();
                }
                return this.handleMockResponse(endpoint, options);
            }

            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                const text = await response.text();
                console.error('非 JSON 回應，內容預覽:', text.slice(0, 200));
                throw new Error('Response is not JSON');
            }

            return await response.json();
        } catch (error) {
            console.error(`API 請求失敗: ${endpoint}`, error);
            throw error;
        }
    }

    /**
     * 處理假資料回應
     */
    handleMockResponse(endpoint, options) {
        const method = options.method || 'GET';
        const body = options.body ? JSON.parse(options.body) : null;

        if (typeof debugLog === 'function') {
            debugLog(`處理假資料回應: ${method} ${endpoint}`);
        }

        // 根據端點和方法返回對應的假資料
        switch (endpoint) {
            // 使用者相關
            case 'users':
            case 'users/':
                return this.getMockUsers();
            
            case 'users/1':
            case 'users/2':
            case 'users/3':
                const userId1 = parseInt(endpoint.split('/')[1]);
                return MockData.getUserById(userId1);
            
            case 'users/students':
                return MockData.getUsersByRole('student');
            
            case 'users/enterprises':
                return MockData.getUsersByRole('enterprise');
            
            // 作品相關
            case 'portfolios':
            case 'portfolios/':
                return this.getMockPortfolios();
            
            case 'portfolios/1':
            case 'portfolios/2':
            case 'portfolios/3':
            case 'portfolios/4':
                const portfolioId1 = parseInt(endpoint.split('/')[1]);
                return MockData.getPortfolioById(portfolioId1);
            
            case 'portfolios/author/1':
            case 'portfolios/author/2':
            case 'portfolios/author/3':
                const authorId = parseInt(endpoint.split('/')[2]);
                return MockData.getPortfoliosByAuthor(authorId);
            
            // 統計相關
            case 'stats/platform':
                return MockData.stats.platform;
            
            case 'stats/student':
                return MockData.stats.student;
            
            case 'stats/enterprise':
                return MockData.stats.enterprise;
            
            case 'stats/admin':
                return MockData.stats.admin;
            
            // 通知相關
            case 'notifications':
            case 'notifications/':
                return this.getMockNotifications();
            
            case 'notifications/user/1':
                const userId2 = parseInt(endpoint.split('/')[2]);
                return MockData.getNotificationsByUser(userId2);
            
            // 活動相關
            case 'activities':
            case 'activities/':
                return this.getMockActivities();
            
            case 'activities/user/1':
                const userId3 = parseInt(endpoint.split('/')[2]);
                return MockData.getActivitiesByUser(userId3);
            
            // 搜尋相關
            case 'search/portfolios':
                const searchParams1 = new URLSearchParams(window.location.search);
                const keyword1 = searchParams1.get('q') || '';
                const filters1 = {};
                return MockData.searchPortfolios(keyword1, filters1);
            
            case 'search/users':
                const searchParams2 = new URLSearchParams(window.location.search);
                const keyword2 = searchParams2.get('q') || '';
                const filters2 = {};
                return MockData.searchUsers(keyword2, filters2);
            
            // 分析相關
            case 'analytics/trends':
                return MockData.analytics.trends;
            
            case 'analytics/skills':
                return MockData.analytics.skills;
            
            case 'analytics/departments':
                return MockData.analytics.departments;
            
            // 職缺相關
            case 'jobs':
            case 'jobs/':
                return this.getMockJobs();
            
            // 評論相關
            case 'comments/portfolio/1':
                const portfolioId2 = parseInt(endpoint.split('/')[2]);
                return MockData.getCommentsByPortfolio(portfolioId2);
            
            // 徽章相關
            case 'badges/user/1':
                const userId4 = parseInt(endpoint.split('/')[2]);
                return MockData.getBadgesByUser(userId4);
            
            // 預設回應
            default:
                return {
                    success: true,
                    message: '假資料回應',
                    data: null
                };
        }
    }

    /**
     * 取得假資料使用者
     */
    getMockUsers() {
        return {
            success: true,
            data: {
                students: MockData.users.students,
                enterprises: MockData.users.enterprises,
                admins: MockData.users.admins
            }
        };
    }

    /**
     * 取得假資料作品
     */
    getMockPortfolios() {
        return {
            success: true,
            data: MockData.portfolios
        };
    }

    /**
     * 取得假資料通知
     */
    getMockNotifications() {
        return {
            success: true,
            data: MockData.notifications
        };
    }

    /**
     * 取得假資料活動
     */
    getMockActivities() {
        return {
            success: true,
            data: MockData.activities
        };
    }

    /**
     * 取得假資料職缺
     */
    getMockJobs() {
        return {
            success: true,
            data: MockData.jobs
        };
    }

    // ==================== 具體 API 方法 ====================

    /**
     * 取得使用者資料
     */
    async getUser(userId) {
        return this.request(`users/${userId}`);
    }

    /**
     * 取得使用者列表
     */
    async getUsers(role = null) {
        const endpoint = role ? `users/${role}` : 'users';
        return this.request(endpoint);
    }

    /**
     * 更新使用者資料
     */
    async updateUser(userId, data) {
        return this.request(`users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * 取得作品資料
     */
    async getPortfolio(portfolioId) {
        return this.request(`portfolios/${portfolioId}`);
    }

    /**
     * 取得作品列表
     */
    async getPortfolios(filters = {}) {
        const portfolioQueryString = new URLSearchParams(filters).toString();
        const endpoint = portfolioQueryString ? `portfolios?${portfolioQueryString}` : 'portfolios';
        return this.request(endpoint);
    }

    /**
     * 取得使用者的作品
     */
    async getUserPortfolios(userId) {
        // 對應 PHP: api/student/portfolio.php?action=list&page=1&limit=12
        const params = new URLSearchParams({ action: 'list', page: 1, limit: 12 });
        if (userId) params.set('user_id', userId);
        try {
            const result = await this.request(`student/portfolio.php?${params.toString()}`);
            const data = result?.data || result;
            if (Array.isArray(data)) return data;
            if (Array.isArray(data?.portfolios)) return data.portfolios;
            return [];
        } catch (e) {
            return [];
        }
    }

    /**
     * 建立新作品
     */
    async createPortfolio(data) {
        return this.request('portfolios', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * 更新作品
     */
    async updatePortfolio(portfolioId, data) {
        return this.request(`portfolios/${portfolioId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * 刪除作品
     */
    async deletePortfolio(portfolioId) {
        return this.request(`portfolios/${portfolioId}`, {
            method: 'DELETE'
        });
    }

    /**
     * 取得統計資料
     */
    async getStats(type = 'platform') {
        // 對應到後端尚無 stats.php，先用組合呼叫或回退
        try {
            // 學生端常用 'student'，暫以作品/活動數彙整
            if (type === 'student') {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const userId = user.id;
                const [portfolios, activities] = await Promise.all([
                    this.getUserPortfolios(userId),
                    this.getActivities(userId)
                ]);
                const pfArr = Array.isArray(portfolios) ? portfolios : (portfolios.data?.portfolios || portfolios.data || []);
                const actArr = Array.isArray(activities) ? activities : (activities.data || []);
                return {
                    total_portfolios: pfArr.length || 0,
                    total_views: pfArr.reduce((sum, p) => sum + (p.view_count || p.views || 0), 0),
                    total_likes: pfArr.reduce((sum, p) => sum + (p.like_count || p.likes || 0), 0),
                    total_comments: pfArr.reduce((sum, p) => sum + (p.comment_count || p.comments || 0), 0),
                    recent_activities: actArr.length
                };
            }
        } catch (e) {
            // 回退為空統計
            return { total_portfolios: 0, total_views: 0, total_likes: 0, total_comments: 0 };
        }
        return this.request(`stats/${type}`);
    }

    /**
     * 取得通知
     */
    async getNotifications(userId = null) {
        // 對應 PHP: api/student/notifications.php?action=get&user_id=ID
        const params = new URLSearchParams({ action: 'get' });
        if (userId) params.set('user_id', userId);
        try {
            return await this.request(`student/notifications.php?${params.toString()}`);
        } catch (e) {
            return { data: [] };
        }
    }

    /**
     * 標記通知為已讀
     */
    async markNotificationAsRead(notificationId) {
        // 對應 PHP: api/student/notifications.php?action=read&id=ID
        const params = new URLSearchParams({ action: 'read', id: notificationId });
        return this.request(`student/notifications.php?${params.toString()}`, {
            method: 'PUT'
        });
    }

    /**
     * 取得活動記錄
     */
    async getActivities(userId = null) {
        // 對應 PHP: api/student/activities.php?action=get&user_id=ID
        const params = new URLSearchParams({ action: 'get' });
        if (userId) params.set('user_id', userId);
        try {
            return await this.request(`student/activities.php?${params.toString()}`);
        } catch (e) {
            return { data: [] };
        }
    }

    /**
     * 搜尋作品
     */
    async searchPortfolios(keyword, filters = {}) {
        const portfolioSearchParams = new URLSearchParams({ q: keyword, ...filters });
        return this.request(`search/portfolios?${portfolioSearchParams}`);
    }

    /**
     * 搜尋使用者
     */
    async searchUsers(keyword, filters = {}) {
        const userSearchParams = new URLSearchParams({ q: keyword, ...filters });
        return this.request(`search/users?${userSearchParams}`);
    }

    /**
     * 取得分析資料
     */
    async getAnalytics(type = 'trends') {
        return this.request(`analytics/${type}`);
    }

    /**
     * 取得職缺列表
     */
    async getJobs(filters = {}) {
        const jobQueryString = new URLSearchParams(filters).toString();
        const endpoint = jobQueryString ? `jobs?${jobQueryString}` : 'jobs';
        return this.request(endpoint);
    }

    /**
     * 取得評論
     */
    async getComments(portfolioId) {
        return this.request(`comments/portfolio/${portfolioId}`);
    }

    /**
     * 新增評論
     */
    async addComment(portfolioId, data) {
        return this.request(`comments/portfolio/${portfolioId}`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * 取得徽章
     */
    async getBadges(userId) {
        // 對應 PHP: api/student/badges.php?action=get&user_id=ID
        const params = new URLSearchParams({ action: 'get' });
        if (userId) params.set('user_id', userId);
        try {
            return await this.request(`student/badges.php?${params.toString()}`);
        } catch (e) {
            return { data: [] };
        }
    }

    /**
     * 讚作品
     */
    async likePortfolio(portfolioId) {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user.id;
            
            if (!userId) {
                throw new Error('使用者未登入');
            }
            
            const response = await fetch('/portfolio/api/student/portfolio.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': userId
                },
                body: JSON.stringify({
                    action: 'toggle_like',
                    portfolio_id: portfolioId
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            return {
                success: result.status === 200,
                message: result.message || '操作成功',
                data: result.data || { liked: true }
            };
        } catch (error) {
            console.error('讚作品失敗:', error);
            return {
                success: false,
                message: error.message || '操作失敗',
                data: null
            };
        }
    }

    /**
     * 登入
     */
    async login(credentials) {
        return this.request('auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }

    /**
     * 登出
     */
    async logout() {
        return this.request('auth/logout', {
            method: 'POST'
        });
    }

    /**
     * 註冊
     */
    async register(userData) {
        return this.request('auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }
}

    // 全域 API 服務實例
    let apiService = null;

    /**
     * 初始化 API 服務
     */
    function initializeApiService() {
        if (!apiService) {
            apiService = new ApiService();
            window.apiService = apiService;
            if (typeof debugLog === 'function') {
                debugLog('API 服務已初始化');
            }
        }
        return apiService;
    }

    // 將 API 服務暴露到全域
    window.ApiService = ApiService;
    window.initializeApiService = initializeApiService;

    // 立即初始化 API 服務（不等待 DOMContentLoaded）
    initializeApiService();

    // 也監聽 DOMContentLoaded 事件作為備用
    document.addEventListener('DOMContentLoaded', function() {
        if (!apiService) {
            initializeApiService();
        }
    });

    // 匯出 API 服務 (用於模組化)
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ApiService;
    }
}
