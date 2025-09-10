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
        this.cache = new Map(); // API緩存
        this.pendingRequests = new Map(); // 去重機制
        this.cacheExpiry = 5 * 60 * 1000; // 5分鐘緩存過期
        this.apiVersion = 'v1'; // API版本
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
     * 取得完整的 API URL（支援版本控制）
     */
    getApiUrl(endpoint) {
        if (typeof getApiUrl === 'function') {
            return getApiUrl(endpoint);
        }
        
        const baseUrl = this.baseUrl;
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
        
        // 如果endpoint已經包含版本，直接使用
        if (cleanEndpoint.includes('/v1/') || cleanEndpoint.includes('/v2/')) {
            return `${baseUrl}/${cleanEndpoint}`;
        }
        
        // 否則添加版本前綴
        return `${baseUrl}/${this.apiVersion}/${cleanEndpoint}`;
    }
    
    /**
     * 設置API版本
     */
    setApiVersion(version) {
        this.apiVersion = version;
        // 清除緩存，因為不同版本的API可能有不同的回應格式
        this.clearCache();
    }
    
    /**
     * 獲取當前API版本
     */
    getApiVersion() {
        return this.apiVersion;
    }

    /**
     * 統一錯誤處理
     */
    handleApiError(error, context = '') {
        console.error(`API錯誤 ${context}:`, error);
        
        let message = '操作失敗，請稍後重試';
        let code = 'UNKNOWN_ERROR';
        
        if (error.status) {
            switch (error.status) {
                case 400:
                    message = '請求參數錯誤';
                    code = 'BAD_REQUEST';
                    break;
                case 401:
                    message = '請先登入';
                    code = 'UNAUTHORIZED';
                    break;
                case 403:
                    message = '權限不足';
                    code = 'FORBIDDEN';
                    break;
                case 404:
                    message = '找不到請求的資源';
                    code = 'NOT_FOUND';
                    break;
                case 500:
                    message = '伺服器錯誤，請稍後重試';
                    code = 'SERVER_ERROR';
                    break;
                default:
                    message = error.message || message;
                    code = `HTTP_${error.status}`;
            }
        } else if (error.code === 'TIMEOUT') {
            message = '請求逾時，請檢查網路連接';
            code = 'TIMEOUT';
        } else if (error.message) {
            message = error.message;
            code = 'API_ERROR';
        }
        
        return {
            success: false,
            message,
            code,
            originalError: error
        };
    }

    /**
     * 生成緩存鍵
     */
    generateCacheKey(endpoint, options = {}) {
        const method = options.method || 'GET';
        const body = options.body ? JSON.stringify(options.body) : '';
        return `${method}:${endpoint}:${body}`;
    }
    
    /**
     * 檢查緩存是否有效
     */
    isCacheValid(cacheEntry) {
        return cacheEntry && (Date.now() - cacheEntry.timestamp) < this.cacheExpiry;
    }
    
    /**
     * 設置緩存
     */
    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }
    
    /**
     * 獲取緩存
     */
    getCache(key) {
        const cacheEntry = this.cache.get(key);
        if (this.isCacheValid(cacheEntry)) {
            return cacheEntry.data;
        }
        return null;
    }
    
    /**
     * 清除緩存
     */
    clearCache(pattern = null) {
        if (pattern) {
            for (const key of this.cache.keys()) {
                if (key.includes(pattern)) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
    }
    
    /**
     * 請求去重機制
     */
    async deduplicateRequest(cacheKey, requestFn) {
        // 如果已經有相同的請求在進行中，等待它完成
        if (this.pendingRequests.has(cacheKey)) {
            return await this.pendingRequests.get(cacheKey);
        }
        
        // 創建新的請求Promise
        const requestPromise = requestFn();
        this.pendingRequests.set(cacheKey, requestPromise);
        
        try {
            const result = await requestPromise;
            return result;
        } finally {
            // 請求完成後移除
            this.pendingRequests.delete(cacheKey);
        }
    }
    
    /**
     * 通用請求方法（支援緩存和去重）
     */
    async request(endpoint, options = {}) {
        const method = options.method || 'GET';
        const cacheKey = this.generateCacheKey(endpoint, options);
        
        // GET請求嘗試從緩存獲取
        if (method === 'GET') {
            const cachedData = this.getCache(cacheKey);
            if (cachedData) {
                if (typeof debugLog === 'function') {
                    debugLog(`API 緩存命中: ${endpoint}`);
                }
                return cachedData;
            }
        }
        
        // 使用去重機制
        return await this.deduplicateRequest(cacheKey, async () => {
            const result = await this.performRequest(endpoint, options);
            
            // GET請求成功後緩存結果
            if (method === 'GET' && result && result.status === 200) {
                this.setCache(cacheKey, result);
            }
            
            return result;
        });
    }
    
    /**
     * 執行實際的HTTP請求
     */
    async performRequest(endpoint, options = {}) {
        const url = this.useMockData ? endpoint : this.getApiUrl(endpoint);

        if (typeof debugLog === 'function') {
            debugLog(`API 請求: ${endpoint}`, {
                useMockData: this.useMockData,
                url: url,
                method: options.method || 'GET'
            });
        }

        try {
            // 假資料模式
            if (this.useMockData) {
                if (typeof mockApiDelay === 'function') {
                    await mockApiDelay();
                }
                return this.handleMockResponse(endpoint, options);
            }

            // 逾時控制（預設 15 秒，可由 options.timeout 覆蓋）
            const controller = new AbortController();
            const timeoutMs = typeof options.timeout === 'number' ? options.timeout : 15000;
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const token = localStorage.getItem('auth_token');
            
            const headers = {
                'Content-Type': 'application/json',
                'Accept': `application/vnd.portfolio.${this.apiVersion}+json`,
                ...(user?.id ? { 'X-User-ID': user.id } : {}),
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...options.headers
            };

            const response = await fetch(url, {
                headers,
                signal: controller.signal,
                ...options
            });
            clearTimeout(timeoutId);

            const contentType = response.headers.get('content-type') || '';

            if (!response.ok) {
                let serverMessage = '';
                try {
                    if (contentType.includes('application/json')) {
                        const errJson = await response.json();
                        serverMessage = errJson?.message || errJson?.error || '';
                    } else {
                        const text = await response.text();
                        serverMessage = (text || '').slice(0, 200);
                    }
                } catch (_) {
                    // 忽略解析錯誤
                }
                const err = new Error(serverMessage || `HTTP ${response.status}`);
                err.status = response.status;
                err.endpoint = endpoint;
                throw err;
            }

            if (!contentType.includes('application/json')) {
                const text = await response.text();
                console.error('非 JSON 回應，內容預覽:', text.slice(0, 200));
                const err = new Error('Response is not JSON');
                err.status = response.status;
                err.endpoint = endpoint;
                throw err;
            }

            return await response.json();
        } catch (error) {
            // 統一補充錯誤上下文
            if (error.name === 'AbortError') {
                const abortErr = new Error('請求逾時，請稍後重試');
                abortErr.code = 'TIMEOUT';
                abortErr.endpoint = endpoint;
                throw abortErr;
            }
            
            // 使用統一的錯誤處理
            const handledError = this.handleApiError(error, `請求 ${endpoint}`);
            throw handledError;
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
        try {
            const params = new URLSearchParams({ action: 'get' });
            if (userId) params.set('user_id', userId);
            const result = await this.request(`student/notifications.php?${params.toString()}`);
            
            // 標準化數據格式
            if (result && result.status === 200) {
                return {
                    success: true,
                    data: Array.isArray(result.data) ? result.data : [],
                    message: result.message || 'success'
                };
            }
            return { success: false, data: [], message: result?.message || '載入通知失敗' };
        } catch (error) {
            console.error('載入通知失敗:', error);
            return { success: false, data: [], message: error.message || '載入通知失敗' };
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
        try {
            const params = new URLSearchParams({ action: 'get' });
            if (userId) params.set('user_id', userId);
            const result = await this.request(`student/activities.php?${params.toString()}`);
            
            // 標準化數據格式 - 處理多種可能的返回結構
            let activities = [];
            if (result && result.status === 200) {
                if (Array.isArray(result.data)) {
                    activities = result.data;
                } else if (Array.isArray(result.data?.activities)) {
                    activities = result.data.activities;
                } else if (Array.isArray(result.activities)) {
                    activities = result.activities;
                }
            }
            
            return {
                success: true,
                data: activities,
                message: result?.message || 'success'
            };
        } catch (error) {
            console.error('載入活動記錄失敗:', error);
            return { success: false, data: [], message: error.message || '載入活動記錄失敗' };
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
        try {
            const params = new URLSearchParams({ action: 'get' });
            if (userId) params.set('user_id', userId);
            const result = await this.request(`student/badges.php?${params.toString()}`);
            
            // 標準化數據格式
            let badges = [];
            if (result && result.status === 200) {
                if (Array.isArray(result.data)) {
                    badges = result.data;
                } else if (Array.isArray(result.data?.badges)) {
                    badges = result.data.badges;
                } else if (Array.isArray(result.badges)) {
                    badges = result.badges;
                }
            }
            
            return {
                success: true,
                data: badges,
                message: result?.message || 'success'
            };
        } catch (error) {
            console.error('載入徽章失敗:', error);
            return { success: false, data: [], message: error.message || '載入徽章失敗' };
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
        try {
            const result = await this.request('student/auth.php', {
                method: 'POST',
                body: JSON.stringify({ action: 'login', ...credentials })
            });
            
            if (result && result.status === 200 && result.data) {
                // 儲存用戶信息到 localStorage
                const userData = {
                    id: result.data.user_id,
                    username: result.data.username,
                    email: result.data.email,
                    role: result.data.role,
                    displayName: result.data.display_name,
                    avatar: result.data.avatar_url,
                    loginTime: new Date().toISOString()
                };
                
                localStorage.setItem('user', JSON.stringify(userData));
                
                // 儲存JWT Token
                if (result.data.token) {
                    localStorage.setItem('auth_token', result.data.token);
                } else {
                    localStorage.setItem('auth_token', 'session_based');
                }
                
                // 清除相關緩存
                this.clearCache();
                
                return {
                    success: true,
                    data: userData,
                    message: result.message || '登入成功'
                };
            }
            
            return {
                success: false,
                message: result?.message || '登入失敗'
            };
        } catch (error) {
            console.error('登入失敗:', error);
            return {
                success: false,
                message: error.message || '登入失敗，請檢查網路連接'
            };
        }
    }

    /**
     * 登出
     */
    async logout() {
        try {
            // 清除本地儲存的認證信息
            localStorage.removeItem('user');
            localStorage.removeItem('auth_token');
            
            // 嘗試通知後端登出
            try {
                await this.request('student/auth.php', {
                    method: 'POST',
                    body: JSON.stringify({ action: 'logout' })
                });
            } catch (error) {
                // 即使後端登出失敗，也要清除本地信息
                console.warn('後端登出失敗，但已清除本地認證信息:', error);
            }
            
            return {
                success: true,
                message: '登出成功'
            };
        } catch (error) {
            console.error('登出失敗:', error);
            return {
                success: false,
                message: error.message || '登出失敗'
            };
        }
    }

    /**
     * 檢查認證狀態
     */
    async checkAuthStatus() {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const token = localStorage.getItem('auth_token');
            
            if (!user.id || !token) {
                return {
                    success: false,
                    authenticated: false,
                    message: '未登入'
                };
            }
            
            // 檢查 token 是否過期（如果有 JWT）
            if (token !== 'session_based') {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    const now = Math.floor(Date.now() / 1000);
                    if (payload.exp && payload.exp < now) {
                        // Token 過期，清除本地信息
                        localStorage.removeItem('user');
                        localStorage.removeItem('auth_token');
                        return {
                            success: false,
                            authenticated: false,
                            message: '登入已過期，請重新登入'
                        };
                    }
                } catch (error) {
                    console.warn('解析 token 失敗:', error);
                }
            }
            
            // 嘗試向後端驗證
            try {
                const result = await this.request('student/auth.php?action=check');
                if (result && result.status === 200) {
                    return {
                        success: true,
                        authenticated: true,
                        data: user,
                        message: '認證有效'
                    };
                }
            } catch (error) {
                console.warn('後端認證檢查失敗:', error);
            }
            
            return {
                success: true,
                authenticated: true,
                data: user,
                message: '本地認證有效'
            };
        } catch (error) {
            console.error('檢查認證狀態失敗:', error);
            return {
                success: false,
                authenticated: false,
                message: '認證檢查失敗'
            };
        }
    }

    /**
     * 刷新JWT Token
     */
    async refreshToken() {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token || token === 'session_based') {
                return { success: false, message: '無Token可刷新' };
            }
            
            const result = await this.request('student/auth.php', {
                method: 'POST',
                body: JSON.stringify({ action: 'refresh', token })
            });
            
            if (result && result.status === 200 && result.data) {
                // 更新Token
                localStorage.setItem('auth_token', result.data.token);
                
                return {
                    success: true,
                    data: result.data,
                    message: result.message || 'Token刷新成功'
                };
            }
            
            return {
                success: false,
                message: result?.message || 'Token刷新失敗'
            };
        } catch (error) {
            console.error('Token刷新失敗:', error);
            return {
                success: false,
                message: error.message || 'Token刷新失敗'
            };
        }
    }
    getCurrentUser() {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            return user.id ? user : null;
        } catch (error) {
            console.error('取得用戶信息失敗:', error);
            return null;
        }
    }

    /**
     * 註冊
     */
    async register(userData) {
        return this.request('student/auth.php', {
            method: 'POST',
            body: JSON.stringify({ action: 'register', ...userData })
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
