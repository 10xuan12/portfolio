/**
 * 學生作品詳情 JavaScript
 * 包含讚、分享、評論、下載等功能
 */

// 作品詳情資料結構
let portfolioDetail = {
    id: null,
    title: '',
    description: '',
    category: '',
    status: '',
    tags: [],
    image: '',
    url: '',
    github: '',
    views: 0,
    likes: 0,
    comments: [],
    downloads: 0,
    created_at: '',
    author: {
        name: '',
        department: '',
        grade: '',
        email: '',
        github: '',
        linkedin: ''
    },
    files: [],
    isLiked: false
};

// 回覆目標的父留言 ID（無則為 null）
let selectedParentCommentId = null;

// 切換作品狀態
async function togglePortfolioStatus() {
    try {
        // 從 localStorage 獲取使用者資訊
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) {
            throw new Error('無法獲取使用者資訊');
        }
        
        // 決定新狀態
        const currentStatus = portfolioDetail.status;
        let newStatus;
        let confirmMessage;
        
        if (currentStatus === 'draft') {
            newStatus = 'published';
            confirmMessage = '確定要發布此作品嗎？發布後其他使用者將可以看到您的作品。';
        } else if (currentStatus === 'published') {
            newStatus = 'draft';
            confirmMessage = '確定要將此作品改為草稿嗎？改為草稿後其他使用者將無法看到您的作品。';
        } else {
            // 如果是 review 狀態，不允許切換
            Utils.showNotification('審核中的作品無法修改狀態', 'warning');
            return;
        }
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        // 發送狀態切換請求
        const svc = window.apiService || window.initializeApiService?.();
        const result = await svc.request('student/portfolio.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'toggle_status',
                id: portfolioDetail.id,
                status: newStatus,
                user_id: user.id
            })
        });
        
        if (result.status === 200 || result.success) {
            // 更新本地狀態
            portfolioDetail.status = newStatus;
            
            // 更新顯示
            updatePortfolioDisplay();
            
            const statusText = newStatus === 'published' ? '已發布' : '草稿';
            Utils.showNotification(`作品狀態已更新為：${statusText}`, 'success');
        } else {
            throw new Error(result.message || '狀態更新失敗');
        }
        
    } catch (error) {
        console.error('切換作品狀態失敗:', error);
        Utils.showNotification('狀態更新失敗，請稍後再試', 'error');
    }
}

// 立即將函數暴露到全域，確保可用
window.togglePortfolioStatus = togglePortfolioStatus;
console.log('togglePortfolioStatus 函數已定義並暴露到全域');

