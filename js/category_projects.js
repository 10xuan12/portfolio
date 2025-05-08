document.addEventListener("DOMContentLoaded", function () {
    const categoryId = document.getElementById("category-id").value; // 用 hidden input 傳入
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

    function loadPortfolios(page = 1) {
        showLoading();

        fetch(`get_portfolios.php?category_id=${categoryId}&page=${page}`)
            .then(response => {
                if (!response.ok) throw new Error("伺服器錯誤");
                return response.text();
            })
            .then(data => {
                portfolioList.innerHTML = data;
                currentPage = page;
                setupPagination(); // 重新綁定分頁按鈕
                applyCardHover();  // 加入 hover 效果
            })
            .catch(error => {
                portfolioList.innerHTML = "";
                Swal.fire({
                    icon: "error",
                    title: "發生錯誤",
                    text: "載入作品時發生錯誤，請稍後再試",
                    confirmButtonColor: "#3085d6"
                });
                console.error("載入失敗：", error);
            });
    }

    function setupPagination() {
        const pageLinks = document.querySelectorAll(".page-link-btn");
        pageLinks.forEach(link => {
            link.addEventListener("click", function (e) {
                e.preventDefault();
                const page = parseInt(this.dataset.page);
                if (page !== currentPage) {
                    loadPortfolios(page);
                }
            });
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

    // 初始化
    loadPortfolios();
});
