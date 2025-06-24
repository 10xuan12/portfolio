document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM Content Loaded - Works Page");

    const portfolioList = document.getElementById('portfolio-list');
    const pagination = document.getElementById('pagination');
    const searchInput = document.getElementById('search');
    let currentPage = 1;
    let isLoading = false;

    function showLoading() {
        portfolioList.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">載入中...</span>
                </div>
                <p class="mt-2">載入中...</p>
            </div>
        `;
    }

    function renderPortfolio(portfolio) {
        console.log('Rendering portfolio:', portfolio);
        
        // 檢查圖片路徑
        let coverImage;
        const defaultImage = 'https://placehold.co/300x200/e9ecef/495057?text=No+Image';
        
        if (portfolio.cover_image) {
            // 確保路徑正確，使用相對於網站根目錄的路徑
            if (portfolio.cover_image.startsWith('/')) {
                coverImage = portfolio.cover_image;
            } else if (portfolio.cover_image.startsWith('uploads/')) {
                coverImage = '/portfolio/student/' + portfolio.cover_image;
            } else {
                coverImage = '/portfolio/student/uploads/' + portfolio.cover_image;
            }
            console.log('Cover image path:', coverImage);
        } else {
            coverImage = defaultImage;
            console.log('Using default image');
        }
            
        return `
            <div class="col-12 col-sm-6 col-lg-4 animate__animated animate__fadeIn">
                <div class="card h-100 shadow-sm">
                    <img src="${coverImage}" 
                         class="card-img-top" 
                         alt="${portfolio.title}"
                         onerror="this.onerror=null; this.src='${defaultImage}';"
                         style="height: 200px; object-fit: cover;">
                    <div class="card-body text-center">
                        <h5 class="card-title">${portfolio.title}</h5>
                        <p class="card-text">${portfolio.description}</p>
                        <a href="work_detail.php?portfolio_id=${portfolio.portfolio_id}" class="btn btn-outline-primary mt-2">查看作品</a>
                    </div>
                </div>
            </div>
        `;
    }

    // 使用事件委派處理分頁按鈕點擊
    pagination.addEventListener('click', function(e) {
        e.preventDefault();
        const pageLink = e.target.closest('.page-link');
        if (!pageLink) return;

        const page = parseInt(pageLink.dataset.page);
        console.log('Page link clicked:', page, 'Current page:', currentPage);

        if (!pageLink.parentElement.classList.contains('disabled') && page !== currentPage) {
            console.log('Changing page to:', page);
            currentPage = page;
            loadPortfolios();
        }
    });

    function renderPagination(currentPage, totalPages) {
        console.log('Rendering pagination:', { currentPage, totalPages });
        
        let paginationHtml = '';
        
        // 上一頁按鈕
        paginationHtml += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${currentPage - 1}">上一頁</a>
            </li>
        `;

        // 頁碼按鈕
        for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
            paginationHtml += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }

        // 下一頁按鈕
        paginationHtml += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${currentPage + 1}">下一頁</a>
            </li>
        `;

        pagination.innerHTML = paginationHtml;
    }

    async function loadPortfolios() {
        if (isLoading) {
            console.log('Already loading, skipping...');
            return;
        }
        
        isLoading = true;
        console.log('Loading portfolios, page:', currentPage);

        showLoading();
        const search = searchInput ? searchInput.value.trim() : '';
        const url = new URL('get_all_portfolios.php', window.location.href);
        url.searchParams.set('page', currentPage);
        if (search) {
            url.searchParams.set('search', search);
        }

        try {
            console.log('Fetching URL:', url.toString());
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            console.log('Response received:', response);
            const data = await response.json();
            console.log('Data received:', data);

            if (data.success) {
                const { portfolios, pagination } = data.data;
                console.log('Pagination data:', pagination);
                
                if (portfolios.length === 0) {
                    portfolioList.innerHTML = `
                        <div class="col-12 text-center py-5">
                            <p class="text-muted">沒有找到作品</p>
                        </div>
                    `;
                } else {
                    portfolioList.innerHTML = portfolios.map(renderPortfolio).join('');
                }

                renderPagination(pagination.current_page, pagination.total_pages);
            } else {
                throw new Error(data.message || '載入失敗');
            }
        } catch (error) {
            console.error('Error:', error);
            portfolioList.innerHTML = `
                <div class="col-12 text-center py-5">
                    <p class="text-danger">載入失敗，請稍後再試</p>
                </div>
            `;
            pagination.innerHTML = '';
        } finally {
            isLoading = false;
        }
    }

    // 搜尋功能
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentPage = 1;
                loadPortfolios();
            }, 500);
        });
    }

    // 處理新增作品表單提交
    const addPortfolioForm = document.getElementById('addPortfolioForm');
    const submitPortfolioBtn = document.getElementById('submitPortfolio');
    const addPortfolioModal = document.getElementById('addPortfolioModal');

    if (addPortfolioForm) {
        // 驗證表單資料
        function validateForm(formData) {
            const title = formData.get('title')?.trim();
            const description = formData.get('description')?.trim();
            const category_id = formData.get('category_id');
            const cover_image = formData.get('cover_image');
            const project_files = formData.getAll('project_files[]');

            if (!title) {
                throw new Error('請輸入作品標題');
            }
            if (!description) {
                throw new Error('請輸入作品描述');
            }
            if (!category_id || category_id === '0') {
                throw new Error('請選擇作品分類');
            }
            if (cover_image && cover_image.size > 0) {
                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                if (!allowedTypes.includes(cover_image.type)) {
                    throw new Error('封面圖片格式不正確，請上傳 JPG、PNG、GIF 或 WEBP 格式的圖片');
                }
                if (cover_image.size > 5 * 1024 * 1024) { // 5MB
                    throw new Error('封面圖片大小不能超過 5MB');
                }
            }
            if (project_files.length > 0) {
                for (const file of project_files) {
                    if (file.size > 10 * 1024 * 1024) { // 10MB
                        throw new Error('檔案大小不能超過 10MB');
                    }
                }
            }
        }

        // 處理表單提交
        addPortfolioForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (submitPortfolioBtn.disabled) {
                return;
            }

            const formData = new FormData(this);
            
            try {
                // 驗證表單資料
                validateForm(formData);

                // 更新按鈕狀態
                submitPortfolioBtn.disabled = true;
                submitPortfolioBtn.innerHTML = `
                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    處理中...
                `;

                // 發送請求
                const response = await fetch('create_portfolio.php', {
                    method: 'POST',
                    body: formData
                });

                // 檢查回應狀態
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                // 解析 JSON 回應
                let result;
                try {
                    result = await response.json();
                } catch (e) {
                    console.error('JSON parse error:', e);
                    throw new Error('伺服器回應格式錯誤');
                }

                if (result.success) {
                    // 成功處理
                    await Swal.fire({
                        icon: 'success',
                        title: '成功！',
                        text: '作品已成功新增',
                        showConfirmButton: false,
                        timer: 1500
                    });

                    // 關閉 Modal
                    const modal = bootstrap.Modal.getInstance(addPortfolioModal);
                    modal.hide();
                    
                    // 重置表單
                    this.reset();
                    
                    // 重新載入作品列表
                    currentPage = 1;
                    await loadPortfolios();
                } else {
                    throw new Error(result.message || '新增失敗');
                }
            } catch (error) {
                console.error('Error:', error);
                await Swal.fire({
                    icon: 'error',
                    title: '錯誤！',
                    text: error.message || '新增作品時發生錯誤，請稍後再試'
                });
            } finally {
                // 恢復按鈕狀態
                submitPortfolioBtn.disabled = false;
                submitPortfolioBtn.innerHTML = '新增';
            }
        });
    }

    // 當 Modal 關閉時重置表單
    if (addPortfolioModal) {
        addPortfolioModal.addEventListener('hidden.bs.modal', function() {
            if (addPortfolioForm) {
                addPortfolioForm.reset();
                submitPortfolioBtn.disabled = false;
                submitPortfolioBtn.innerHTML = '新增';
                
                // 清除錯誤訊息
                const errorElements = addPortfolioForm.querySelectorAll('.is-invalid');
                errorElements.forEach(el => el.classList.remove('is-invalid'));
            }
        });
    }

    // 初始載入
    console.log('Starting initial load');
    loadPortfolios();
});
  