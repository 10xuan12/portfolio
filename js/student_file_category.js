document.addEventListener('DOMContentLoaded', function () {
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
        
                Swal.fire({
                    title: '新增成功！',
                    icon: 'success',
                    showConfirmButton: false,
                    timer: 1500
                });
        
                const modal = bootstrap.Modal.getInstance(document.getElementById('addCategoryModal'));
                modal.hide();
                addCategoryForm.reset();
                previewImage.src = '';
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
            Swal.fire({
                title: '連線錯誤',
                text: '無法新增分類，請稍後再試',
                icon: 'error'
            });
        });
    });

    function addCardToPage(category) {
        const newCol = document.createElement('div');
        newCol.className = 'col'; // 一列一格
    
        const imageUrl = category.image_url || 'https://via.placeholder.com/150';
        const description = category.description || '這裡是簡短介紹～';
        const id = category.id || generateIdFromName(category.name);
    
        newCol.innerHTML = `
            <div class="card text-center p-3 h-100 shadow-sm animate-card">
                <img src="${imageUrl}" class="card-img-top mx-auto" style="width: 100px; height: 100px; object-fit: cover;" alt="Category Image">
                <div class="card-body">
                    <h5 class="card-title">${category.name}</h5>
                    <p class="card-text">${description}</p>
                    <a href="category.php?id=${id}" class="btn btn-primary mt-2">查看作品</a>
                </div>
            </div>
        `;
    
        const cardContainer = document.getElementById('cardContainer');
        if (cardContainer) {
            cardContainer.prepend(newCol);
    
            // 加入動畫class
            const card = newCol.querySelector('.card');
            setTimeout(() => {
                card.classList.add('show');
            }, 10);
        } else {
            console.error('找不到 cardContainer');
        }
    }
    

    // 如果後端沒給 id，自己產一個（名稱轉小寫+隨機數）
    function generateIdFromName(name) {
        const randomSuffix = Math.floor(Math.random() * 10000);
        return name.trim().toLowerCase().replace(/\s+/g, '-') + '-' + randomSuffix;
    }
});
