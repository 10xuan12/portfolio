<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
session_start();

$_SESSION['user_id'] = 1;

require $_SERVER['DOCUMENT_ROOT'] . '/portfolio/enterprise/config/enterprise.php';

$db  = new \Config\EnterpriseDB();
$pdo = $db->getConnection();


$user_id       = $_SESSION['user_id'];

// 取得用戶資料
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id");
$stmt->execute(['id' => $user_id]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

// ===== 處理上傳頭像 + 更新基本資料 =====
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_profile'])) {
  // 1. 處理頭像上傳
  if (!empty($_FILES['avatar']['name'])) {
      $uploadDir = 'uploads/';
      if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

      $ext     = strtolower(pathinfo($_FILES['avatar']['name'], PATHINFO_EXTENSION));
      $allowed = ['jpg','jpeg','png','gif','webp'];

      if (in_array($ext, $allowed)) {
          $fn     = uniqid() . '.' . $ext;
          $target = $uploadDir . $fn;

          if (move_uploaded_file($_FILES['avatar']['tmp_name'], $target)) {
              $pdo->prepare("UPDATE users SET avatar = :avatar WHERE id = :id")
                  ->execute([
                      'avatar' => $target,
                      'id'     => $user_id
                  ]);
          }
      }
  }

  // 2. 處理其他欄位更新 (company_name, username, address, bio …)
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
}



// ===== 自動累加瀏覽次數 =====
$pdo->prepare("UPDATE users SET view_count = view_count + 1 WHERE id = :id")
    ->execute(['id' => $user_id]);

