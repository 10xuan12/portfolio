<?php 
session_start();
require '../includes/db_connect.php';

if (!isset($_SESSION['email'])) {
    header("Location: /portfolio/login.php");
    exit();
}

$email = $_SESSION['email'];
$sql = "SELECT * FROM student_profiles WHERE email = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $student_data = $result->fetch_assoc();
    $required_fields = ['name', 'email'];
    foreach ($required_fields as $field) {
        if (empty($student_data[$field])) {
            header("Location: /portfolio/student/student.php?need_info=1");
            exit();
        }
    }
} else {
    header("Location: /portfolio/student/student.php?need_info=1");
    exit();
}
$conn->close();
?>

<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <title>學生主頁</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- Bootstrap + Icons -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" rel="stylesheet">
    <style>
        body {
            background-color: #f9f9f9;
        }
        .sidebar {
            background-color: #babcbd; /* 淺灰色背景 */
            height: 100vh;
            padding-top: 20px;
            position: fixed;
            top: 0;
            left: 0;
            width: 100px;
            font-family: 'Comic Sans MS', sans-serif; /* 可愛的字體 */
            transition: width 0.3s ease; /* 添加過渡效果，平滑收合側邊欄 */
        }
        .sidebar .nav-link {
            color: #000000; /* 黑色文字 */
            font-weight: bold; /* 字體加粗 */
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 10px 0;
        }

        .sidebar .nav-link i {
            font-size: 1.5rem; /* 圖示大小 */
            margin-bottom: 8px; /* 圖示與文字間距 */
        }

        .sidebar .nav-link:hover {
            background-color: #6e3ced; /* 滑鼠懸停時的背景色 */
            color: #ffffff;
            border-radius: 5px;
        }

        .main-content {
            margin-left: 100px; /* 主內容不會被側邊欄擋住 */
            padding: 20px;
        }   
        .profile-img {
            width: 120px;
            height: 120px;
            object-fit: cover;
            border-radius: 50%;
            border: 3px solid #5d73a9;
        }
        .info-box {
            background-color: #f7f3f3;
            border-radius: 10px;
            padding: 15px;
        }
        .section-title {
            background-color: #5d73a9;
            color: white;
            display: inline-block;
            padding: 6px 12px;
            border-radius: 5px;
            margin-bottom: 10px;
        }
        .btn-edit {
            border-radius: 30px;
            background-color: #5d73a9;
            color: #fafafa;
        }
        .text-primary {
            color: #000000; /* 黑色文字 */
            font-weight: bold; /* 字體加粗 */
            font-family: 'Comic Sans MS', sans-serif; /* 可愛的字體 */
        }
    </style>
</head>
<body>

