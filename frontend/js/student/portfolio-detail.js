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

// 初始化頁面
document.addEventListener('DOMContentLoaded', function() {
    // 避免重複初始化
    if (window.__portfolioDetailInitialized) return;
    window.__portfolioDetailInitialized = true;
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
        statusEl.className = `info-status status-${portfolioDetail.status}`;
        statusEl.textContent = portfolioDetail.status === 'published' ? '已發布' : (portfolioDetail.status === 'review' ? '審核中' : '草稿');
    }

    // 統計
    const views = (portfolioDetail.views ?? portfolioDetail.view_count ?? 0) | 0;
    const likes = (portfolioDetail.likes ?? portfolioDetail.like_count ?? 0) | 0;
    const downloads = (portfolioDetail.downloads ?? portfolioDetail.download_count ?? 0) | 0;
    const sv = document.getElementById('statViews'); if (sv) sv.textContent = `${views} 次瀏覽`;
    const sl = document.getElementById('statLikes'); if (sl) sl.textContent = `${likes} 個讚`;
    const commentCount = Array.isArray(portfolioDetail.comments) ? portfolioDetail.comments.length : (portfolioDetail.comments || 0);
    const sc = document.getElementById('statComments'); if (sc) sc.textContent = `${commentCount} 則評論`;
    const sd = document.getElementById('statDownloads'); if (sd) sd.textContent = `${downloads} 次下載`;

    // 內容
    const contentEl = document.getElementById('detailContent');
    if (contentEl) contentEl.innerHTML = portfolioDetail.content || '';

    // 標籤
    const tagsContainer = document.querySelector('.portfolio-tags');
    tagsContainer.innerHTML = (portfolioDetail.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('');

    // 檔案
    const fileList = document.getElementById('fileList');
    if (fileList && Array.isArray(portfolioDetail.files)) {
        fileList.innerHTML = portfolioDetail.files.map(f => `
            <div class="file-item">
                <div class="file-icon"><i class="fas fa-file"></i></div>
                <div class="file-info">
                    <div class="file-name">${f.file_name || ''}</div>
                    <div class="file-size">${(f.file_size || 0)} B</div>
                </div>
                <button class="file-download" onclick="downloadFile('${(f.file_name || '').replace(/'/g,"\'")}')">
                    <i class="fas fa-download"></i>
                </button>
            </div>
        `).join('');
    }

    // 讚按鈕狀態
    updateLikeButton();
}

// 更新評論顯示
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

    commentsList.innerHTML = roots.map(n => renderNode(n, 0)).join('');
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
            // 更新本地狀態
            portfolioDetail.isLiked = !portfolioDetail.isLiked;
            const currentLikes = (portfolioDetail.likes ?? portfolioDetail.like_count ?? 0) | 0;
            portfolioDetail.likes = portfolioDetail.isLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
            
            updateLikeButton();
            updatePortfolioDisplay();
            
            Utils.showNotification(
                portfolioDetail.isLiked ? '已讚作品' : '已取消讚',
                'success'
            );
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
    const icon = likeBtn.querySelector('i');
    
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
        const result = await svc.request('student/portfolio.php', {
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
        
        if ((result.status === 200 || result.success) && result.data) {
            // 添加新評論到本地
            const newComment = {
                id: result.data.comment_id,
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
            
            // 清空輸入框
            commentInput.value = '';
            selectedParentCommentId = null;
            
            // 更新顯示
            updateCommentsDisplay();
            updatePortfolioDisplay();
            
            Utils.showNotification('評論已發表', 'success');
        } else {
            throw new Error(result.message || '發表評論失敗');
        }
        
    } catch (error) {
        Utils.showNotification('發表評論失敗，請稍後再試', 'error');
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