// ===== 取得最新使用者資料 =====
$user = $pdo->prepare("SELECT * FROM users WHERE id = :id");
$user->execute(['id' => $user_id]);
$user = $user->fetch(PDO::FETCH_ASSOC);


  
// -- 留言分頁 or all --
if (isset($_GET['page']) && $_GET['page'] === 'all') {

  $stmt = $pdo->query("SELECT * FROM comments ORDER BY created_at DESC");
  $comments   = $stmt->fetchAll(PDO::FETCH_ASSOC);
  $commentPage = 'all';
} else {
  $perPage       = 10;
  $commentPage   = max(1, (int)($_GET['page'] ?? 1));
  $commentOffset = ($commentPage - 1) * $perPage;
  $totalComments = $pdo->query("SELECT COUNT(*) FROM comments")->fetchColumn();
  $totalPages    = ceil($totalComments / $perPage);

  // 撈出本頁留言
  $stmt = $pdo->prepare("
    SELECT 
      c.id,
      c.content,
      c.created_at,
      u.avatar,
      u.username AS commenter_name
    FROM comments AS c
    JOIN users    AS u ON u.id = c.user_id
    ORDER BY c.created_at DESC
    LIMIT :limit OFFSET :offset
");
$stmt->bindValue(':limit',  $perPage,       PDO::PARAM_INT);
$stmt->bindValue(':offset', $commentOffset, PDO::PARAM_INT);
$stmt->execute();
$comments = $stmt->fetchAll(PDO::FETCH_ASSOC); 
}


ini_set('display_errors', 1);
error_reporting(E_ALL);

// -- 職缺分頁 --
$jobsPerPage   = 10;
$rawPage       = $_GET['job_page'] ?? 1;
$jobPage       = ($rawPage === 'all') ? 'all' : max(1, (int)$rawPage);
$totalJobs     = (int)$pdo->query("SELECT COUNT(*) FROM jobs")->fetchColumn();
$jobTotalPages = ($jobsPerPage > 0) ? ceil($totalJobs / $jobsPerPage) : 1;

if ($jobPage === 'all') {
  $sql = "SELECT j.id, j.title AS job_title, u.company_name, j.description AS job_description,
                 j.location AS job_location, j.created_at
          FROM jobs j
          JOIN users u ON j.user_id = u.id
          ORDER BY j.created_at DESC";
  $stmt = $pdo->prepare($sql);
} else {
  $offset = ($jobPage - 1) * $jobsPerPage;
  $sql = "SELECT j.id, j.title AS job_title, u.company_name, j.description AS job_description,
                 j.location AS job_location, j.created_at
          FROM jobs j
          JOIN users u ON j.user_id = u.id
          ORDER BY j.created_at DESC
          LIMIT :limit OFFSET :offset";
  $stmt = $pdo->prepare($sql);
  $stmt->bindValue(':limit',  $jobsPerPage, PDO::PARAM_INT);
  $stmt->bindValue(':offset', $offset,      PDO::PARAM_INT);
}

$stmt->execute();
$jobs = $stmt->fetchAll(PDO::FETCH_ASSOC);

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

       <!-- ✅ 左側欄 --> 
    <nav class="flex flex-col items-center shadow-md border-r bg-gray-300 w-14 py-6 space-y-8">
      <button class="flex flex-col items-center text-black bg-blue-700 w-14 h-14 justify-center rounded-sm">
        <i class="fas fa-user-circle text-xl"></i>
        <span class="text-xs mt-1 leading-none">主頁</span>
      </button>
      <button class="flex flex-col items-center text-black w-14 h-14 justify-center rounded-sm">
        <i class="fas fa-folder text-xl"></i>
        <span class="text-xs mt-1 leading-none">瀏覽</span>
      </button>
      <button class="flex flex-col items-center text-black w-14 h-14 justify-center rounded-sm">
        <i class="fas fa-bell text-xl"></i>
        <span class="text-xs mt-1 leading-none">通知</span>
      </button>
      <button class="flex flex-col items-center text-black w-14 h-14 justify-center rounded-sm">
        <i class="fas fa-cog text-xl"></i>
        <span class="text-xs mt-1 leading-none">設定</span>
      </button>
      <form method="post" action="logout.php">
        <button type="submit" class="flex flex-col items-center text-black w-14 h-14 justify-center rounded-sm">
          <i class="fas fa-sign-out-alt text-xl"></i>
          <span class="text-xs mt-1 leading-none">登出</span>
        </button>
      </form>
    </nav>

    <!-- ✅ 右側主內容 -->
    <main class="flex-1 p-6 overflow-y-auto max-w-5xl mx-auto">

    <!-- 頭像與公司資料 -->
<section class="flex items-start space-x-6 mb-6">
  <img
    id="display-avatar"
    src="<?php echo htmlspecialchars($user['avatar'] ?? 'uploads/default.jpg'); ?>"
    class="w-24 h-24 rounded-full object-cover border-2 border-gray-300 shadow-md"
  >

  <div class="flex-1">
    <h2 class="text-base font-bold" id="display-company-name">
      <?php echo htmlspecialchars($user['company_name'] ?? '企業名稱'); ?>
      <br>
      <span class="font-normal text-sm" id="display-address">
        <?php echo htmlspecialchars($user['address'] ?? '尚未提供地址'); ?>
      </span>
    </h2>

    <div class="flex items-center space-x-2 mt-2">
      <span class="text-xs text-gray-600">上線中</span>
      <span class="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
      <button
        class="flex items-center space-x-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold py-2 px-4 rounded"
        onclick="openEditModal()"
      >
        <i class="fas fa-cog"></i><span>編輯</span>
      </button>
    </div>
  </div>
</section>

      <!-- 簡介 -->
      <section class="mb-6">
        <h3 class="text-sm font-bold mb-1">簡介</h3>
        <p class="text-sm italic" id="display-bio">
          <?php echo htmlspecialchars($user['bio'] ?? '尚未提供簡介'); ?>
        </p>
      </section>


      

<<!-- 2. Modal 彈窗表單 -->
<div id="modal"
     class="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center hidden">
  <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
    <button onclick="document.getElementById('modal').classList.add('hidden')"
            class="absolute top-2 right-2 text-gray-500 hover:text-gray-800">
      <i class="fas fa-times"></i>
    </button>

    <form method="post"
          enctype="multipart/form-data"
          id="edit-form"
          class="space-y-4">
      <h2 class="text-base font-bold">編輯企業基本資料</h2>

      <!-- 企業名稱 -->
      <label class="block">
        <span class="text-xs font-medium">企業名稱：</span>
        <input type="text"
               name="company_name"
               value="<?= htmlspecialchars($user['company_name'] ?? '') ?>"
               placeholder="尚未提供企業名稱"
               class="w-full border p-2 rounded">
      </label>

      <!-- 負責人姓名 -->
      <label class="block">
        <span class="text-xs font-medium">負責人姓名：</span>
        <input type="text"
               name="username"
               value="<?= htmlspecialchars($user['username'] ?? '') ?>"
               placeholder="尚未提供負責人姓名"
               class="w-full border p-2 rounded">
      </label>

      <!-- 公司地址 -->
      <label class="block">
        <span class="text-xs font-medium">公司地址：</span>
        <input type="text"
               name="address"
               value="<?= htmlspecialchars($user['address'] ?? '') ?>"
               placeholder="尚未提供公司地址"
               class="w-full border p-2 rounded">
      </label>

      <!-- 上傳頭像 -->
      <label class="block">
        <span class="text-xs font-medium">上傳頭像：</span>
        <input type="file"
               name="avatar"
               accept="image/*"
               class="w-full border p-2 rounded">
      </label>

      <!-- 簡介 -->
      <label class="block">
        <span class="text-xs font-medium">簡介：</span>
        <textarea name="bio"
                  rows="3"
                  placeholder="尚未提供簡介"
                  class="w-full border p-2 rounded"><?= htmlspecialchars($user['bio'] ?? '') ?></textarea>
      </label>

      <!-- 送出按鈕 -->
      <button type="submit"
              name="update_profile"
              class="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
        儲存修改
      </button>
    </form>
  </div>
</div>

           


<!-- 聯絡方式區塊 -->
<section class="bg-pink-50 rounded-md p-6 mb-6
                grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3
                gap-y-4 gap-x-6 text-xs font-semibold">

  <!-- GitHub -->
  <div class="flex items-center space-x-2">
    <i class="fab fa-github"></i>
    <a href="https://github.com/<?php echo htmlspecialchars($user['github'] ?? ''); ?>"
       target="_blank"
       class="hover:underline">
      <?php echo htmlspecialchars($user['github'] ?? ''); ?> · GitHub
    </a>
  </div>

  <!-- LinkedIn -->
  <div class="flex items-center space-x-2">
    <i class="fab fa-linkedin"></i>
    <a href=https://www.linkedin.com/login/zh-tw<?php echo htmlspecialchars($user['linkedin'] ?? ''); ?>"
       target="_blank"
       class="hover:underline">
      <?php echo htmlspecialchars($user['linkedin'] ?? ''); ?>LinkedIn
    </a>
  </div>

  <!-- Email -->
  <div class="flex items-center space-x-2">
    <i class="fas fa-envelope"></i>
    <a href=https://accounts.google.com/<?php echo htmlspecialchars($user['email'] ?? ''); ?>
       target="_blank"
       class="hover:underline">
      <?php echo htmlspecialchars($user['email'] ?? ''); ?>email
    </a>
  </div>

  <!-- Instagram -->
  <div class="flex items-center space-x-2">
    <i class="fab fa-instagram"></i>
    <a href=https://www.instagram.com/<?php echo htmlspecialchars($user['instagram'] ?? ''); ?>
    target="_blank"
       class="hover:underline">
      <?php echo htmlspecialchars($user['instagram'] ?? ''); ?>instagram 
    </a>
  </div>

  <!-- Facebook -->
  <div class="flex items-center space-x-2">
    <i class="fab fa-facebook-f"></i>
    <a href="https://facebook.com/<?php echo htmlspecialchars($user['facebook'] ?? ''); ?>"
       target="_blank"
       class="hover:underline">
      <?php echo htmlspecialchars($user['facebook'] ?? ''); ?> Facebook
    </a>
  </div>

  <!-- 電話 -->
  <div class="flex items-center space-x-2">
    <i class="fas fa-phone-alt"></i>
    <span>0423567777<?php echo htmlspecialchars($user['phone'] ?? ''); ?></span>
  </div>

  <!-- 檔案瀏覽次數 -->
  <div class="col-span-full text-right text-sm mt-2">
    瀏覽次數
    <span class="font-bold text-blue-800">
      <?php echo htmlspecialchars($user['view_count'] ?? 20); ?>
    </span>
  </div>
</section>



<!-- 企業簡介顯示區塊 -->
<?php if (!empty($user['bio'])): ?>
  <section class="bg-white border-l-4 border-indigo-400 p-4 rounded shadow mb-6">
    <h3 class="text-sm font-bold text-indigo-700 mb-2">企業簡介</h3>
    <p class="text-sm text-gray-800 leading-relaxed"><?php echo nl2br(htmlspecialchars($user['bio'])); ?></p>
  </section>
<?php endif; ?>

<!-- 職缺區 -->
<section class="bg-purple-50 border-2 border-purple-300 rounded-xl p-6">
  <h3 class="text-xl font-semibold mb-4 bg-purple-200 px-4 py-2 rounded-t-lg text-purple-800">
    職缺
  </h3>

  <ul class="divide-y divide-dotted divide-purple-400">
    <?php if (empty($jobs)): ?>
      <li class="py-3 text-center text-gray-500">目前沒有職缺。</li>
    <?php else: ?>
      <?php foreach ($jobs as $job): ?>
        <li class="flex items-start space-x-3 py-3">
          <div class="w-8 h-8 bg-purple-200 text-purple-700 rounded-full flex items-center justify-center font-medium">A</div>
          <div class="flex-1 text-gray-800">
            <div class="font-semibold text-sm text-gray-700"><?= htmlspecialchars($job['company_name']) ?></div>
            <div class="mt-1 font-medium text-lg text-gray-900"><?= htmlspecialchars($job['job_title']) ?></div>
            <!-- ...其他欄位 -->
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
<section class="bg-cyan-50 border-2 border-cyan-300 rounded-xl p-6">
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
          <!-- 真實頭像 -->
          <img src="<?= htmlspecialchars($comment['avatar']) ?>"
               alt="avatar"
               class="w-10 h-10 rounded-full object-cover">

          <div class="flex-1 text-gray-800">
            <div class="font-semibold text-sm text-gray-700">
              <?= htmlspecialchars($comment['commenter_name']) ?>
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
