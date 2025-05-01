document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("commentForm");
  const commentList = document.getElementById("commentList");
  const pagination = document.querySelector("#paginationNav .pagination");
  const portfolioId = form.querySelector("[name='portfolio_id']").value;
  let currentPage = 1;

  function fetchComments(page = 1) {
      fetch(`../get_comments.php?portfolio_id=${portfolioId}&page=${page}`)
          .then(res => res.json())
          .then(data => {
              commentList.innerHTML = '';
              data.comments.forEach(comment => {
                  commentList.appendChild(createCommentItem(comment));
              });
              renderPagination(data.total_pages, data.current_page);
          });
  }

  function createCommentItem(comment) {
      const li = document.createElement("li");
      li.className = "list-group-item bg-light d-flex justify-content-between align-items-center";
      li.dataset.id = comment.comment_id;
      li.innerHTML = `
          <div>
            <strong>${comment.name}</strong>：${comment.content}
          </div>
          ${comment.editable ? `
          <div>
            <button class="btn btn-sm btn-outline-secondary edit-btn">編輯</button>
            <button class="btn btn-sm btn-outline-danger delete-btn">刪除</button>
          </div>` : ''}
      `;
      return li;
  }

  form.addEventListener("submit", function (e) {
      e.preventDefault();
      const formData = new FormData(form);

      fetch("../submit_comment.php", {
          method: "POST",
          body: formData
      })
          .then(res => res.json())
          .then(data => {
              if (data.status === 'success') {
                  commentList.prepend(createCommentItem({ ...data.comment, editable: true }));
                  form.reset();
              } else {
                  Swal.fire("錯誤", data.message, "error");
              }
          })
          .catch(() => Swal.fire("錯誤", "無法送出留言", "error"));
  });

  commentList.addEventListener("click", function (e) {
      const li = e.target.closest("li");
      const commentId = li?.dataset.id;

      // 刪除
      if (e.target.classList.contains("delete-btn")) {
          Swal.fire({
              title: "確定要刪除留言？",
              icon: "warning",
              showCancelButton: true,
              confirmButtonText: "刪除",
              cancelButtonText: "取消"
          }).then(result => {
              if (result.isConfirmed) {
                  fetch("../delete_comment.php", {
                      method: "POST",
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ comment_id: commentId })
                  }).then(res => res.json())
                    .then(data => {
                        if (data.status === 'success') li.remove();
                        else Swal.fire("錯誤", data.message, "error");
                    });
              }
          });
      }

      // 編輯
      if (e.target.classList.contains("edit-btn")) {
          const contentDiv = li.querySelector("div");
          const originalContent = contentDiv.textContent.split('：')[1];
          const input = document.createElement("textarea");
          input.className = "form-control";
          input.value = originalContent;
          contentDiv.innerHTML = '';
          contentDiv.appendChild(input);

          const saveBtn = document.createElement("button");
          saveBtn.className = "btn btn-sm btn-success mt-2";
          saveBtn.textContent = "儲存";
          contentDiv.appendChild(saveBtn);

          saveBtn.addEventListener("click", () => {
              fetch("../edit_comment.php", {
                  method: "POST",
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      comment_id: commentId,
                      content: input.value
                  })
              }).then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        fetchComments(currentPage); // 重新載入
                    } else {
                        Swal.fire("錯誤", data.message, "error");
                    }
                });
          });
      }
  });

  function renderPagination(totalPages, currentPage) {
      pagination.innerHTML = '';
      for (let i = 1; i <= totalPages; i++) {
          const li = document.createElement("li");
          li.className = `page-item ${i === currentPage ? 'active' : ''}`;
          li.innerHTML = `<button class="page-link">${i}</button>`;
          li.addEventListener("click", () => {
              fetchComments(i);
          });
          pagination.appendChild(li);
      }
  }

  fetchComments(); // 預設載入留言
});
