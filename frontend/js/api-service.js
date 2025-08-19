/**
 * Portfolio+ 統一 API 服務
 * 根據配置自動切換假資料和真實API
 */

class ApiService {
    constructor() {
        this.baseUrl = getApiBaseUrl();
        this.useMockData = isUsingMockData();
        this.mockDelay = getConfig('MOCK_API_DELAY');
    }

    /**
     * 通用請求方法
     */
    async request(endpoint, options = {}) {
        const url = this.useMockData ? endpoint : getApiUrl(endpoint);
        
        debugLog(`API 請求: ${endpoint}`, {
            useMockData: this.useMockData,
            url: url,
            method: options.method || 'GET'
        });

        try {
            // 如果是假資料模式，模擬延遲
            if (this.useMockData) {
                await mockApiDelay();
                return this.handleMockResponse(endpoint, options);
            }

            // 真實API請求
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

        debugLog(`處理假資料回應: ${method} ${endpoint}`);

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
        return this.request(`portfolios/author/${userId}`);
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
        return this.request(`stats/${type}`);
    }

    /**
     * 取得通知
     */
    async getNotifications(userId = null) {
        const endpoint = userId ? `notifications/user/${userId}` : 'notifications';
        return this.request(endpoint);
    }

    /**
     * 標記通知為已讀
     */
    async markNotificationAsRead(notificationId) {
        return this.request(`notifications/${notificationId}/read`, {
            method: 'PUT'
        });
    }

    /**
     * 取得活動記錄
     */
    async getActivities(userId = null) {
        const endpoint = userId ? `activities/user/${userId}` : 'activities';
        return this.request(endpoint);
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
        return this.request(`badges/user/${userId}`);
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

// 建立全域 API 服務實例
const apiService = new ApiService();

// 將 API 服務暴露到全域
window.apiService = apiService;

// 匯出 API 服務 (用於模組化)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiService;
}
