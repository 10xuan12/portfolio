document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM Content Loaded - Category Projects"); // 除錯訊息

    const categoryId = document.getElementById("category-id");
    console.log("Category ID element:", categoryId); // 除錯訊息

    const portfolioList = document.querySelector(".portfolio-list");
    const pagination = document.querySelector(".pagination");
    let currentPage = 1;

    function showLoading() {
        portfolioList.innerHTML = `
            <div class="d-flex justify-content-center my-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">載入中...</span>
                </div>
            </div>
        `;
    }

    function renderPortfolio(portfolio) {
        return `
            <div class="card mb-3 shadow-sm portfolio-card animate__animated animate__fadeIn">
                <div class="row g-0">
                    <div class="col-md-2 d-flex align-items-center justify-content-center">
                        ${portfolio.cover_image ? 
                            `<img src="uploads/${portfolio.cover_image}" class="img-fluid rounded" alt="作品封面" style="max-height: 100px;">` :
                            `<div class="bg-light text-muted d-flex align-items-center justify-content-center" style="height: 100px; width: 100px;">無封面</div>`
                        }
                    </div>
                    <div class="col-md-8 d-flex flex-column justify-content-center p-3">
                        <h5>${portfolio.title}</h5>
                        <p class="text-muted">${portfolio.description}</p>
                    </div>
                    <div class="col-md-2 d-flex flex-column justify-content-center align-items-center gap-2">
                        <a href="work_detail.php?portfolio_id=${portfolio.portfolio_id}" class="btn btn-primary btn-sm">查看</a>
                        <a href="edit_portfolio.php?id=${portfolio.portfolio_id}" class="btn btn-outline-secondary btn-sm">編輯</a>
                    </div>
                </div>
            </div>
        `;
    }

    function renderPagination(paginationData) {
        const { current_page, total_pages } = paginationData;
        let html = `
            <nav aria-label="Page navigation">
                <ul class="pagination justify-content-center">
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
                </ul>
            </nav>
        `;

        pagination.innerHTML = html;

        // 綁定分頁按鈕事件
        document.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const page = parseInt(this.dataset.page);
                if (page && page !== current_page) {
                    loadPortfolios(page);
                }
            });
        });
    }

    function loadPortfolios(page = 1) {
        showLoading();
        currentPage = page;

        fetch(`get_portfolios.php?category_id=${categoryId.value}&page=${page}`)
            .then(response => {
                if (!response.ok) throw new Error("伺服器錯誤");
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // 渲染作品列表
                    portfolioList.innerHTML = data.data.portfolios.map(portfolio => 
                        renderPortfolio(portfolio)
                    ).join('');

                    // 渲染分頁
                    renderPagination(data.data.pagination);

                    // 加入動畫效果
                    applyCardHover();
                } else {
                    throw new Error(data.message || "載入失敗");
                }
            })
            .catch(error => {
                console.error("載入失敗：", error);
                portfolioList.innerHTML = `
                    <div class="alert alert-danger text-center" role="alert">
                        載入作品時發生錯誤，請稍後再試
                    </div>
                `;
                pagination.innerHTML = '';
            });
    }

    function applyCardHover() {
        const cards = document.querySelectorAll(".portfolio-list .card");
        cards.forEach(card => {
            card.addEventListener("mouseenter", () => {
                card.classList.add("shadow", "scale-up");
            });
            card.addEventListener("mouseleave", () => {
                card.classList.remove("shadow", "scale-up");
            });
        });
    }

    // 處理新增作品表單提交
    const addPortfolioForm = document.getElementById('addPortfolioForm');
    const submitPortfolioBtn = document.getElementById('submitPortfolio');
    const addPortfolioModal = document.getElementById('addPortfolioModal');

    console.log("Form elements:", { // 除錯訊息
        form: addPortfolioForm,
        button: submitPortfolioBtn,
        modal: addPortfolioModal
    });

    if (submitPortfolioBtn) {
        console.log("Adding click event listener to submit button"); // 除錯訊息
        submitPortfolioBtn.addEventListener('click', function() {
            console.log("Submit button clicked"); // 除錯訊息
            const formData = new FormData(addPortfolioForm);
            
            // 顯示載入中
            submitPortfolioBtn.disabled = true;
            submitPortfolioBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 處理中...';

            console.log("Sending fetch request"); // 除錯訊息
            fetch('create_portfolio.php', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                console.log("Response received:", response); // 除錯訊息
                return response.json();
            })
            .then(data => {
                console.log("Data received:", data); // 除錯訊息
                if (data.success) {
                    // 關閉 Modal
                    const modal = bootstrap.Modal.getInstance(addPortfolioModal);
                    modal.hide();
                    
                    // 顯示成功訊息
                    Swal.fire({
                        icon: 'success',
                        title: '新增作品成功唷',
                        text: data.message,
                        confirmButtonColor: '#3085d6'
                    }).then(() => {
                        // 重新載入作品列表
                        loadPortfolios(currentPage);
                        // 重置表單
                        addPortfolioForm.reset();
                    });
                } else {
                    // 顯示錯誤訊息
                    Swal.fire({
                        icon: 'error',
                        title: '錯誤',
                        text: data.message,
                        confirmButtonColor: '#3085d6'
                    });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: '錯誤',
                    text: '發生錯誤，請稍後再試',
                    confirmButtonColor: '#3085d6'
                });
            })
            .finally(() => {
                // 恢復按鈕狀態
                submitPortfolioBtn.disabled = false;
                submitPortfolioBtn.innerHTML = '新增';
            });
        });
    }

    // Modal 關閉時重置表單
    if (addPortfolioModal) {
        addPortfolioModal.addEventListener('hidden.bs.modal', function () {
            addPortfolioForm.reset();
            submitPortfolioBtn.disabled = false;
            submitPortfolioBtn.innerHTML = '新增';
        });
    }

    // 初始化載入
    loadPortfolios();
});
