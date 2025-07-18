/**
 * 學生作品詳情 JavaScript
 * 包含讚、分享、評論、下載等功能
 */

// TODO: 從後端 API 載入作品詳情
let portfolioDetail = {
    id: 1,
    title: '響應式網站設計',
    description: '使用 HTML5、CSS3 和 JavaScript 製作的現代化響應式網站，支援各種裝置尺寸。',
    category: 'web',
    status: 'published',
    tags: ['HTML5', 'CSS3', 'JavaScript', '響應式', 'Bootstrap', 'jQuery'],
    image: 'https://via.placeholder.com/1200x400/667eea/ffffff?text=Portfolio+Detail',
    url: 'https://example.com',
    github: 'https://github.com/zhangxiaoming/web-design',
    views: 156,
    likes: 23,
    comments: 8,
    downloads: 12,
    created_at: '2024-01-15',
    author: {
        name: '張小明',
        department: '資訊管理學系',
        grade: '大學三年級',
        email: 'zhang@example.com',
        github: 'github.com/zhangxiaoming',
        linkedin: 'linkedin.com/in/zhangxiaoming'
    },
    files: [
        {
            name: '網站截圖.png',
            size: '2.3 MB',
            type: 'image',
            url: 'screenshot.png'
        },
        {
            name: '原始碼.zip',
            size: '1.8 MB',
            type: 'archive',
            url: 'source-code.zip'
        },
        {
            name: '專案說明.pdf',
            size: '856 KB',
            type: 'document',
            url: 'documentation.pdf'
        }
    ],
    comments: [
        {
            id: 1,
            author: '李大明',
            avatar: '李',
            text: '設計很漂亮！響應式做得很好，在不同裝置上都能正常顯示。期待看到更多作品！',
            likes: 3,
            time: '2 小時前'
        },
        {
            id: 2,
            author: '王小美',
            avatar: '王',
            text: '程式碼結構很清晰，註解也很詳細。對於初學者來說是很好的學習範例。',
            likes: 1,
            time: '1 天前'
        },
        {
            id: 3,
            author: '陳小華',
            avatar: '陳',
            text: '整體設計感很棒，配色也很協調。建議可以加入一些動畫效果來提升使用者體驗。',
            likes: 5,
            time: '3 天前'
        }
    ],
    isLiked: false
};

// 初始化頁面
document.addEventListener('DOMContentLoaded', function() {
    loadPortfolioDetail();
    initEventListeners();
});

// 載入作品詳情
function loadPortfolioDetail() {
    // TODO: 從後端 API 載入作品詳情
    // const response = await fetch(`/api/portfolios/${portfolioId}`);
    // portfolioDetail = await response.json();
    
    updatePortfolioDisplay();
    updateCommentsDisplay();
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
    // 更新標題和描述
    document.querySelector('.hero-title').textContent = portfolioDetail.title;
    document.querySelector('.info-title h1').textContent = portfolioDetail.title;
    document.querySelector('.info-title p').textContent = portfolioDetail.description;
    
    // 更新統計資料
    document.querySelector('.stat-item:nth-child(1) span').textContent = `${portfolioDetail.views} 次瀏覽`;
    document.querySelector('.stat-item:nth-child(2) span').textContent = `${portfolioDetail.likes} 個讚`;
    document.querySelector('.stat-item:nth-child(3) span').textContent = `${portfolioDetail.comments} 則評論`;
    document.querySelector('.stat-item:nth-child(4) span').textContent = `${portfolioDetail.downloads} 次下載`;
    
    // 更新標籤
    const tagsContainer = document.querySelector('.portfolio-tags');
    tagsContainer.innerHTML = portfolioDetail.tags.map(tag => 
        `<span class="tag">${tag}</span>`
    ).join('');
    
    // 更新讚按鈕狀態
    updateLikeButton();
}