// 初始化頁面
document.addEventListener('DOMContentLoaded', function() {
    // 避免重複初始化
    if (window.__portfolioDetailInitialized) return;
    window.__portfolioDetailInitialized = true;
    
    // 綁定返回按鈕事件
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('返回按鈕被點擊');
            goBack();
        });
        console.log('返回按鈕事件已綁定');
    } else {
        console.error('找不到返回按鈕元素');
    }
    
    // 依登入角色設定評論頭像
    try {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        const avatarImg = document.getElementById('myAvatar');
        if (avatarImg && user && user.id) {
            let avatarUrl = '';
            if (user.role === 'student') {
                avatarUrl = user.avatar || user.avatar_url || '';
            } else if (user.role === 'enterprise') {
                avatarUrl = user.avatar || user.logo_url || '';
            } else if (user.role === 'admin') {
                avatarUrl = user.avatar || '';
            }
            if (avatarUrl) {
                avatarImg.src = avatarUrl;
            } else {
                const initial = (user.displayName || user.username || user.email || '用').trim().charAt(0);
                avatarImg.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(initial)}`;
            }
        }
    } catch (_) {}
    loadPortfolioDetail();
    initEventListeners();
});

function getCurrentPortfolioId() {
    let pid = null;
    try { pid = new URLSearchParams(window.location.search).get('id'); } catch (_) {}
    if (!pid || pid === 'null' || pid === 'undefined') {
        try { pid = sessionStorage.getItem('currentPortfolioId'); } catch (_) {}
    }
    const n = Number(pid);
    return Number.isFinite(n) && n > 0 ? n : null;
}

// 載入作品詳情
async function loadPortfolioDetail() {
    try {
        // 從 URL 參數獲取作品 ID
        const portfolioId = getCurrentPortfolioId();
        
        if (!portfolioId) {
            throw new Error('未找到作品 ID');
        }
        // 記住目前查看的作品 ID 作為後備
        try { sessionStorage.setItem('currentPortfolioId', String(portfolioId)); } catch (_) {}
        
        // 從 localStorage 獲取使用者資訊
        const user = JSON.parse(localStorage.getItem('user'));
        const userId = user ? user.id : null;
        
        // 從後端 API 載入作品詳情（統一透過 ApiService）
        const svc = window.apiService || window.initializeApiService?.();
        const url = `student/portfolio.php?action=get&portfolio_id=${portfolioId}${userId ? `&user_id=${userId}` : ''}`;
        const result = await svc.request(url);
        
        if ((result.status === 200 || result.success) && (result.data || result)) {
            const data = result.data || result;
            portfolioDetail = {
                ...data,
                views: (data.views ?? data.view_count ?? 0) | 0,
                likes: (data.likes ?? data.like_count ?? 0) | 0,
                downloads: (data.downloads ?? data.download_count ?? 0) | 0,
            };
            // 強制確保 id 與 URL 參數一致
            portfolioDetail.id = Number(portfolioId);
            // 同步全域供其他函數使用
            try { sessionStorage.setItem('currentPortfolioId', String(portfolioDetail.id)); } catch (_) {}
            // 暴露全域以利除錯與其他腳本取用
            window.portfolioDetail = portfolioDetail;
            updatePortfolioDisplay();
            updateCommentsDisplay();
            // 詳情成功後再載入相關作品，避免 portfolio_id=null
            loadRelatedWorks();
        } else {
            throw new Error(result.message || '載入作品詳情失敗');
        }
        
    } catch (error) {
        console.error('載入作品詳情失敗:', error);
        Utils.showNotification('載入作品詳情失敗，請稍後再試', 'error');
    }
}

// 初始化事件監聽器
function initEventListeners() {
    // 評論表單提交
    document.getElementById('commentInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            submitComment();
        }
    });
}

// 更新作品顯示
function updatePortfolioDisplay() {
    // 標題/描述
    document.querySelector('.hero-title').textContent = portfolioDetail.title || '';
    document.querySelector('.info-title h1').textContent = portfolioDetail.title || '';
    document.querySelector('.info-title p').textContent = portfolioDetail.description || '';
    const coverEl = document.getElementById('heroCover');
    if (coverEl) coverEl.src = portfolioDetail.cover_image || '';
    const heroMeta = document.getElementById('heroMeta');
    if (heroMeta) {
        heroMeta.innerHTML = `
            <span><i class="fas fa-user"></i> ${portfolioDetail.author_name || ''}</span>
            <span><i class="fas fa-calendar"></i> ${(portfolioDetail.published_at || portfolioDetail.created_at || '').toString().slice(0,10)}</span>
            <span><i class="fas fa-eye"></i> ${(portfolioDetail.views ?? portfolioDetail.view_count ?? 0) | 0} 次瀏覽</span>
        `;
    }
    const statusEl = document.getElementById('detailStatus');
    if (statusEl) {
        statusEl.className = `info-status clickable status-${portfolioDetail.status}`;
        statusEl.textContent = portfolioDetail.status === 'published' ? '已發布' : (portfolioDetail.status === 'review' ? '審核中' : '草稿');
        statusEl.title = '點擊切換狀態';
    }

    // 統計
    const views = (portfolioDetail.views ?? portfolioDetail.view_count ?? 0) | 0;
    const likes = (portfolioDetail.likes ?? portfolioDetail.like_count ?? 0) | 0;
    const downloads = (portfolioDetail.downloads ?? portfolioDetail.download_count ?? 0) | 0;
    const sv = document.getElementById('statViews'); if (sv) sv.textContent = `${views} 次瀏覽`;
    const sl = document.getElementById('statLikes'); if (sl) sl.textContent = `${likes} 個讚`;
    const commentCount = portfolioDetail.comment_count || (Array.isArray(portfolioDetail.comments) ? portfolioDetail.comments.length : 0);
    const sc = document.getElementById('statComments'); if (sc) sc.textContent = `${commentCount} 則評論`;
    const sd = document.getElementById('statDownloads'); if (sd) sd.textContent = `${downloads} 次下載`;

    // 內容
    const contentEl = document.getElementById('detailContent');
    if (contentEl) contentEl.innerHTML = portfolioDetail.content || '';

    // 標籤
    const tagsContainer = document.querySelector('.portfolio-tags');
    tagsContainer.innerHTML = (portfolioDetail.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('');

    // 作品連結
    const portfolioUrl = portfolioDetail.url || portfolioDetail.portfolio_url;
    
    // 尋找適當的插入位置（在作品檔案區域或內容區域之後）
    const portfolioFilesSection = document.querySelector('.portfolio-files');
    const portfolioContentSection = document.querySelector('.portfolio-content') || document.querySelector('.info-content');
    const insertBeforeElement = portfolioFilesSection || portfolioContentSection;
    const parentElement = insertBeforeElement?.parentNode;
    
    if (portfolioUrl && portfolioUrl.trim()) {
        // 檢查是否已經有連結顯示區域
        let urlSection = document.getElementById('portfolioUrlSection');
        if (!urlSection && parentElement) {
            urlSection = document.createElement('div');
            urlSection.id = 'portfolioUrlSection';
            urlSection.className = 'portfolio-url-section';
            urlSection.style.cssText = 'margin: 2rem 0; padding: 1.5rem; background: #f7fafc; border-radius: 8px;';
            urlSection.innerHTML = `
                <h3 class="files-title" style="margin: 0 0 1rem 0; font-size: 1.25rem; font-weight: 600; color: #2d3748;">作品連結</h3>
                <div class="portfolio-url-item">
                    <a href="${portfolioUrl}" target="_blank" rel="noopener noreferrer" class="portfolio-url-link" style="display: inline-flex; align-items: center; gap: 0.5rem; color: #667eea; text-decoration: none; word-break: break-all; font-weight: 500;">
                        <i class="fas fa-external-link-alt"></i>
                        <span>${portfolioUrl}</span>
                    </a>
                </div>
            `;
            
            // 插入連結區域
            if (insertBeforeElement) {
                parentElement.insertBefore(urlSection, insertBeforeElement);
            } else if (parentElement) {
                parentElement.appendChild(urlSection);
            }
        } else if (urlSection) {
            // 更新現有的連結區域
            const linkElement = urlSection.querySelector('.portfolio-url-link');
            const linkSpan = urlSection.querySelector('.portfolio-url-link span');
            if (linkElement) {
                linkElement.href = portfolioUrl;
                if (linkSpan) {
                    linkSpan.textContent = portfolioUrl;
                }
            }
            // 確保連結區域可見
            urlSection.style.display = 'block';
        }
    } else {
        // 如果沒有連結，移除連結區域
        const urlSection = document.getElementById('portfolioUrlSection');
        if (urlSection) {
            urlSection.remove();
        }
    }
    
    // 檔案
    const fileList = document.getElementById('fileList');
    if (fileList && Array.isArray(portfolioDetail.files)) {
        fileList.innerHTML = portfolioDetail.files.map((f, index) => {
            const fileName = f.file_name || '';
            const fileSize = f.file_size || 0;
            const fileExtension = fileName.split('.').pop().toLowerCase();
            const fileIcon = getFileIconByExtension(fileExtension);
            const canPreview = canPreviewFile(fileExtension);
            
            return `
            <div class="file-item">
                <div class="file-icon"><i class="${fileIcon}"></i></div>
                <div class="file-info">
                    <div class="file-name">${fileName}</div>
                    <div class="file-size">${formatFileSize(fileSize)}</div>
                </div>
                <div class="file-actions">
                    ${canPreview ? `
                    <button class="file-preview-btn" onclick="previewPortfolioFile('${fileName.replace(/'/g, "\\'")}', ${index})" title="預覽文件">
                        <i class="fas fa-eye"></i>
                    </button>
                    ` : ''}
                    <button class="file-download" onclick="downloadFile('${fileName.replace(/'/g, "\\'")}')" title="下載文件">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            </div>
        `;
        }).join('');
    }

    // 作者卡片
    try {
        const authorNameEl = document.getElementById('authorName');
        const authorMetaEl = document.getElementById('authorMeta');
        const authorAvatarEl = document.getElementById('authorAvatar');
        const authorPortfoliosEl = document.getElementById('authorPortfolios');
        const authorViewsEl = document.getElementById('authorViews');

        if (authorNameEl) authorNameEl.textContent = portfolioDetail.author_name || portfolioDetail.author?.name || '';
        if (authorMetaEl) authorMetaEl.textContent = [portfolioDetail.major || portfolioDetail.author?.department || '', portfolioDetail.grade || portfolioDetail.author?.grade || ''].filter(Boolean).join(' · ');
        if (authorAvatarEl) {
            // 若無頭像，用文字頭像占位
            const initial = (portfolioDetail.author_name || '').trim().charAt(0) || '用';
            if (portfolioDetail.author_avatar) {
                authorAvatarEl.src = portfolioDetail.author_avatar;
                authorAvatarEl.alt = initial;
            } else {
                authorAvatarEl.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(initial)}`;
                authorAvatarEl.alt = initial;
            }
        }
        if (authorPortfoliosEl) authorPortfoliosEl.textContent = `${portfolioDetail.author_portfolio_count ?? ''}`.trim() ? `${portfolioDetail.author_portfolio_count} 個作品` : '';
        if (authorViewsEl) authorViewsEl.textContent = `${portfolioDetail.author_total_views ?? ''}`.trim() ? `${portfolioDetail.author_total_views} 次總瀏覽` : '';
        const authorCard = document.getElementById('authorCard');
        if (authorCard) authorCard.dataset.authorId = portfolioDetail.author_id || '';
    } catch (_) {}

    // 讚按鈕狀態
    updateLikeButton();
}

