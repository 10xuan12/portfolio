const commentList = document.getElementById("commentList");
const form = document.getElementById("commentForm");

// 正確抓到 modal 元素
const editModalEl = document.getElementById("myModal");
const editModal = new bootstrap.Modal(document.getElementById("myModal"));

// 編輯表單元素
const editForm = document.getElementById("editCommentForm");
const editContent = document.getElementById("editContent");
const editCommentId = document.getElementById("editCommentId");

async function loadComments() {
    try {
        const res = await fetch("get_comments.php?portfolio_id=1");
        const data = await res.json();
        commentList.innerHTML = "";
        data.forEach(comment => {
            const li = document.createElement("li");
            li.className = "list-group-item";
            li.innerHTML = `
                <strong>${comment.user_type === 'student' ? '👨‍🎓' : '🏢'} ${comment.user_name}</strong>
                <p>${comment.content.replace(/\n/g, '<br>')}</p>
                <small class="text-muted">${comment.created_at}</small>
                ${comment.can_edit ? `
                    <div class="text-end">
                        <button class="btn btn-sm btn-secondary me-2" onclick="showEditModal(${comment.comment_id}, \`${comment.content.replace(/`/g, '\\`')}\`)">編輯</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteComment(${comment.comment_id})">刪除</button>
                    </div>` : ''}
            `;
            commentList.appendChild(li);
        });
    } catch (error) {
        console.error('載入留言失敗', error);
        Swal.fire('錯誤', '留言載入失敗，請稍後再試。', 'error');
    }
}

form.addEventListener("submit", async e => {
    e.preventDefault();
    const formData = new FormData(form);
    try {
        const res = await fetch("add_comment.php", {
            method: "POST",
            body: formData
        });
        if (res.ok) {
            form.reset();
            loadComments();
        } else {
            throw new Error('提交留言失敗');
        }
    } catch (error) {
        console.error('留言提交失敗', error);
        Swal.fire('錯誤', '留言提交失敗，請稍後再試。', 'error');
    }
});

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
        const res = await fetch("edit_comment.php", {
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
            const res = await fetch(`delete_comment.php?id=${id}`);
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

loadComments();
