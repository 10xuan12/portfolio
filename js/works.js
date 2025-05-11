document.addEventListener('DOMContentLoaded', function () {
    // 搜尋功能
    const searchInput = document.getElementById('search');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const query = this.value;
            window.location.href = `works.php?search=${encodeURIComponent(query)}`;
        });
    }
});
  