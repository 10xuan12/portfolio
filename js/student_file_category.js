document.addEventListener('DOMContentLoaded', function () {
    console.log("DOM Content Loaded - Student File Category"); // 除錯訊息

    const categoryList = document.getElementById('category-list');
    const pagination = document.querySelector('.pagination');
    const searchInput = document.getElementById('search');

    console.log("Elements found:", { // 除錯訊息
        categoryList,
        pagination,
        searchInput
    });

    let currentPage = 1;
    let currentSearch = '';

    function showLoading() {
        console.log("Showing loading state"); // 除錯訊息
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
            <div class="col-12 col-sm-6 col-md-4 col-lg-3">
                <div class="card h-100 shadow-sm animate__animated animate__fadeIn">
                    <img src="${category.image ? 'uploads/' + category.image : 'https://via.placeholder.com/300x150'}" 
                         class="card-img-top" alt="${category.name}"
                         style="height: 150px; object-fit: cover;">
                    <div class="card-body text-center">
                        <h5 class="card-title">${category.name}</h5>
                        <p class="card-text">${category.description || '無描述'}</p>
                        <a href="category_projects.php?category_id=${category.category_id}" 
                           class="btn btn-outline-primary mt-2">查看作品集</a>
                    </div>
                </div>
            </div>
        `;
    }

    function renderPagination(paginationData) {
        const { current_page, total_pages } = paginationData;
        let html = `
            <li class="page-item ${current_page === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${current_page - 1}">上一頁</a>
            </li>
        `;

        // 顯示當前頁碼前後的頁碼
        for (let i = Math.max(1, current_page - 2); i <= Math.min(total_pages, current_page + 2); i++) {
            html += `
                <li class="page-item ${i === current_page ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }

        html += `
            <li class="page-item ${current_page === total_pages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${current_page + 1}">下一頁</a>
            </li>
        `;

        pagination.innerHTML = html;

        // 綁定分頁按鈕事件
        document.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const page = parseInt(this.dataset.page);
                if (page && page !== currentPage) {
                    loadCategories(page);
                }
            });
        });
    }

    function loadCategories(page = 1) {
        console.log("Loading categories, page:", page); // 除錯訊息
        showLoading();
        currentPage = page;

        const url = new URL('get_categories.php', window.location.href);
        url.searchParams.set('page', page);
        if (currentSearch) {
            url.searchParams.set('search', currentSearch);
        }

        console.log("Fetching URL:", url.toString()); // 除錯訊息

        fetch(url)
            .then(response => {
                console.log("Response received:", response); // 除錯訊息
                if (!response.ok) throw new Error("伺服器錯誤");
                return response.json();
            })
            .then(data => {
                console.log("Data received:", data); // 除錯訊息
                if (data.success) {
                    // 渲染分類列表
                    categoryList.innerHTML = data.data.categories.map(category => 
                        renderCategory(category)
                    ).join('');

                    // 渲染分頁
                    renderPagination(data.data.pagination);
                } else {
                    throw new Error(data.message || "載入失敗");
                }
            })
            .catch(error => {
                console.error("載入失敗：", error);
                categoryList.innerHTML = `
                    <div class="col-12">
                        <div class="alert alert-danger text-center" role="alert">
                            載入分類時發生錯誤，請稍後再試
                        </div>
                    </div>
                `;
                pagination.innerHTML = '';
            });
    }

    // 搜尋功能
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            currentSearch = this.value.trim();
            
            // 延遲 300ms 再搜尋，避免頻繁請求
            searchTimeout = setTimeout(() => {
                loadCategories(1); // 重置到第一頁
            }, 300);
        });
    }

    // 處理新增分類表單提交
    const addCategoryForm = document.querySelector('#addCategoryModal form');
    const imageInput = document.getElementById('image');
    const previewImage = document.createElement('img');
    previewImage.style.width = '100px';
    previewImage.style.height = '100px';
    previewImage.style.objectFit = 'cover';
    previewImage.className = 'd-block mx-auto my-2';
    imageInput.parentNode.appendChild(previewImage);

    // 即時預覽圖片
    imageInput.addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                previewImage.src = e.target.result;
            };
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
                // 關閉 Modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('addCategoryModal'));
                modal.hide();
                
                // 重置表單
                addCategoryForm.reset();
                previewImage.src = '';
                
                // 顯示成功訊息
                Swal.fire({
                    title: '新增分類成功！',
                    icon: 'success',
                    showConfirmButton: false,
                    timer: 1500
                }).then(() => {
                    // 重新載入分類列表
                    loadCategories(1);
                });
            } else {
                throw new Error(data.message || '新增失敗');
            }
        })
        .catch(error => {
            console.error('錯誤:', error);
            Swal.fire({
                title: '新增分類失敗!',
                text: error.message || '請稍後再試',
                icon: 'error'
            });
        });
    });

    // 初始化載入
    console.log("Starting initial load"); // 除錯訊息
    loadCategories();
});
