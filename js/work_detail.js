document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("commentForm");
    const commentList = document.getElementById("commentList");
  
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
            const newComment = document.createElement("li");
            newComment.className = "list-group-item bg-light";
            newComment.innerHTML = `<span class="badge bg-secondary rounded-circle">A</span> ${formData.get("content")}`;
            commentList.prepend(newComment);
            form.reset();
          } else {
            Swal.fire("錯誤", data.message, "error");
          }
        })
        .catch(() => {
          Swal.fire("錯誤", "無法送出留言", "error");
        });
    });
  });
  