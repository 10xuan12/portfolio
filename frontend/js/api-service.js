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

            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(user?.id ? { 'X-User-ID': user.id } : {}),
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
        // 支援兩種傳入：
        // 1) FormData（包含 files 與欄位）→ 先 create 再 upload_files
        // 2) 純物件（無檔案）→ 直接 create
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');

            // 解析資料
            let title, description, category, tags, status, files = [];
            if (data instanceof FormData) {
                title = data.get('title') || '';
                description = data.get('description') || '';
                category = data.get('category') || '';
                status = data.get('status') || 'draft';
                try {
                    const tagsRaw = data.get('tags');
                    tags = Array.isArray(tagsRaw) ? tagsRaw : JSON.parse(tagsRaw || '[]');
                } catch (_) {
                    tags = [];
                }
                // 收集檔案（files[0], files[1], ... 或 files）
                data.forEach((value, key) => {
                    if (key.startsWith('files') && value instanceof File) {
                        files.push(value);
                    }
                    if (key === 'files' && value instanceof File) {
                        files.push(value);
                    }
                });
            } else {
                ({ title = '', description = '', category = '', tags = [], status = 'draft' } = data || {});
            }

            // 第一步：建立作品（JSON）
            const createResp = await this.request('student/portfolio.php', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'create',
                    title,
                    description,
                    category,
                    tags: Array.isArray(tags) ? tags.join(',') : String(tags || ''),
                    status,
                    user_id: user?.id
                })
            });

            const createdOk = createResp && (createResp.status === 201 || createResp.status === 200);
            const portfolioId = createResp?.data?.portfolio_id || createResp?.portfolio_id;
            if (!createdOk || !portfolioId) {
                return { success: false, message: createResp?.message || '建立作品失敗' };
            }

            // 若沒有檔案，直接回傳
            if (!files || files.length === 0) {
                return { success: true, data: { portfolio_id: portfolioId } };
            }

            // 第二步：上傳檔案（multipart）
            const uploadForm = new FormData();
            uploadForm.append('action', 'upload_files');
            uploadForm.append('portfolio_id', portfolioId);
            files.forEach((f) => uploadForm.append('files[]', f));

            const uploadUrl = this.getApiUrl('student/portfolio.php');
            const uploadResp = await fetch(uploadUrl, { method: 'POST', body: uploadForm });
            if (!uploadResp.ok) {
                return { success: false, message: `檔案上傳失敗: ${uploadResp.status}` };
            }
            const uploadJson = await uploadResp.json();
            const uploadOk = uploadJson && (uploadJson.status === 200);
            if (!uploadOk) {
                return { success: false, message: uploadJson?.message || '檔案上傳失敗' };
            }

            return {
                success: true,
                data: { portfolio_id: portfolioId, uploaded_files: uploadJson?.data?.uploaded_files || [] }
            };
        } catch (e) {
            return { success: false, message: e.message };
        }
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
        try {
            if (type === 'student') {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const params = new URLSearchParams();
                if (user?.id) params.set('user_id', user.id);
                const result = await this.request(`student/stats.php?${params.toString()}`);
                return result?.data || result;
            }
            return this.request(`stats/${type}`);
        } catch (e) {
            return { total_portfolios: 0, total_views: 0, total_likes: 0, total_comments: 0 };
        }
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
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            return await this.request('student/notifications.php', {
                method: 'POST',
                body: JSON.stringify({ action: 'mark_read', notification_id: notificationId, user_id: user?.id })
            });
        } catch (e) {
            return { success: false };
        }
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
        // 後端無獨立 comments 端點，改取作品詳情中的 comments
        try {
            const detail = await this.request(`student/portfolio.php?action=get&portfolio_id=${portfolioId}`);
            const data = detail?.data || detail;
            const comments = Array.isArray(data?.comments) ? data.comments : [];
            return { success: true, data: comments };
        } catch (e) {
            return { success: false, message: e.message, data: [] };
        }
    }

    /**
     * 新增評論
     */
    async addComment(portfolioId, data) {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const result = await this.request('student/portfolio.php', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'add_comment',
                    portfolio_id: portfolioId,
                    comment_text: data?.content || data?.text || data?.comment || '' ,
                    user_id: user?.id
                })
            });
            return { success: result.status === 201 || result.status === 200, data: result.data, message: result.message };
        } catch (e) {
            return { success: false, message: e.message };
        }
    }

    /**
     * 更新學生個人資料（對應 student/profile.php?action=update）
     */
    async updateStudentProfile(profileData) {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const payload = { action: 'update', user_id: user?.id, ...profileData };
            const result = await this.request('student/profile.php', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            return { success: result.status === 200, data: result.data, message: result.message };
        } catch (e) {
            return { success: false, message: e.message };
        }
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
            
            const result = await this.request('student/portfolio.php', {
                method: 'POST',
                body: JSON.stringify({ action: 'toggle_like', portfolio_id: portfolioId, user_id: userId })
            });
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

    /**
     * 取得使用者設定
     */
    async getUserSettings() {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const params = new URLSearchParams({ action: 'get' });
            if (user.id) params.set('user_id', user.id);
            const result = await this.request(`student/settings.php?${params.toString()}`);
            const flat = result.data || result || {};
            const mapped = {
                account: {
                    displayName: '',
                    username: '',
                    bio: '',
                    language: flat.language || 'zh-TW',
                    timezone: flat.timezone || 'Asia/Taipei'
                },
                privacy: {
                    profileVisibility: (flat.public_profile ? 'public' : 'private'),
                    showProfile: flat.public_profile ?? true,
                    showStats: true,
                    allowComments: true,
                    searchIndex: false
                },
                notifications: {
                    emailNotifications: flat.email_notification ?? true,
                    portfolioInteractions: true,
                    enterpriseViews: true,
                    systemUpdates: false,
                    marketingMessages: false,
                    frequency: flat.notification_frequency || 'daily'
                },
                security: {
                    twoFactorAuth: flat.two_factor_auth ?? false,
                    lastPasswordChange: ''
                }
            };
            return { success: true, data: mapped };
        } catch (e) {
            return { success: false, message: e.message };
        }
    }

    /**
     * 更新使用者設定
     * scope: 'account' | 'privacy' | 'notifications' | 'all'
     */
    async updateUserSettings(scope, data) {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const payload = this.#buildSettingsPayload(scope, data, user?.id);
            const result = await this.request('student/settings.php', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            return { success: result.status === 200, data: result.data, message: result.message };
        } catch (e) {
            return { success: false, message: e.message };
        }
    }

    /**
     * 更新密碼
     */
    async updatePassword({ currentPassword, newPassword }) {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const result = await this.request('student/password.php', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'change_password',
                    current_password: currentPassword,
                    new_password: newPassword,
                    user_id: user?.id
                })
            });
            return { success: result.status === 200, data: result.data, message: result.message };
        } catch (e) {
            return { success: false, message: e.message };
        }
    }

    /**
     * 設定雙重認證（透過設定更新旗標）
     */
    async setupTwoFactorAuth() {
        try {
            return await this.updateUserSettings('privacy', { twoFactorAuth: true });
        } catch (e) {
            return { success: false, message: e.message };
        }
    }

    /**
     * 匯出使用者相關資料（彙整多端點）
     */
    async exportUserData() {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user?.id;
            const params = new URLSearchParams({ action: 'get' });
            if (userId) params.set('user_id', userId);

            const [profile, portfolios, activities, badges] = await Promise.all([
                this.request(`student/profile.php?${params.toString()}`),
                this.request(`student/portfolio.php?action=list&user_id=${userId || ''}`),
                this.request(`student/activities.php?${params.toString()}`),
                this.request(`student/badges.php?${params.toString()}`)
            ]);

            return {
                success: true,
                data: {
                    profile: profile?.data || profile,
                    portfolios: portfolios?.data || portfolios,
                    activities: activities?.data || activities,
                    badges: badges?.data || badges
                }
            };
        } catch (e) {
            return { success: false, message: e.message };
        }
    }

    /**
     * 停用帳號（尚未有後端端點，先回傳未實作）
     */
    async deactivateAccount() {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const result = await this.request('student/account.php', {
                method: 'POST',
                body: JSON.stringify({ action: 'deactivate', user_id: user?.id })
            });
            return { success: result.status === 200, data: result.data, message: result.message };
        } catch (e) {
            return { success: false, message: e.message };
        }
    }

    /**
     * 刪除帳號（尚未有後端端點，先回傳未實作）
     */
    async deleteAccount() {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const password = arguments?.[0]?.password || null;
            const result = await this.request('student/account.php', {
                method: 'POST',
                body: JSON.stringify({ action: 'delete', password, user_id: user?.id })
            });
            return { success: result.status === 200, data: result.data, message: result.message };
        } catch (e) {
            return { success: false, message: e.message };
        }
    }

    /**
     * 執行全站搜尋作品
     */
    async searchAllPortfolios(params) {
        const qs = typeof params === 'string' ? params : new URLSearchParams(params).toString();
        return this.request(`student/search.php?${qs}`);
    }

    // 內部：根據 scope 組成 settings.php 可接受的 payload
    #buildSettingsPayload(scope, data, userId) {
        const toBoolInt = (v) => (v ? 1 : 0);
        let email = null, pub = null, tfa = null;
        let language = undefined, timezone = undefined, notification_frequency = undefined;

        if (scope === 'all') {
            // 期望 settings.js 的資料結構
            email = data?.notifications?.emailNotifications;
            pub = data?.privacy?.showProfile ?? data?.privacy?.profileVisibility === 'public';
            tfa = data?.security?.twoFactorAuth;
            language = data?.account?.language;
            timezone = data?.account?.timezone;
            notification_frequency = data?.notifications?.frequency;
        } else if (scope === 'privacy') {
            email = undefined;
            pub = data?.showProfile ?? data?.profileVisibility === 'public';
            tfa = data?.twoFactorAuth;
        } else if (scope === 'notifications') {
            email = data?.emailNotifications;
            notification_frequency = data?.frequency;
        } else if (scope === 'account') {
            // 帳號資料與 settings.php 無強耦合，先僅回存公開狀態
            pub = data?.showProfile ?? undefined;
            language = data?.language;
            timezone = data?.timezone;
        }

        const payload = { action: 'update_settings' };
        if (userId) payload.user_id = userId;
        if (email !== null && email !== undefined) payload.email_notification = toBoolInt(!!email);
        if (pub !== null && pub !== undefined) payload.public_profile = toBoolInt(!!pub);
        if (tfa !== null && tfa !== undefined) payload.two_factor_auth = toBoolInt(!!tfa);
        if (language !== undefined) payload.language = language;
        if (timezone !== undefined) payload.timezone = timezone;
        if (notification_frequency !== undefined) payload.notification_frequency = notification_frequency;
        return payload;
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
