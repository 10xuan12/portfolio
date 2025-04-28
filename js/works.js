document.addEventListener('DOMContentLoaded', function () {
    const addWorkForm = document.getElementById('addWorkForm');
    const cardContainer = document.getElementById('cardContainer');
  
    addWorkForm.addEventListener('submit', function (e) {
      e.preventDefault();
  
      const title = document.getElementById('workTitle').value.trim();
      const description = document.getElementById('workDescription').value.trim();
      const fileInput = document.getElementById('workImage');
      const file = fileInput.files[0];
  
      if (!file) {
        alert('請上傳圖片');
        return;
      }
  
      const reader = new FileReader();
      reader.onload = function (event) {
        const imageUrl = event.target.result;
  
        const newCard = document.createElement('div');
        newCard.className = 'col-md-4 mb-4';
        newCard.innerHTML = `
          <div class="card text-center p-3 h-100">
            <img src="${imageUrl}" class="card-img-top mx-auto" style="width: 100px; height: 100px; object-fit: cover;" alt="作品圖片">
            <div class="card-body">
              <h5 class="card-title">${title}</h5>
              <p class="card-text">${description}</p>
              <div class="d-flex justify-content-around mt-3">
                <button class="btn btn-sm btn-warning edit-btn">編輯</button>
                <button class="btn btn-sm btn-danger delete-btn">刪除</button>
              </div>
            </div>
          </div>
        `;
  
        cardContainer.prepend(newCard);
  
        // 關閉 Modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addWorkModal'));
        modal.hide();
        addWorkForm.reset();
      };
  
      reader.readAsDataURL(file);
    });
  
    cardContainer.addEventListener('click', function (e) {
      if (e.target.classList.contains('delete-btn')) {
        e.target.closest('.col-md-4').remove();
      }
      if (e.target.classList.contains('edit-btn')) {
        alert('之後會加上編輯功能喔～！');
      }
    });

    function renderPagination() {
      pagination.innerHTML = "";

      // Previous 按鈕
      const prev = document.createElement("li");
      prev.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
      prev.innerHTML = `<a class="page-link" href="#">Previous</a>`;
      prev.addEventListener("click", function(e) {
          e.preventDefault();
          if (currentPage > 1) showPage(currentPage - 1);
      });
      pagination.appendChild(prev);

      // 頁數按鈕
      for (let i = 1; i <= totalPages; i++) {
          const pageItem = document.createElement("li");
          pageItem.className = `page-item ${i === currentPage ? "active" : ""}`;
          pageItem.innerHTML = `<a class="page-link" href="#">${i}</a>`;
          pageItem.addEventListener("click", function(e) {
              e.preventDefault();
              showPage(i);
          });
          pagination.appendChild(pageItem);
      }

      // Next 按鈕
      const next = document.createElement("li");
      next.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`;
      next.innerHTML = `<a class="page-link" href="#">Next</a>`;
      next.addEventListener("click", function(e) {
          e.preventDefault();
          if (currentPage < totalPages) showPage(currentPage + 1);
      });
      pagination.appendChild(next);
  }
});
  