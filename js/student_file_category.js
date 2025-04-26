document.addEventListener('DOMContentLoaded', function () {
    const addCategoryForm = document.querySelector('#addCategoryModal form');

    addCategoryForm.addEventListener('submit', function (e) {
        e.preventDefault(); // 阻止表單預設送出行為

        const formData = new FormData(this);

        fetch('add_category.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                addCardToPage(data.category);
        
                // 成功提示
                Swal.fire({
                    title: '新增成功！',
                    icon: 'success',
                    showConfirmButton: false,
                    timer: 1500
                });
        
                // 關閉 Modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('addCategoryModal'));
                modal.hide();
        
                // 清空表單
                addCategoryForm.reset();
            } else {
                Swal.fire({
                    title: '新增失敗',
                    text: data.message || '請稍後再試',
                    icon: 'error'
                });
            }
        })        
        .catch(error => {
            console.error('錯誤:', error);
        });
    });

    function addCardToPage(category) {
        const newCard = document.createElement('div');
        newCard.className = 'card text-center p-3';
    
        newCard.innerHTML = `
            <img src="images/411146708.pdf" class="card-img-top mx-auto" style="width: 100px; height: 100px;" alt="Category Image">
            <div class="card-body">
                <h5 class="card-title">${category.name}</h5>
                <p class="card-text">這裡是簡短介紹～</p>
                <a href="category.php?id=${category.id}" class="btn btn-primary mt-2">查看作品</a>
            </div>
        `;
    
        const cardContainer = document.getElementById('cardContainer'); // 放卡片的div
        cardContainer.prepend(newCard); // 新增在最前面
    }
    
});
