const commentList = document.getElementById("commentList");
const form = document.getElementById("commentForm");
const pagination = document.getElementById("commentPagination");

// 正確抓到 modal 元素
const editModalEl = document.getElementById("editCommentModal");
const editModal = new bootstrap.Modal(document.getElementById("editCommentModal"));

// 編輯表單元素
const editForm = document.getElementById("editCommentForm");
const editContent = document.getElementById("editContent");
const editCommentId = document.getElementById("editCommentId");

// 取得作品 ID
const portfolioId = new URLSearchParams(window.location.search).get('portfolio_id');

async function loadComments(page = 1) {
    try {
        const response = await fetch(`get_comments.php?portfolio_id=${portfolioId}&page=${page}`);
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || '載入留言失敗');
        }

        const { comments, pagination: paginationData } = result.data;
        
        // 清空留言列表
        commentList.innerHTML = '';
        
        if (!comments || comments.length === 0) {
            commentList.innerHTML = `
                <div class="text-center text-muted py-4">
                    目前還沒有留言
                </div>
            `;
            pagination.innerHTML = '';
            return;
        }

        // 渲染留言
        comments.forEach(comment => {
            const div = document.createElement("div");
            div.className = "comment-item mb-3 p-3 border rounded";
            div.innerHTML = `
                <div class="d-flex align-items-center mb-2">
                    <img src="${comment.avatar}" 
                         alt="${comment.username}" 
                         class="rounded-circle me-2" 
                         style="width: 40px; height: 40px; object-fit: cover;">
                    <div>
                        <strong>${comment.username}</strong>
                        <small class="text-muted ms-2">${new Date(comment.created_at).toLocaleString()}</small>
                    </div>
                </div>
                <p class="mb-0">${comment.content}</p>
            `;
            commentList.appendChild(div);
        });

        // 渲染分頁
        renderPagination(paginationData);
    } catch (error) {
        console.error('載入留言失敗', error);
        commentList.innerHTML = `
            <div class="alert alert-danger" role="alert">
                載入留言失敗，請稍後再試
            </div>
        `;
        pagination.innerHTML = '';
    }
}

// 渲染分頁
function renderPagination(pagination) {
    const { current_page, total_pages } = pagination;
    
    if (total_pages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '<ul class="pagination justify-content-center">';
    
    // 上一頁
    html += `
        <li class="page-item ${current_page === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${current_page - 1}">上一頁</a>
        </li>
    `;

    // 頁碼
    for (let i = Math.max(1, current_page - 2); i <= Math.min(total_pages, current_page + 2); i++) {
        html += `
            <li class="page-item ${i === current_page ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `;
    }

    // 下一頁
    html += `
        <li class="page-item ${current_page === total_pages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${current_page + 1}">下一頁</a>
        </li>
    `;

    html += '</ul>';
    pagination.innerHTML = html;

    // 綁定分頁點擊事件
    pagination.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = parseInt(this.dataset.page);
            if (page && page !== current_page) {
                loadComments(page);
            }
        });
    });
}

// 處理留言表單提交
if (form) {
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        const content = this.querySelector('textarea[name="content"]').value.trim();

        if (!content) {
            Swal.fire({
                icon: 'warning',
                title: '提示',
                text: '請輸入留言內容'
            });
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                處理中...
            `;

            const formData = new FormData(this);
            formData.append('portfolio_id', portfolioId);

            const response = await fetch('../student/add_comment.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.reset();
                loadComments(1); // 重新載入第一頁
                Swal.fire({
                    icon: 'success',
                    title: '成功！',
                    text: '留言已送出',
                    showConfirmButton: false,
                    timer: 1500
                });
            } else {
                throw new Error(result.message || '留言失敗');
            }
        } catch (error) {
            console.error('留言失敗', error);
            Swal.fire({
                icon: 'error',
                title: '錯誤！',
                text: error.message || '留言失敗，請稍後再試'
            });
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });
}

// 初始載入留言
if (portfolioId) {
    loadComments();
}

function showEditModal(id, content) {
    editCommentId.value = id;
    editContent.value = content;
    editModal.show();
}

editForm.addEventListener("submit", async e => {
    e.preventDefault();
    const id = editCommentId.value;
    const content = editContent.value;
    try {
        const res = await fetch("../student/edit_comment.php", {
            method: "POST",
            body: new URLSearchParams({ id, content })
        });
        if (res.ok) {
            editModal.hide();
            loadComments();
        } else {
            throw new Error('編輯留言失敗');
        }
    } catch (error) {
        console.error('編輯留言失敗', error);
        Swal.fire('錯誤', '編輯留言時發生錯誤，請稍後再試。', 'error');
    }
});

async function deleteComment(id) {
    if (confirm("確認要刪除嗎？")) {
        try {
            const res = await fetch(`../student/delete_comment.php?id=${id}`);
            if (res.ok) {
                loadComments();
            } else {
                throw new Error('刪除留言失敗');
            }
        } catch (error) {
            console.error('刪除留言失敗', error);
            Swal.fire('錯誤', '刪除留言時發生錯誤，請稍後再試。', 'error');
        }
    }
}