// 更新評論顯示
function updateCommentsDisplay() {
    const commentsList = document.getElementById('commentsList');
    
    commentsList.innerHTML = portfolioDetail.comments.map(comment => `
        <div class="comment-item">
            <div class="comment-avatar">
                ${comment.avatar}
            </div>
            <div class="comment-content">
                <div class="comment-header">
                    <span class="comment-author">${comment.author}</span>
                    <span class="comment-time">${comment.time}</span>
                </div>
                <div class="comment-text">
                    ${comment.text}
                </div>
                <div class="comment-actions">
                    <button class="comment-action" onclick="likeComment(${comment.id})">
                        <i class="fas fa-thumbs-up"></i> 讚 (${comment.likes})
                    </button>
                    <button class="comment-action" onclick="replyComment(${comment.id})">
                        <i class="fas fa-reply"></i> 回覆
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// 讚作品
async function likePortfolio() {
    try {
        // TODO: 發送讚請求到後端 API
        // const response = await fetch(`/api/portfolios/${portfolioDetail.id}/like`, {
        //     method: 'POST'
        // });
        
        // 更新本地狀態
        portfolioDetail.isLiked = !portfolioDetail.isLiked;
        if (portfolioDetail.isLiked) {
            portfolioDetail.likes++;
        } else {
            portfolioDetail.likes--;
        }
        
        updateLikeButton();
        updatePortfolioDisplay();
        
        Utils.showNotification(
            portfolioDetail.isLiked ? '已讚作品' : '已取消讚',
            'success'
        );
        
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
function deletePortfolio() {
    if (confirm('確定要刪除此作品嗎？此操作無法復原。')) {
        // TODO: 發送刪除請求到後端 API
        // fetch(`/api/portfolios/${portfolioDetail.id}`, {
        //     method: 'DELETE'
        // });
        
        Utils.showNotification('作品已刪除', 'success');
        
        // 跳轉回作品集頁面
        setTimeout(() => {
            window.location.href = 'portfolio.html';
        }, 1500);
    }
}

// 下載檔案
function downloadFile(filename) {
    // TODO: 實作檔案下載
    // 可以透過後端 API 或直接連結下載
    
    Utils.showNotification('開始下載檔案...', 'info');
    
    // 模擬下載
    setTimeout(() => {
        Utils.showNotification('檔案下載完成', 'success');
    }, 2000);
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
        // TODO: 發送評論請求到後端 API
        // const response = await fetch(`/api/portfolios/${portfolioDetail.id}/comments`, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ text: commentText })
        // });
        
        // 添加新評論到本地
        const newComment = {
            id: Date.now(),
            author: '張小明', // 當前使用者
            avatar: '張',
            text: commentText,
            likes: 0,
            time: '剛剛'
        };
        
        portfolioDetail.comments.unshift(newComment);
        portfolioDetail.comments++;
        
        // 清空輸入框
        commentInput.value = '';
        
        // 更新顯示
        updateCommentsDisplay();
        updatePortfolioDisplay();
        
        Utils.showNotification('評論已發表', 'success');
        
    } catch (error) {
        Utils.showNotification('發表評論失敗，請稍後再試', 'error');
        console.error('發表評論錯誤:', error);
    }
}

// 讚評論
function likeComment(commentId) {
    // TODO: 實作評論讚功能
    Utils.showNotification('已讚評論', 'success');
}

// 回覆評論
function replyComment(commentId) {
    const commentInput = document.getElementById('commentInput');
    commentInput.focus();
    commentInput.value = `@回覆 ${commentId} `;
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
function loadRelatedWorks() {
    // TODO: 從後端 API 載入相關作品
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
    relatedContainer.innerHTML = relatedWorks.map(work => `
        <div class="related-item" style="padding: var(--spacing-md); border-bottom: 1px solid var(--gray-200);">
            <h4 style="font-size: var(--text-sm); margin-bottom: var(--spacing-xs);">${work.title}</h4>
            <p style="font-size: var(--text-xs); color: var(--gray-600);">${work.description}</p>
        </div>
    `).join('');
}

// 更新瀏覽次數
function updateViewCount() {
    // TODO: 發送瀏覽記錄到後端 API
    // fetch(`/api/portfolios/${portfolioDetail.id}/view`, {
    //     method: 'POST'
    // });
    
    portfolioDetail.views++;
    updatePortfolioDisplay();
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
window.shareToFacebook = shareToFacebook;
window.shareToTwitter = shareToTwitter;
window.shareToLinkedIn = shareToLinkedIn;
window.copyLink = copyLink; 