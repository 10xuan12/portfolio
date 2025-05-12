document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Work Detail Page');

    // 取得必要的 DOM 元素
    const commentForm = document.getElementById('commentForm');
    const commentList = document.getElementById('commentList');
    const pagination = document.getElementById('commentPagination');
    const portfolioId = new URLSearchParams(window.location.search).get('portfolio_id');

    if (!commentForm || !commentList || !pagination || !portfolioId) {
        console.warn('留言表單或留言列表或分頁導航未正確加載，請檢查 HTML 是否正確');
        return;
    }

    // 初始化檢查完成，comment.js 會處理後續的留言功能
    console.log('Comment elements found, comment.js will handle the functionality');
});
  