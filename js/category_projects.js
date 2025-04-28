document.addEventListener("DOMContentLoaded", function() {
    const itemsPerPage = 5; // 每頁顯示幾筆
    const cards = document.querySelectorAll(".portfolio-list .card");
    const pagination = document.querySelector(".pagination");

    let currentPage = 1;
    const totalPages = Math.ceil(cards.length / itemsPerPage);

    function showPage(page) {
        currentPage = page;
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;

        cards.forEach((card, index) => {
            if (index >= start && index < end) {
                card.style.display = "block";
            } else {
                card.style.display = "none";
            }
        });

        renderPagination();
    }

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

    // 初始化
    showPage(1);
});
