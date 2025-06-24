<<<<<<< HEAD:enterprise/enterprise_dashboard.php
<?php 
=======
<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
>>>>>>> 2806a0fdbc26555cdf20b6851f2876aad734e0a5:enterprise/homepage/enterprise_dashboard.php
session_start();
require '../includes/db_connect.php';

<<<<<<< HEAD:enterprise/enterprise_dashboard.php
if (!isset($_SESSION['email'])) {
    header("Location: /portfolio/login.php");
    exit();
=======
$_SESSION['user_id'] = 1;

require $_SERVER['DOCUMENT_ROOT'] . '/portfolio/enterprise/config/enterprise.php';

$db  = new \Config\EnterpriseDB();
$pdo = $db->getConnection();


$user_id       = $_SESSION['user_id'];

// 取得用戶資料
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id");
$stmt->execute(['id' => $user_id]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_profile'])) {
  // 上傳目錄
  $uploadDir = __DIR__ . '/uploads/';
  if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

  // 處理頭像上傳
  if (!empty($_FILES['avatar']['name'])) {
      $ext     = strtolower(pathinfo($_FILES['avatar']['name'], PATHINFO_EXTENSION));
      $allowed = ['jpg','jpeg','png','gif','webp'];
      if (in_array($ext, $allowed)) {
          $fn     = uniqid() . '.' . $ext;
          $target = $uploadDir . $fn;
          if (move_uploaded_file($_FILES['avatar']['tmp_name'], $target)) {
              // 存資料庫為相對路徑
              $pdo->prepare("UPDATE users SET avatar = :avatar WHERE id = :id")
                  ->execute([
                      'avatar' => 'uploads/' . $fn,
                      'id'     => $user_id
                  ]);
          }
      }
  }

  // 更新其他欄位
  $pdo->prepare("
      UPDATE users
         SET company_name = :cn,
             username     = :un,
             address      = :addr,
             bio          = :bio,
             is_online    = 1
       WHERE id = :id
  ")->execute([
      'cn'   => trim($_POST['company_name']),
      'un'   => trim($_POST['username']),
      'addr' => trim($_POST['address']),
      'bio'  => trim($_POST['bio']),
      'id'   => $user_id
  ]);

  header("Location: " . $_SERVER['PHP_SELF']);
  exit;
>>>>>>> 2806a0fdbc26555cdf20b6851f2876aad734e0a5:enterprise/homepage/enterprise_dashboard.php
}

$email = $_SESSION['email'];
$sql = "SELECT * FROM company_profiles WHERE email = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $company_data = $result->fetch_assoc();
    $required_fields = ['name', 'email'];
    foreach ($required_fields as $field) {
        if (empty($company_data[$field])) {
            header("Location: /portfolio/enterprise/enterprise.php?need_info=1");
            exit();
        }
    }
} else {
    header("Location: /portfolio/enterprise/enterprise.php?need_info=1");
    exit();
}
<<<<<<< HEAD:enterprise/enterprise_dashboard.php
$conn->close();
=======

$stmt->execute();
$jobs = $stmt->fetchAll(PDO::FETCH_ASSOC);

$fullPath = $_SERVER['PHP_SELF'];
$current = basename($fullPath);


>>>>>>> 2806a0fdbc26555cdf20b6851f2876aad734e0a5:enterprise/homepage/enterprise_dashboard.php
?>

<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>企業主頁</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
</head>
<body class="bg-white font-sans text-black">
  <div class="flex min-h-screen">

    <!-- 左側欄 -->
<nav class="flex flex-col items-center bg-gray-300 w-14 py-6 space-y-6 shadow-md border-r">
  <!-- 主頁 -->
  <a href="/portfolio/enterprise/enterprise_dashboard.php"
     class="flex flex-col items-center w-14 h-14 justify-center
       <?= $current === 'enterprise_dashboard.php'
           ? 'text-white bg-blue-700'
           : 'text-black hover:bg-gray-400' ?>">
    <i class="fas fa-user-circle text-xl"></i>
    <span class="text-xs mt-1">主頁</span>
  </a>

  <!-- 瀏覽 -->
  <a href="/portfolio/enterprise/browseportfolio/enterprise_portfolio.php"
     class="flex flex-col items-center w-14 h-14 justify-center
       <?= $current === 'enterprise_portfolio.php'
           ? 'text-white bg-blue-700'
           : 'text-black hover:bg-gray-400' ?>">
    <i class="fas fa-folder text-xl"></i>
    <span class="text-xs mt-1">瀏覽</span>
  </a>

  <!-- 通知 -->
  <a href="/portfolio/enterprise/notifications/notification.php"
     class="flex flex-col items-center w-14 h-14 justify-center
       <?= $current === 'notification.php'
           ? 'text-white bg-blue-700'
           : 'text-black hover:bg-gray-400' ?>">
    <i class="fas fa-bell text-xl"></i>
    <span class="text-xs mt-1">通知</span>
  </a>

  <!-- 設定 -->
  <a href="/portfolio/enterprise/setting.php"
     class="flex flex-col items-center w-14 h-14 justify-center
       <?= $current === 'setting.php'
           ? 'text-white bg-blue-700'
           : 'text-black hover:bg-gray-400' ?>">
    <i class="fas fa-cog text-xl"></i>
    <span class="text-xs mt-1">設定</span>
  </a>

  <!-- 登出（不需要 active 樣式）-->
  <form method="post" action="/portfolio/enterprise/loginout.php">
    <button type="submit"
            class="flex flex-col items-center w-14 h-14 justify-center text-black hover:bg-gray-400">
      <i class="fas fa-sign-out-alt text-xl"></i>
      <span class="text-xs mt-1">登出</span>
    </button>
  </form>