<div class="container-fluid">
    <div class="row">
        <!-- 側邊欄 -->
    <nav class="col-auto col-md-3 col-lg-2 sidebar">
        <ul class="nav nav-pills flex-column">
          <li class="nav-item">
            <a href="student_dashboard_view.php" class="nav-link active">
              <i class="bi bi-house"></i>
              <span>個人主頁</span>
            </a>
          </li>
          <li class="nav-item">
            <a href="student_file_category.php" class="nav-link">
              <i class="bi bi-collection"></i>
              <span>作品集</span>
            </a>
          </li>
          <li class="nav-item">
            <a href="#" class="nav-link">
              <i class="bi bi-bell"></i>
              <span>通知</span>
            </a>
          </li>
          <li class="nav-item">
            <a href="#" class="nav-link">
              <i class="bi bi-gear"></i>
              <span>設定</span>
            </a>
          </li>
          <li class="nav-item">
            <a href="../login.html" class="nav-link">
              <i class="bi bi-box-arrow-right"></i>
              <span>登出</span>
            </a>
          </li>
        </ul>
    </nav>

        <!-- 主內容 -->
        <div class="col-md-10 py-5 px-4" style="background-color: #fff; border-radius: 15px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); margin: 20px auto;">
            <?php if (isset($_GET['saved']) && $_GET['saved'] == 1): ?>
                <div class="alert alert-success text-center" id="successMessage">
                    ✅ 資料儲存成功！
                </div>
            <?php elseif (isset($_GET['need_info']) && $_GET['need_info'] == 1): ?>
                <div class="alert alert-warning text-center" id="warningMessage">
                    ⚠️ 尚未填寫完整資料，請先完成基本資料填寫。
                </div>
            <?php endif; ?>

            <!-- 基本資料卡 -->
            <div class="d-flex align-items-center mb-4">
                <div class="me-4">
                    <?php if (!empty($student_data['profile_picture'])): ?>
                        <img src="uploads/<?php echo htmlspecialchars($student_data['profile_picture']); ?>" alt="頭像" class="profile-img shadow">
                    <?php else: ?>
                        <img src="https://via.placeholder.com/120" alt="預設頭像" class="profile-img shadow">
                    <?php endif; ?>
                </div>
                <div>
                    <h4 class="mb-1 fw-bold text-primary"><?php echo htmlspecialchars($student_data['name']); ?></h4>
                    <p class="mb-1 text-muted"><?php echo htmlspecialchars($student_data['department']); ?> | <?php echo htmlspecialchars($student_data['address']); ?></p>
                    <a href="student_edit_form.php" class="btn btn-primary btn-sm btn-edit rounded-pill px-4">
                        <i class="bi bi-pencil-square"></i> 編輯
                    </a>
                </div>
            </div>

            <!-- 個人簡介 -->
            <div class="mb-4">
                <h5 class="section-title">個人簡介</h5>
                <div class="info-box shadow-sm">
                    <p class="mb-0"><?php echo nl2br(htmlspecialchars($student_data['bio'] ?? '尚未填寫個人簡介')); ?></p>
                </div>
            </div>

            <!-- 聯絡資訊 -->
            <div class="mb-4">
                <h5 class="section-title">聯絡方式與社群</h5>
                <div class="info-box shadow-sm row row-cols-1 row-cols-md-2 g-3">
                    <div><i class="bi bi-github me-2"></i><?php echo htmlspecialchars($student_data['github']); ?></div>
                    <div><i class="bi bi-instagram me-2"></i><?php echo htmlspecialchars($student_data['instagram']); ?></div>
                    <div><i class="bi bi-facebook me-2"></i><?php echo htmlspecialchars($student_data['facebook']); ?></div>
                    <div><i class="bi bi-envelope me-2"></i><?php echo htmlspecialchars($student_data['email']); ?></div>
                    <div><i class="bi bi-phone me-2"></i><?php echo htmlspecialchars($student_data['phone']); ?></div>
                </div>
            </div>

            <!-- 專業背景 -->
            <div>
                <h5 class="section-title">專業背景</h5>
                <div class="info-box shadow-sm">
                    <p><strong>技能：</strong> <?php echo htmlspecialchars($student_data['skills']); ?></p>
                    <p><strong>語言能力：</strong> <?php echo htmlspecialchars($student_data['languages']); ?></p>
                    <p><strong>最高學歷：</strong> <?php echo htmlspecialchars($student_data['school']); ?></p>
                </div>
            </div>

            <div class="card p-4 mt-4">
                <h4>AI 履歷產生器</h4>
                <div class="col-md-4">
                <label for="resumeLanguage" class="form-label">履歷語言</label>
                <select id="resumeLanguage" class="form-select">
                    <option value="中文">中文</option>
                    <option value="English">English</option>
                </select>
                </div>
                <div class="col-md-8">
                <label for="resumePosition" class="form-label">應徵職位</label>
                <input type="text" id="resumePosition" class="form-control" placeholder="輸入職位名稱，例如：前端工程師">
                </div>
                <button id="generateResumeBtn" class="btn btn-primary">產生履歷</button>

                <div id="resumeResult" class="mt-4" style="display: none;">
                    <h5>📄 GPT 產生的履歷</h5>
                    <pre id="resumeText" class="bg-light p-3 rounded" style="white-space: pre-wrap;"></pre>

                    <h5 class="mt-4">✨ GPT 建議強化關鍵字</h5>
                    <ul id="keywordSuggestions" class="list-group"></ul>

                    <a id="downloadLink" class="btn btn-success mt-3" href="#" download="resume.pdf">下載 PDF</a>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Bootstrap & JS -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
<script>
    setTimeout(() => {
        const success = document.getElementById('successMessage');
        const warning = document.getElementById('warningMessage');
        if (success) success.style.opacity = 0;
        if (warning) warning.style.opacity = 0;
    }, 3000);
    // 修改後的 fetch 代碼，添加錯誤處理
document.getElementById('generateResumeBtn').addEventListener('click', function () {
    const language = document.getElementById('resumeLanguage').value;
    const position = document.getElementById('resumePosition').value;

    if (!position.trim()) {
        alert('請輸入應徵職位名稱');
        return;
    }

    const formData = new FormData();
    formData.append('language', language);
    formData.append('position', position);

    // 顯示 loading
    const resultDiv = document.getElementById('resumeResult');
    resultDiv.style.display = 'block';
    document.getElementById('resumeText').innerText = '正在產生中，請稍候...';
    document.getElementById('keywordSuggestions').innerHTML = '';
    document.getElementById('downloadLink').style.display = 'none';

    fetch('generate_resume.php', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        // 檢查 response 是否成功
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // 檢查 Content-Type 是否為 application/json
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            // 如果不是 JSON，先獲取文本內容，然後拋出錯誤
            return response.text().then(text => {
                throw new Error(`預期 JSON 格式，但收到: ${text}`);
            });
        }
        
        return response.json();
    })
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        
        document.getElementById('resumeText').innerText = data.resume_text || '無內容';
        
        const ul = document.getElementById('keywordSuggestions');
        ul.innerHTML = '';
        (data.keyword_suggestions || '').split('\n').forEach(kw => {
            if (kw.trim()) {
                const li = document.createElement('li');
                li.className = 'list-group-item';
                li.textContent = kw.trim();
                ul.appendChild(li);
            }
        });

        // 建立下載連結
        const link = document.getElementById('downloadLink');
        link.href = 'generate_resume.php?download_pdf=1&language=' + encodeURIComponent(language) + '&position=' + encodeURIComponent(position);
        link.style.display = 'inline-block';
    })
    .catch(error => {
        document.getElementById('resumeText').innerText = '產生失敗：' + error.message;
        console.error('錯誤：', error);
    });
});
</script>
</body>
</html>