// 更新評論顯示
// 顯示用的評論分頁狀態（僅限根評論，子回覆照常一併呈現）
let displayedRootCommentsCount = 5;
const rootCommentsStepSize = 5;

function updateCommentsDisplay() {
    const commentsList = document.getElementById('commentsList');

    // 正規化資料（兼容後端不同欄位命名）
    const normalize = (c) => ({
        id: c.id,
        parent_id: c.parent_id ?? null,
        author: c.author || c.author_name || c.user_name || '使用者',
        avatar: c.avatar || c.avatar_url || (c.author ? c.author.charAt(0) : '用'),
        text: c.text || c.content || '',
        likes: c.likes ?? c.like_count ?? 0,
        time: c.time || c.created_at || ''
    });

    const flat = Array.isArray(portfolioDetail.comments) ? portfolioDetail.comments.map(normalize) : [];

    // 建立樹狀結構
    const idToNode = new Map();
    const roots = [];
    flat.forEach(c => {
        idToNode.set(c.id, { ...c, children: [] });
    });
    idToNode.forEach(node => {
        if (node.parent_id && idToNode.has(node.parent_id)) {
            idToNode.get(node.parent_id).children.push(node);
        } else {
            roots.push(node);
        }
    });

    const renderNode = (node, depth) => {
        const indent = depth * 16; // px
        const isReplying = selectedParentCommentId === node.id;
        return `
        <div class="comment-item" style="margin-left: ${indent}px;">
            <div class="comment-avatar">${node.avatar || ''}</div>
            <div class="comment-content">
                <div class="comment-header">
                    <span class="comment-author">${escapeHtml(node.author)}</span>
                    <span class="comment-time">${escapeHtml(String(node.time || ''))}</span>
                </div>
                <div class="comment-text">${escapeHtml(node.text)}</div>
                <div class="comment-actions">
                    <button class="comment-action" onclick="likeComment(${node.id})">
                        <i class="fas fa-thumbs-up"></i> 讚 (${node.likes})
                    </button>
                    <button class="comment-action" onclick="replyComment(${node.id})">
                        <i class="fas fa-reply"></i> 回覆
                    </button>
                    ${isReplying ? `<button class="comment-action" onclick="cancelReply()"><i class=\"fas fa-times\"></i> 取消回覆</button>` : ''}
                </div>
            </div>
        </div>
        ${node.children.map(child => renderNode(child, depth + 1)).join('')}
        `;
    };

    // 根評論使用分頁顯示
    const visibleRoots = roots.slice(0, displayedRootCommentsCount);
    commentsList.innerHTML = visibleRoots.map(n => renderNode(n, 0)).join('');

    // 控制「載入更多」按鈕顯示狀態
    const loadMoreBtn = document.querySelector('.load-more-comments button');
    if (loadMoreBtn) {
        if (roots.length > displayedRootCommentsCount) {
            loadMoreBtn.style.display = '';
        } else {
            loadMoreBtn.style.display = 'none';
        }
    }
}

// 供 HTML onclick 使用
function loadMoreComments() {
    displayedRootCommentsCount += rootCommentsStepSize;
    updateCommentsDisplay();
}

// 讚作品
async function likePortfolio() {
    try {
        // 從 localStorage 獲取使用者資訊
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) {
            throw new Error('無法獲取使用者資訊');
        }
        
        // 發送讚請求（統一透過 ApiService）
        const svc = window.apiService || window.initializeApiService?.();
        const result = await svc.request('student/portfolio.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'toggle_like',
                portfolio_id: portfolioDetail.id,
                user_id: user.id
            })
        });
        
        if (result.status === 200 || result.success) {
            // 以後端回傳為準，避免本地推測不一致
            const payload = result.data || result;
            const likedNow = typeof payload.liked !== 'undefined' ? !!payload.liked : !portfolioDetail.isLiked;
            const likeCountNow = (payload.like_count ?? payload.likes ?? portfolioDetail.likes ?? 0) | 0;

            portfolioDetail.isLiked = likedNow;
            portfolioDetail.likes = likeCountNow;

            updateLikeButton();
            updatePortfolioDisplay();

            Utils.showNotification(likedNow ? '已讚作品' : '已取消讚', 'success');
        } else {
            throw new Error(result.message || '操作失敗');
        }
        
    } catch (error) {
        Utils.showNotification('操作失敗，請稍後再試', 'error');
        console.error('讚作品錯誤:', error);
    }
}

// 更新讚按鈕狀態
function updateLikeButton() {
    const likeBtn = document.querySelector('.action-btn.primary');
    if (!likeBtn) {
        return; // 頁面可能沒有這個按鈕，直接略過
    }
    const icon = likeBtn.querySelector('i');
    if (!icon) {
        return;
    }
    
    if (portfolioDetail.isLiked) {
        icon.style.color = '#e53e3e';
        likeBtn.style.background = '#fed7d7';
        likeBtn.style.color = '#e53e3e';
    } else {
        icon.style.color = '';
        likeBtn.style.background = '';
        likeBtn.style.color = '';
    }
}

// 分享作品
function sharePortfolio() {
    const shareData = {
        title: portfolioDetail.title,
        text: portfolioDetail.description,
        url: window.location.href
    };
    
    if (navigator.share) {
        navigator.share(shareData);
    } else {
        // 複製連結到剪貼簿
        copyLink();
    }
}

// 編輯作品
function editPortfolio() {
    // 跳轉到編輯頁面
    window.location.href = `portfolio.html?edit=${portfolioDetail.id}`;
}

// 刪除作品
async function deletePortfolio() {
    if (confirm('確定要刪除此作品嗎？此操作無法復原。')) {
        try {
            // 從 localStorage 獲取使用者資訊
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.id) {
                throw new Error('無法獲取使用者資訊');
            }
            
            // 發送刪除請求（統一透過 ApiService）
            const svc = window.apiService || window.initializeApiService?.();
            const result = await svc.request('student/portfolio.php', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'delete',
                    portfolio_id: portfolioDetail.id,
                    user_id: user.id
                })
            });
            
            if (result.status === 200 || result.success) {
                Utils.showNotification('作品已刪除', 'success');
                
                // 跳轉回作品集頁面
                setTimeout(() => {
                    window.location.href = 'portfolio.html';
                }, 1500);
            } else {
                throw new Error(result.message || '刪除失敗');
            }
            
        } catch (error) {
            console.error('刪除作品錯誤:', error);
            Utils.showNotification('刪除失敗，請稍後再試', 'error');
        }
    }
}

// 根據文件擴展名獲取圖標
function getFileIconByExtension(extension) {
    const iconMap = {
        'pdf': 'fas fa-file-pdf',
        'jpg': 'fas fa-file-image',
        'jpeg': 'fas fa-file-image',
        'png': 'fas fa-file-image',
        'gif': 'fas fa-file-image',
        'svg': 'fas fa-file-image',
        'webp': 'fas fa-file-image',
        'txt': 'fas fa-file-alt',
        'md': 'fas fa-file-alt',
        'doc': 'fas fa-file-word',
        'docx': 'fas fa-file-word',
        'xls': 'fas fa-file-excel',
        'xlsx': 'fas fa-file-excel',
        'ppt': 'fas fa-file-powerpoint',
        'pptx': 'fas fa-file-powerpoint',
        'zip': 'fas fa-file-archive',
        'rar': 'fas fa-file-archive',
        '7z': 'fas fa-file-archive',
        'mp4': 'fas fa-file-video',
        'avi': 'fas fa-file-video',
        'mov': 'fas fa-file-video',
        'mp3': 'fas fa-file-audio',
        'wav': 'fas fa-file-audio',
        'js': 'fas fa-file-code',
        'html': 'fas fa-file-code',
        'css': 'fas fa-file-code',
        'json': 'fas fa-file-code',
        'xml': 'fas fa-file-code'
    };
    return iconMap[extension] || 'fas fa-file';
}

// 檢查文件是否可以預覽
function canPreviewFile(extension) {
    const previewableExtensions = [
        'pdf', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', // 圖片和 PDF
        'txt', 'md', 'json', 'xml', 'csv', 'log', 'ini', 'conf', 'config', // 文字檔
        'js', 'jsx', 'ts', 'tsx', 'html', 'htm', 'css', 'scss', 'sass', 'less', // 程式碼
        'php', 'py', 'java', 'cpp', 'c', 'h', 'hpp', 'cs', 'go', 'rs', 'rb', // 程式碼
        'swift', 'kt', 'dart', 'sql', 'sh', 'bash', 'yaml', 'yml', 'toml', // 程式碼
        'mp4', 'avi', 'mov', 'wmv', 'webm', // 影片
        'mp3', 'wav', 'flac', 'aac', 'ogg' // 音頻
    ];
    return previewableExtensions.includes(extension);
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 預覽作品文件
async function previewPortfolioFile(filename, fileIndex) {
    try {
        const modal = document.getElementById('filePreviewModal');
        const modalTitle = document.getElementById('previewModalTitle');
        const modalBody = document.getElementById('previewModalBody');
        
        if (!modal || !modalTitle || !modalBody) {
            Utils.showNotification('預覽功能初始化失敗', 'error');
            return;
        }
        
        // 設置標題
        modalTitle.textContent = filename;
        
        // 顯示模態框
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // 顯示載入中
        modalBody.innerHTML = '<div class="preview-loading"><i class="fas fa-spinner fa-spin"></i> 載入中...</div>';
        
        // 獲取文件 URL
        const svc = window.apiService || window.initializeApiService?.();
        const result = await svc.request('student/portfolio.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'get_file_url',
                portfolio_id: portfolioDetail.id,
                filename: filename
            })
        });
        
        if ((result.status === 200 || result.success) && result.data && result.data.file_url) {
            const fileUrl = result.data.file_url;
            const fileExtension = filename.split('.').pop().toLowerCase();
            
            // 根據文件類型顯示預覽
            if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(fileExtension)) {
                previewImageFromUrl(fileUrl, filename, modalBody);
            } else if (fileExtension === 'pdf') {
                previewPDFFromUrl(fileUrl, filename, modalBody);
            } else if (['txt', 'md', 'json', 'xml', 'csv', 'log', 'ini', 'conf', 'config'].includes(fileExtension) ||
                       ['js', 'jsx', 'ts', 'tsx', 'html', 'htm', 'css', 'scss', 'sass', 'less',
                        'php', 'py', 'java', 'cpp', 'c', 'h', 'hpp', 'cs', 'go', 'rs', 'rb',
                        'swift', 'kt', 'dart', 'sql', 'sh', 'bash', 'yaml', 'yml', 'toml'].includes(fileExtension)) {
                previewTextFileFromUrl(fileUrl, filename, fileExtension, modalBody);
            } else if (['mp4', 'avi', 'mov', 'wmv', 'webm'].includes(fileExtension)) {
                previewVideoFromUrl(fileUrl, filename, modalBody);
            } else if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(fileExtension)) {
                previewAudioFromUrl(fileUrl, filename, modalBody);
            } else {
                previewUnsupportedFile(filename, modalBody);
            }
        } else {
            throw new Error(result.message || '無法獲取文件 URL');
        }
        
    } catch (error) {
        console.error('預覽文件失敗:', error);
        const modalBody = document.getElementById('previewModalBody');
        if (modalBody) {
            modalBody.innerHTML = '<div class="preview-error">無法載入文件預覽：' + error.message + '</div>';
        }
        Utils.showNotification('預覽文件失敗，請稍後再試', 'error');
    }
}

// 從 URL 預覽圖片
function previewImageFromUrl(url, filename, container) {
    container.innerHTML = `
        <div class="preview-image-container">
            <img src="${url}" alt="${filename}" class="preview-image" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'preview-error\\'>無法載入圖片</div>'">
        </div>
    `;
}

// 從 URL 預覽 PDF
function previewPDFFromUrl(url, filename, container) {
    container.innerHTML = `
        <div class="preview-pdf-container">
            <iframe src="${url}" class="preview-pdf" frameborder="0"></iframe>
            <div class="preview-pdf-fallback">
                <p>如果 PDF 無法顯示，請<a href="${url}" download="${filename}" target="_blank">點擊這裡下載</a></p>
            </div>
        </div>
    `;
}

// 從 URL 預覽文字檔
async function previewTextFileFromUrl(url, filename, extension, container) {
    try {
        const response = await fetch(url);
        const content = await response.text();
        
        const maxLength = 10000;
        const displayContent = content.length > maxLength 
            ? content.substring(0, maxLength) + '\n\n... (文件過大，僅顯示前 ' + maxLength + ' 字元)'
            : content;
        
        container.innerHTML = `
            <div class="preview-text-container">
                <div class="preview-text-header">
                    <span class="preview-file-info">${extension.toUpperCase()} 文件</span>
                    <button class="btn-copy-text" onclick="copyTextToClipboard(\`${content.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`)">
                        <i class="fas fa-copy"></i> 複製
                    </button>
                </div>
                <pre class="preview-text-content"><code>${escapeHtml(displayContent)}</code></pre>
                ${content.length > maxLength ? '<div class="preview-text-warning">文件過大，僅顯示部分內容</div>' : ''}
            </div>
        `;
    } catch (error) {
        container.innerHTML = '<div class="preview-error">無法載入文字文件</div>';
    }
}

// 從 URL 預覽影片
function previewVideoFromUrl(url, filename, container) {
    container.innerHTML = `
        <div class="preview-video-container">
            <video controls class="preview-video">
                <source src="${url}" type="video/${filename.split('.').pop()}">
                您的瀏覽器不支援影片播放
            </video>
        </div>
    `;
}

// 從 URL 預覽音頻
function previewAudioFromUrl(url, filename, container) {
    container.innerHTML = `
        <div class="preview-audio-container">
            <audio controls class="preview-audio">
                <source src="${url}" type="audio/${filename.split('.').pop()}">
                您的瀏覽器不支援音頻播放
            </audio>
            <div class="preview-audio-info">
                <p><strong>檔案名稱：</strong>${filename}</p>
            </div>
        </div>
    `;
}

// 預覽不支援的文件類型
function previewUnsupportedFile(filename, container) {
    const extension = filename.split('.').pop().toLowerCase();
    container.innerHTML = `
        <div class="preview-unsupported">
            <div class="preview-unsupported-icon">
                <i class="${getFileIconByExtension(extension)}"></i>
            </div>
            <h4>此文件類型無法預覽</h4>
            <p>文件類型：${extension.toUpperCase()}</p>
            <p>請使用下載功能獲取文件</p>
        </div>
    `;
}

// 關閉文件預覽
function closeFilePreview() {
    const modal = document.getElementById('filePreviewModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// 複製文字到剪貼板
function copyTextToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        Utils.showNotification('已複製到剪貼板', 'success');
    }, function(err) {
        console.error('複製失敗:', err);
        Utils.showNotification('複製失敗', 'error');
    });
}

// 下載檔案
async function downloadFile(filename) {
    try {
        // 從 localStorage 獲取使用者資訊
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) {
            throw new Error('無法獲取使用者資訊');
        }
        
        // 發送檔案下載請求（統一透過 ApiService）
        const svc = window.apiService || window.initializeApiService?.();
        const result = await svc.request('student/portfolio.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'download_file',
                portfolio_id: portfolioDetail.id,
                filename: filename,
                user_id: user.id
            })
        });
        
        if ((result.status === 200 || result.success) && (result.data && result.data.download_url)) {
            // 創建下載連結
            const link = document.createElement('a');
            link.href = result.data.download_url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // 更新下載次數
            portfolioDetail.downloads++;
            updatePortfolioDisplay();
            
            Utils.showNotification('檔案下載完成', 'success');
        } else {
            throw new Error(result.message || '檔案下載失敗');
        }
        
    } catch (error) {
        console.error('檔案下載失敗:', error);
        Utils.showNotification('檔案下載失敗，請稍後再試', 'error');
    }
}

// 提交評論
async function submitComment() {
    const commentInput = document.getElementById('commentInput');
    const commentText = commentInput.value.trim();
    
    if (!commentText) {
        Utils.showNotification('請輸入評論內容', 'error');
        return;
    }
    
    try {
        // 從 localStorage 獲取使用者資訊
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) {
            throw new Error('無法獲取使用者資訊');
        }
        
        // 發送評論請求（統一透過 ApiService）
        const svc = window.apiService || window.initializeApiService?.();
        // 同時以 Header 與 QueryString 傳遞 user_id，確保後端 getUserId() 能取得
        const endpoint = `student/portfolio.php?user_id=${encodeURIComponent(user.id)}`;
        const result = await svc.request(endpoint, {
            method: 'POST',
            body: JSON.stringify({
                action: 'add_comment',
                portfolio_id: portfolioDetail.id,
                comment_text: commentText,
                user_id: user.id,
                parent_id: selectedParentCommentId || null,
                rating: null
            })
        });
        // 成功條件放寬：接受所有 2xx 狀態或 success=true
        const is2xx = result && typeof result.status === 'number' && result.status >= 200 && result.status < 300;
        if (is2xx || result?.success) {
            // 添加新評論到本地
            const newComment = {
                id: (result.data && result.data.comment_id) || Date.now(),
                parent_id: selectedParentCommentId || null,
                author: user.name || '使用者',
                avatar: user.name ? user.name.charAt(0) : '用',
                text: commentText,
                likes: 0,
                time: '剛剛'
            };
            
            if (!Array.isArray(portfolioDetail.comments)) {
                portfolioDetail.comments = [];
            }
            portfolioDetail.comments.unshift(newComment);
            
            // 更新評論數
            portfolioDetail.comment_count = (portfolioDetail.comment_count || 0) + 1;
            
            // 清空輸入框
            commentInput.value = '';
            selectedParentCommentId = null;
            
            // 更新顯示
            updateCommentsDisplay();
            updatePortfolioDisplay();
            
            Utils.showNotification('評論已發表', 'success');

            // 成功後立即向後端重新抓取評論，確認是否已寫入資料庫
            try {
                const refreshed = await (window.apiService || window.initializeApiService?.()).getComments(portfolioDetail.id);
                const serverComments = Array.isArray(refreshed?.data) ? refreshed.data : (Array.isArray(refreshed) ? refreshed : []);
                if (serverComments.length > 0) {
                    portfolioDetail.comments = serverComments;
                    portfolioDetail.comment_count = serverComments.length;
                    updateCommentsDisplay();
                }
            } catch (_) { /* 忽略刷新失敗，不阻斷使用者流程 */ }
        } else {
            throw new Error(result.message || '發表評論失敗');
        }
        
    } catch (error) {
        // 某些情況後端回 201 但前端早期程式碼誤判，若訊息含「成功」則視為成功
        if (error && typeof error.message === 'string' && error.message.includes('成功')) {
            Utils.showNotification('評論已發表', 'success');
        } else {
            Utils.showNotification('發表評論失敗，請稍後再試', 'error');
        }
        console.error('發表評論錯誤:', error);
    }
}

// 讚評論
async function likeComment(commentId) {
    try {
        // 從 localStorage 獲取使用者資訊
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) {
            throw new Error('無法獲取使用者資訊');
        }
        
        // 發送評論讚請求（統一透過 ApiService）
        const svc = window.apiService || window.initializeApiService?.();
        const result = await svc.request('student/portfolio.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'like_comment',
                portfolio_id: portfolioDetail.id,
                comment_id: commentId,
                user_id: user.id
            })
        });
        
        if (result.status === 200 || result.success) {
            // 更新本地評論讚數
            const comment = portfolioDetail.comments.find(c => c.id === commentId);
            if (comment) {
                comment.likes++;
                updateCommentsDisplay();
            }
            
            Utils.showNotification('已讚評論', 'success');
        } else {
            throw new Error(result.message || '讚評論失敗');
        }
        
    } catch (error) {
        console.error('讚評論失敗:', error);
        Utils.showNotification('讚評論失敗，請稍後再試', 'error');
    }
}

// 回覆評論
function replyComment(commentId) {
    const commentInput = document.getElementById('commentInput');
    selectedParentCommentId = commentId;
    commentInput.focus();
    // 僅在輸入框尚未含有提示時加入
    if (!commentInput.value.startsWith(`@回覆 ${commentId}`)) {
        commentInput.value = `@回覆 ${commentId} ` + commentInput.value;
    }
}

// 取消回覆
function cancelReply() {
    selectedParentCommentId = null;
    const commentInput = document.getElementById('commentInput');
    if (commentInput && commentInput.value.startsWith('@回覆 ')) {
        // 去掉提示字樣
        const idx = commentInput.value.indexOf(' ');
        commentInput.value = commentInput.value.slice(idx + 1);
    }
}

// 簡易跳脫 HTML（避免 XSS）
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// 分享到 Facebook
function shareToFacebook() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(portfolioDetail.title);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
}

// 分享到 Twitter
function shareToTwitter() {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`${portfolioDetail.title} - ${portfolioDetail.description}`);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
}

// 分享到 LinkedIn
function shareToLinkedIn() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(portfolioDetail.title);
    const summary = encodeURIComponent(portfolioDetail.description);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
}

// 複製連結
function copyLink() {
    const url = window.location.href;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
            Utils.showNotification('連結已複製到剪貼簿', 'success');
        });
    } else {
        // 降級方案
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        Utils.showNotification('連結已複製到剪貼簿', 'success');
    }
}

// 載入相關作品
async function loadRelatedWorks() {
    try {
        // 從 localStorage 獲取使用者資訊
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) {
            throw new Error('無法獲取使用者資訊');
        }
        
        // 從後端 API 載入相關作品（統一透過 ApiService）
        const svc = window.apiService || window.initializeApiService?.();
        const pid = getCurrentPortfolioId();
        if (!pid) return; // 若沒有作品 ID 則略過請求
        const result = await svc.request(`student/portfolio.php?action=get_related&portfolio_id=${pid}&user_id=${user.id}`);
        
        if ((result.status === 200 || result.success) && (result.data || result)) {
            const relatedWorks = result.data || result;
            
            const relatedContainer = document.querySelector('.related-works');
            if (relatedContainer) {
                relatedContainer.innerHTML = relatedWorks.map(work => `
                    <div class="related-item" style="padding: var(--spacing-md); border-bottom: 1px solid var(--gray-200); cursor: pointer;" onclick="window.location.href='portfolio-detail.html?id=${work.id}'">
                        <h4 style="font-size: var(--text-sm); margin-bottom: var(--spacing-xs);">${work.title}</h4>
                        <p style="font-size: var(--text-xs); color: var(--gray-600);">${work.description}</p>
                    </div>
                `).join('');
            }
        } else {
            throw new Error(result.message || '載入相關作品失敗');
        }
        
    } catch (error) {
        console.error('載入相關作品失敗:', error);
        // 如果 API 失敗，顯示預設相關作品
        const relatedWorks = [
            {
                id: 2,
                title: '行動應用程式',
                description: '使用 React Native 開發的跨平台應用'
            },
            {
                id: 3,
                title: 'UI/UX 設計作品',
                description: '使用 Figma 設計的現代化介面'
            }
        ];
        
        const relatedContainer = document.querySelector('.related-works');
        if (relatedContainer) {
            relatedContainer.innerHTML = relatedWorks.map(work => `
                <div class="related-item" style="padding: var(--spacing-md); border-bottom: 1px solid var(--gray-200);">
                    <h4 style="font-size: var(--text-sm); margin-bottom: var(--spacing-xs);">${work.title}</h4>
                    <p style="font-size: var(--text-xs); color: var(--gray-600);">${work.description}</p>
                </div>
            `).join('');
        }
    }
}

// 更新瀏覽次數
async function updateViewCount() {
    try {
        // 從 localStorage 獲取使用者資訊
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) {
            throw new Error('無法獲取使用者資訊');
        }
        
        // 發送瀏覽記錄（統一透過 ApiService）
        const svc = window.apiService || window.initializeApiService?.();
        const pid = getCurrentPortfolioId();
        if (!pid) return; // 若仍無法取得作品 ID，略過
        if (typeof debugLog === 'function') {
            debugLog('準備送出記錄瀏覽次數', { pid: Number(pid), user_id: user.id });
        }
        const result = await svc.request('student/portfolio.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'record_view',
                portfolio_id: Number(pid),
                user_id: user.id
            })
        });
        if (typeof debugLog === 'function') {
            debugLog('已送出記錄瀏覽次數', { pid: Number(pid), user_id: user.id });
        }
        
        if (result.status === 200 || result.success) {
            // 更新本地瀏覽次數
            const currentViews = (portfolioDetail.views ?? portfolioDetail.view_count ?? 0) | 0;
            portfolioDetail.views = currentViews + 1;
            updatePortfolioDisplay();
        } else {
            console.warn('記錄瀏覽次數失敗:', result.message);
        }
        
    } catch (error) {
        console.error('記錄瀏覽次數失敗:', error);
        // 即使失敗也更新本地顯示
        portfolioDetail.views++;
        updatePortfolioDisplay();
    }
}

// 頁面載入時更新瀏覽次數
document.addEventListener('DOMContentLoaded', function() {
    // 延遲更新，避免重複計算
    setTimeout(updateViewCount, 1000);
});

// 全域函數供 HTML 使用
window.likePortfolio = likePortfolio;
window.togglePortfolioStatus = togglePortfolioStatus;
window.sharePortfolio = sharePortfolio;
window.editPortfolio = editPortfolio;
window.deletePortfolio = deletePortfolio;
window.downloadFile = downloadFile;
window.submitComment = submitComment;
window.likeComment = likeComment;
window.replyComment = replyComment;
window.cancelReply = cancelReply;
window.shareToFacebook = shareToFacebook;
window.shareToTwitter = shareToTwitter;
window.shareToLinkedIn = shareToLinkedIn;
window.copyLink = copyLink; 
window.loadMoreComments = loadMoreComments;

// 查看作者個人資料（企業或訪客可用）
function viewAuthorProfile() {
    const authorId = (window.portfolioDetail && window.portfolioDetail.author_id) || (document.getElementById('authorCard')?.dataset?.authorId);
    if (!authorId) {
        Utils?.showNotification?.('找不到作者資料', 'error');
        return;
    }
    // 依角色導向不同頁面：企業導向學生公開檔案頁，學生導向學生端個人頁
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const role = user?.role || 'visitor';
    const isAuthorSelf = user && Number(user.id) === Number(authorId);
    // 非作者本人（任何身份）一律看公開版
    if (!isAuthorSelf) {
        window.location.href = `../enterprise/student-profile.html?id=${authorId}`;
        return;
    }
    // 作者本人（學生）仍導向自己的編輯/個人頁
    window.location.href = `../student/profile.html?user_id=${authorId}`;
}

// 暴露全域供 HTML onclick 使用
window.viewAuthorProfile = viewAuthorProfile;

// 返回按鈕功能
function goBack() {
    console.log('goBack 函數被調用');
    try {
        // 從 localStorage 獲取使用者資訊
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        const role = user?.role || 'visitor';
        
        console.log('用戶角色:', role);
        console.log('用戶資訊:', user);
        
        // 根據用戶角色導向不同的返回頁面
        if (role === 'student') {
            // 學生端：返回學生作品集頁面
            console.log('導向學生作品集頁面');
            window.location.href = 'portfolio.html';
        } else if (role === 'enterprise') {
            // 企業端：返回企業作品瀏覽頁面
            console.log('導向企業作品瀏覽頁面');
            window.location.href = '../enterprise/portfolios.html';
        } else if (role === 'admin') {
            // 管理員：返回管理員作品管理頁面
            console.log('導向管理員作品管理頁面');
            window.location.href = '../admin/portfolios.html';
        } else {
            // 訪客：返回首頁或作品瀏覽頁面
            console.log('導向首頁');
            window.location.href = '../index.html';
        }
    } catch (error) {
        console.error('返回功能錯誤:', error);
        // 如果發生錯誤，使用瀏覽器歷史記錄返回
        if (window.history.length > 1) {
            console.log('使用瀏覽器歷史記錄返回');
            window.history.back();
        } else {
            // 如果沒有歷史記錄，導向首頁
            console.log('導向首頁（錯誤處理）');
            window.location.href = '../index.html';
        }
    }
}

// 立即暴露全域供 HTML onclick 使用
window.goBack = goBack;
console.log('goBack 函數已暴露到全域');