</nav>

    <!-- ✅ 右側主內容 -->
    <main class="flex-1 p-6 overflow-y-auto max-w-5xl mx-auto">

 

    <!-- 頭像與公司資料 -->
<section class="flex items-start space-x-6 mb-6">
<<<<<<< HEAD:enterprise/enterprise_dashboard.php
  <div>
    <img src="https://via.placeholder.com/120" alt="頭像" class="w-24 h-24 rounded-full object-cover border-2 border-gray-300 shadow-md">
  </div>
=======
<img
  id="display-avatar"
  src="uploads/<?php echo htmlspecialchars(basename($user['avatar'])); ?>?t=<?php echo time(); ?>"
  class="w-24 h-24 rounded-full object-cover border-2 border-gray-300 shadow-md">

>>>>>>> 2806a0fdbc26555cdf20b6851f2876aad734e0a5:enterprise/homepage/enterprise_dashboard.php
  <div class="flex-1">
    <h2 class="text-base font-bold">
      <?php echo htmlspecialchars($company['name'] ?? '企業名稱'); ?>
    </h2>
    <p class="text-sm text-gray-600 mb-2">
      <?php echo htmlspecialchars($company['email']); ?>
    </p>
    <p class="text-sm text-gray-600 mb-2">
      公司ID: <?php echo htmlspecialchars($company['company_id']); ?>
    </p>
    <p class="text-sm text-gray-600 mb-2">
      建立時間: <?php echo htmlspecialchars($company['created_at']); ?>
    </p>
    <p class="text-sm text-gray-600 mb-2">
      更新時間: <?php echo htmlspecialchars($company['updated_at']); ?>
    </p>
  </div>
</section>

     


      

<!-- Modal 編輯表單 -->
<div id="modal" class="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center hidden">
  <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
    <!-- 關閉按鈕 -->
    <button type="button" onclick="closeEditModal()"
            class="absolute top-2 right-2 text-gray-500 hover:text-gray-800">
      <i class="fas fa-times"></i>
    </button>
    <form method="post" enctype="multipart/form-data" id="edit-form" class="space-y-4">
      <h2 class="text-base font-bold">編輯企業基本資料</h2>

      <!-- 企業名稱 -->
      <label class="block">
        <span class="text-xs font-medium">企業名稱：</span>
        <input
          id="input-company-name"
          name="company_name"
          type="text"
          class="w-full border p-2 rounded"
          placeholder="請輸入企業名稱"
        >
      </label>

      <!-- 公司地址 -->
      <label class="block">
        <span class="text-xs font-medium">公司地址：</span>
        <input
          id="input-address"
          name="address"
          type="text"
          class="w-full border p-2 rounded"
          placeholder="請輸入公司地址"
        >
      </label>

      <!-- 上傳頭像（可預覽） -->
      <label class="block">
        <span class="text-xs font-medium">上傳頭像：</span>
        <input
          id="input-avatar"
          name="avatar"
          type="file"
          accept="image/*"
          class="w-full"
        >
      </label>

      <!-- 簡介 -->
      <label class="block">
        <span class="text-xs font-medium">簡介：</span>
        <textarea
          id="input-bio"
          name="bio"
          rows="3"
          class="w-full border p-2 rounded"
          placeholder="請輸入公司簡介"
        ></textarea>
      </label>

      <!-- 按鈕群 -->
      <div class="flex justify-end space-x-2">
        <button type="button" onclick="closeEditModal()"
                class="px-4 py-2 border rounded hover:bg-gray-100">
          取消
        </button>
        <button type="submit" name="update_profile"
                class="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800">
          儲存
        </button>
      </div>
    </form>
  </div>
