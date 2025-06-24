
document.addEventListener('DOMContentLoaded', function () {
    const categoryList = document.getElementById('category-list');
    const pagination = document.getElementById('pagination');
    const searchInput = document.getElementById('search');

    let currentPage = 1;
    let currentSearch = '';

    function showLoading() {
        categoryList.innerHTML = `
            <div class="col-12 text-center my-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">載入中...</span>
                </div>
            </div>
        `;
    }

    function renderCategory(category) {
        return `
            <div class="col-12 col-md-6 col-lg-4">
                <div class="card shadow-sm h-100">
                    <img src="${category.image ? 'uploads/' + category.image : 'https://via.placeholder.com/300x150'}" class="card-img-top" alt="${category.name}" style="height: 180px; object-fit: cover;">
                    <div class="card-body text-center">
                        <h5 class="card-title">${category.name}</h5>
                        <p class="card-text">${category.description || '無描述'}</p>
                        <a href="category_projects.php?category_id=${category.category_id}" class="btn btn-outline-primary btn-sm mt-2">查看作品集</a>
                    </div>
                </div>
            </div>
        `;
    }

    function renderPagination({ current_page, total_pages }) {
        let html = '';
        html += `
            <li class="page-item ${current_page === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${current_page - 1}">上一頁</a>
            </li>`;

        for (let i = Math.max(1, current_page - 2); i <= Math.min(total_pages, current_page + 2); i++) {
            html += `
                <li class="page-item ${i === current_page ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>`;
        }

        html += `
            <li class="page-item ${current_page === total_pages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${current_page + 1}">下一頁</a>
            </li>`;

        pagination.innerHTML = html;

        document.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const page = parseInt(this.dataset.page);
                if (page && page !== currentPage) loadCategories(page);
            });
        });
    }

    function loadCategories(page = 1) {
        showLoading();
        currentPage = page;

        const url = new URL('get_categories.php', window.location.href);
        url.searchParams.set('page', page);
        if (currentSearch) url.searchParams.set('search', currentSearch);

        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error("伺服器錯誤");
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    categoryList.innerHTML = data.data.categories.map(renderCategory).join('');
                    renderPagination(data.data.pagination);
                } else {
                    throw new Error(data.message || '載入失敗');
                }
            })
            .catch(error => {
                console.error("載入失敗：", error);
                categoryList.innerHTML = `
                    <div class="col-12">
                        <div class="alert alert-danger text-center">載入分類時發生錯誤，請稍後再試</div>
                    </div>`;
                pagination.innerHTML = '';
            });
    }

    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            currentSearch = this.value.trim();
            searchTimeout = setTimeout(() => loadCategories(1), 300);
        });
    }

    // 新增分類表單處理
    const addCategoryForm = document.querySelector('#addCategoryModal form');
    const imageInput = document.getElementById('image');
    const previewImage = document.createElement('img');
    previewImage.style.width = '100px';
    previewImage.style.height = '100px';
    previewImage.style.objectFit = 'cover';
    previewImage.className = 'd-block mx-auto my-2';
    imageInput.parentNode.appendChild(previewImage);

    imageInput.addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = e => previewImage.src = e.target.result;
            reader.readAsDataURL(file);
        } else {
            previewImage.src = '';
        }
    });

    addCategoryForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const formData = new FormData(this);

        fetch('student_add_category.php', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('addCategoryModal').classList.add('hidden');
                    addCategoryForm.reset();
                    previewImage.src = '';
                    Swal.fire({ title: '新增分類成功！', icon: 'success', timer: 1500, showConfirmButton: false });
                    loadCategories(1);
                } else {
                    throw new Error(data.message || '新增失敗');
                }
            })
            .catch(error => {
                Swal.fire({ title: '新增分類失敗!', text: error.message || '請稍後再試', icon: 'error' });
            });
    });

    loadCategories();
});