</div>

           
<!-- 企業簡介顯示區塊 -->
<?php if (!empty($company['bio'])): ?>
  <section class="bg-white border-l-4 border-indigo-400 p-4 rounded shadow mb-6">
    <h3 class="text-sm font-bold text-indigo-700 mb-2">企業簡介</h3>
    <p class="text-sm text-gray-800 leading-relaxed"><?php echo nl2br(htmlspecialchars($company['bio'])); ?></p>
  </section>
<?php endif; ?>

<!-- 聯絡方式區塊 -->
<section class="bg-pink-50 rounded-md p-6 mb-6
                grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3
                gap-y-4 gap-x-6 text-xs font-semibold">

  <!-- GitHub -->
  <div class="flex items-center space-x-2">
    <i class="fab fa-github"></i>
    <a href="https://github.com/<?php echo htmlspecialchars($company['github'] ?? ''); ?>"
       target="_blank"
       class="hover:underline">
      <?php echo htmlspecialchars($company['github'] ?? ''); ?>GitHub
    </a>
  </div>

  <!-- LinkedIn -->
  <div class="flex items-center space-x-2">
    <i class="fab fa-linkedin"></i>
    <a href=https://www.linkedin.com/login/zh-tw<?php echo htmlspecialchars($company['linkedin'] ?? ''); ?>"
       target="_blank"
       class="hover:underline">
      <?php echo htmlspecialchars($company['linkedin'] ?? ''); ?>LinkedIn
    </a>
  </div>

  <!-- Email -->
  <div class="flex items-center space-x-2">
    <i class="fas fa-envelope"></i>
    <a href=https://accounts.google.com/<?php echo htmlspecialchars($company['email'] ?? ''); ?>
       target="_blank"
       class="hover:underline">
      <?php echo htmlspecialchars($company['email'] ?? ''); ?>email
    </a>
  </div>

  <!-- Instagram -->
  <div class="flex items-center space-x-2">
    <i class="fab fa-instagram"></i>
    <a href=https://www.instagram.com/<?php echo htmlspecialchars($company['instagram'] ?? ''); ?>
    target="_blank"
       class="hover:underline">
      <?php echo htmlspecialchars($company['instagram'] ?? ''); ?>instagram 
    </a>
  </div>

  <!-- Facebook -->
  <div class="flex items-center space-x-2">
    <i class="fab fa-facebook-f"></i>
    <a href="https://facebook.com/<?php echo htmlspecialchars($company['facebook'] ?? ''); ?>"
       target="_blank"
       class="hover:underline">
      <?php echo htmlspecialchars($company['facebook'] ?? ''); ?> Facebook
    </a>
  </div>

  <!-- 電話 -->
  <div class="flex items-center space-x-2">
    <i class="fas fa-phone-alt"></i>
    <span>0423567777<?php echo htmlspecialchars($company['phone'] ?? ''); ?></span>
  </div>

  <!-- 檔案瀏覽次數 -->
  <div class="col-span-full text-right text-sm mt-2">
    瀏覽次數
    <span class="font-bold text-blue-800">
      <?php echo htmlspecialchars($company['view_count'] ?? 20); ?>
    </span>
  </div>
</section>





<!-- 職缺區 -->
<section class="bg-purple-50 border-2 border-purple-300 rounded-xl p-6">
  <h3 class="text-xl font-semibold mb-4 bg-purple-200 px-4 py-2 rounded-t-lg text-purple-800">
    職缺
  </h3>

  <ul class="divide-y divide-dotted divide-purple-300">
    <?php if (empty($jobs)): ?>
      <li class="py-3 text-center text-gray-500">目前沒有職缺。</li>
    <?php else: ?>
      <?php foreach ($jobs as $job): ?>
        <li class="flex items-start gap-4 py-3">
          <!-- 用公司第一個字作為圓形頭像 -->
          <div class="w-10 h-10 rounded-full bg-purple-200 text-purple-800 flex items-center justify-center font-bold text-lg">
            <?= htmlspecialchars(mb_substr($job['company_name'], 0, 1, 'UTF-8')) ?>
          </div>

          <!-- 職缺內容 -->
          <div class="flex-1 text-gray-800">
            <div class="font-semibold text-sm text-purple-800">
              <?= htmlspecialchars($job['company_name']) ?>
            </div>
            <div class="mt-1 font-medium text-lg text-gray-900">
              <?= htmlspecialchars($job['job_title']) ?>
            </div>
            <!-- 可以補上職缺描述或地點等欄位 -->
          </div>
        </li>
      <?php endforeach; ?>
    <?php endif; ?>
  </ul>

  <!-- 分頁 or 查看更多 -->
  <?php if ($commentPage !== 'all'): ?>
    <div class="flex justify-end bg-purple-200 px-4 py-2 rounded-b-lg mt-4 text-purple-800">
      <a href="?comment_page=all" class="font-semibold hover:underline">
        查看更多 &gt;&gt;
      </a>
    </div>
  <?php endif; ?>
</section>





<!-- 留言區 -->
<section class="bg-cyan-50 border-2 border-cyan-300 rounded-xl p-6 mb-6">
  <h3 class="text-xl font-semibold mb-4 bg-cyan-200 px-4 py-2 rounded-t-lg">
    留言
  </h3>

  <ul id="comment-list" class="divide-y divide-dotted divide-cyan-300">
    <?php if (empty($comments)): ?>
      <li class="py-3 text-center text-gray-500">
        目前沒有留言。
      </li>
    <?php else: ?>
      <?php foreach ($comments as $comment): ?>
        <li class="flex items-start space-x-3 py-3">
          <!-- 簡化為第一個字母的圓形頭像 -->
          <div class="w-10 h-10 rounded-full bg-cyan-200 text-cyan-800 flex items-center justify-center font-bold text-lg">
            <?= htmlspecialchars(mb_substr($comment['username'], 0, 1, 'UTF-8')) ?>
          </div>

          <div class="flex-1 text-gray-800">
            <div class="font-semibold text-sm text-gray-700">
              <?= htmlspecialchars($comment['username']) ?>
            </div>
            <div class="mt-1 text-sm">
              <?= nl2br(htmlspecialchars($comment['content'])) ?>
            </div>
            <div class="text-xs text-gray-500 mt-1">
              <?= htmlspecialchars($comment['created_at']) ?>
            </div>
          </div>
        </li>
      <?php endforeach; ?>
    <?php endif; ?>
  </ul>

  <!-- 分頁 or 查看更多 -->
  <?php if ($commentPage !== 'all'): ?>
    <div class="flex justify-end bg-cyan-200 px-4 py-2 rounded-b-lg mt-4 text-cyan-800">
      <a href="?comment_page=all" class="font-semibold hover:underline">
        查看更多 &gt;&gt;
      </a>
    </div>
  <?php endif; ?>
</section>


<script>

function openEditModal() {
    // 先把現有文字塞進表單
    const nameEl = document.getElementById('display-company-name');
    const addrEl = document.getElementById('display-address');
    document.getElementById('input-company-name').value =
      nameEl ? nameEl.textContent.trim().split('\n')[0] : '';
    document.getElementById('input-address').value =
      addrEl ? addrEl.textContent.trim() : '';
    // 顯示 modal
    document.getElementById('modal').classList.remove('hidden');
  }
  function closeEditModal() {
    document.getElementById('modal').classList.add('hidden');
  }
  // Esc 關閉
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeEditModal();
  });

  // 1. 「載入全部職缺」按鈕
  document.getElementById('loadAllJobsBtn').addEventListener('click', function () {
    fetch('load_all_jobs.php')
      .then(res => res.text())
      .then(html => {
        document.getElementById('job-list').innerHTML = html;
        this.style.display = 'none';
        document.getElementById('job-pagination').style.display = 'none';
      });
  });

  // 2. 「載入全部留言」按鈕
  document.getElementById('loadAllBtn').addEventListener('click', function () {
    fetch('load_all_comments.php')
      .then(response => response.text())
      .then(html => {
        document.getElementById('comment-list').innerHTML = html;
        this.style.display = 'none';
        document.getElementById('pagination').style.display = 'none';
      });
  });

 

  // 打開／關閉編輯彈窗
  function openEditModal() {
    document.getElementById('input-company-name').value =
      document.getElementById('display-company-name').childNodes[0].nodeValue.trim();
    document.getElementById('input-address').value =
      document.getElementById('display-address').textContent.trim();
    document.getElementById('modal').classList.remove('hidden');
  }
  function closeEditModal() {
    document.getElementById('modal').classList.add('hidden');
  }

  // 3. 處理表單提交：更新前端並送後端
  document.getElementById('edit-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const newName = this.company_name.value.trim();
    const newAddr = this.address.value.trim();
    const fileInput = document.getElementById('input-avatar');

    // 前端即時更新文字
    document.getElementById('display-company-name').childNodes[0].nodeValue = newName;
    document.getElementById('display-address').textContent = newAddr;

   // 如果有新頭像，預覽
if (fileInput.files && fileInput.files[0]) {
  const reader = new FileReader();
  reader.onload = evt => {
    document.getElementById('display-avatar').src = evt.target.result;
  };
  reader.readAsDataURL(fileInput.files[0]);
}


    // 4. 把資料送到後端（範例用 fetch + FormData）
    const formData = new FormData(this);
    fetch('save_company.php', {
      method: 'POST',
      body: formData
    })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        // 成功後關閉彈窗
        closeEditModal();
      } else {
        alert('儲存失敗: ' + result.message);
      }
    })
    .catch(err => {
      console.error(err);
      alert('發生錯誤，請稍後再試');
    });
  });
</script>


        </main>
    </div>
</body>
</html>