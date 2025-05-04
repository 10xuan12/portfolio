<?php
echo "載入成功！"; exit;

session_start();
require 'db.php'; // 這裡 db.php 內部會是 PDO 建立好 $pdo

if (!isset($_SESSION['user_id'])) {
  header("Location: login.php");
  exit();
}

$user_id = $_SESSION['user_id'];
$update_success = false;

// 處理更新資料
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_profile'])) {
  $companyName = trim($_POST['company_name']);
  $username = trim($_POST['username']);
  $address = trim($_POST['address']);
  $bio = trim($_POST['bio']);

  // 上傳頭像（如有）
  if (!empty($_FILES['avatar']['name'])) {
    $uploadDir = 'uploads/';
    if (!is_dir($uploadDir)) mkdir($uploadDir);
    $filename = uniqid() . '_' . basename($_FILES['avatar']['name']);
    $targetPath = $uploadDir . $filename;
    $fileExt = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    $allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    if (in_array($fileExt, $allowedExts) && move_uploaded_file($_FILES['avatar']['tmp_name'], $targetPath)) {
      $stmt = $pdo->prepare("UPDATE users SET avatar = :avatar WHERE id = :id");
      $stmt->execute(['avatar' => $targetPath, 'id' => $user_id]);
    }
  }

  // 更新其他欄位
  $stmt = $pdo->prepare("UPDATE users SET company_name = :company_name, username = :username, address = :address, bio = :bio, is_online = 1 WHERE id = :id");
  $stmt->execute([
    'company_name' => $companyName,
    'username' => $username,
    'address' => $address,
    'bio' => $bio,
    'id' => $user_id
  ]);

  header("Location: " . $_SERVER['PHP_SELF']);
  exit;
}

// 取得當前使用者資料
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$user_id]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);



//HR 聯絡方式更新表單
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_contact'])) {
    $newPhone = trim($_POST['phone']);
    $newEmail = trim($_POST['email']);
    $newGithub = trim($_POST['github']);
    $newLinkedin = trim($_POST['linkedin']);
    $newInstagram = trim($_POST['instagram']);
    $newFacebook = trim($_POST['facebook']);
  
    $stmt = $pdo->prepare("UPDATE users SET phone = :phone, email = :email, github = :github, linkedin = :linkedin, instagram = :instagram, facebook = :facebook WHERE id = :id");
    $stmt->execute([
      'phone' => $newPhone,
      'email' => $newEmail,
      'github' => $newGithub,
      'linkedin' => $newLinkedin,
      'instagram' => $newInstagram,
      'facebook' => $newFacebook,
      'id' => 1
    ]);
  
    header("Location: " . $_SERVER['PHP_SELF']);
    exit;
  }




// 自動加一瀏覽次數
$stmt = $pdo->prepare("UPDATE users SET view_count = view_count + 1 WHERE id = :id");
$stmt->execute(['id' => $user_id  ]); // user_id 可根據 session 或邏輯調整

// 撈 user 資訊
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id");
$stmt->execute(['id' => $user_id]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

// 分頁共用
$perPage = 10;

// ====== 留言分頁處理 ======
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$page = max(1, $page);
$offset = ($page - 1) * $perPage;

$stmt = $pdo->query("SELECT COUNT(*) FROM comments");
$totalRows = $stmt->fetchColumn();
$totalPages = ceil($totalRows / $perPage);

$stmt = $pdo->prepare("SELECT * FROM comments ORDER BY created_at DESC LIMIT :limit OFFSET :offset");
$stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();
$comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

// ====== 職缺分頁處理 ======
$jobPage = isset($_GET['job_page']) ? (int)$_GET['job_page'] : 1;
$jobPage = max(1, $jobPage);
$jobOffset = ($jobPage - 1) * $perPage;

$stmt = $pdo->query("SELECT COUNT(*) FROM jobs");
$jobTotalRows = $stmt->fetchColumn();
$jobTotalPages = ceil($jobTotalRows / $perPage);

$stmt = $pdo->prepare("SELECT * FROM jobs ORDER BY created_at DESC LIMIT :limit OFFSET :offset");
$stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
$stmt->bindValue(':offset', $jobOffset, PDO::PARAM_INT);
$stmt->execute();
$jobs = $stmt->fetchAll(PDO::FETCH_ASSOC);


// ====== 處理留言分頁 ======
$perPage = 10;
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$page = max(1, $page);
$offset = ($page - 1) * $perPage;

$stmt = $pdo->query("SELECT COUNT(*) FROM comments");
$totalRows = $stmt->fetchColumn();
$totalPages = ceil($totalRows / $perPage);

$stmt = $pdo->prepare("SELECT * FROM comments ORDER BY created_at DESC LIMIT :limit OFFSET :offset");
$stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();
$comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

// ====== 處理職缺分頁 ======
$jobPage = isset($_GET['job_page']) ? (int)$_GET['job_page'] : 1;
$jobPage = max(1, $jobPage);
$jobOffset = ($jobPage - 1) * $perPage;

$stmt = $pdo->query("SELECT COUNT(*) FROM jobs");
$jobTotalRows = $stmt->fetchColumn();
$jobTotalPages = ceil($jobTotalRows / $perPage);

$stmt = $pdo->prepare("SELECT * FROM jobs ORDER BY created_at DESC LIMIT :limit OFFSET :offset");
$stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
$stmt->bindValue(':offset', $jobOffset, PDO::PARAM_INT);
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
        <img src="<?php echo htmlspecialchars($user['avatar'] ?? 'uploads/default.jpg'); ?>" alt="企業頭像" class="w-24 h-24 rounded-full object-cover  border-2 border-gray-300 shadow-md">

        <div class="flex-1">
          <h2 class="text-base font-bold" id="display-company-name">
            <?php echo htmlspecialchars($user['company_name'] ?? '企業名稱'); ?>
            <br><span class="font-normal text-sm" id="display-address"><?php echo htmlspecialchars($user['address'] ?? '尚未提供地址'); ?></span>
          </h2>

          <div class="flex items-center space-x-2 mt-2">
            <span class="text-xs text-gray-600">上線中</span>
            <span class="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
            <button
              class="flex items-center space-x-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold py-2 px-4 rounded"
              onclick="document.getElementById('modal').classList.remove('hidden'); setTimeout(() => { document.getElementById('modal').scrollIntoView({ behavior: 'smooth' }); }, 50);"
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

      <!-- Modal 彈窗 -->
      <div id="modal" class="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center hidden">
        <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
          <button onclick="document.getElementById('modal').classList.add('hidden')" class="absolute top-2 right-2 text-gray-500 hover:text-gray-800">
            <i class="fas fa-times"></i>
          </button>

          <form method="post" enctype="multipart/form-data" class="space-y-4" id="edit-form">
            <h2 class="text-base font-bold">編輯企業基本資料</h2>

            <label class="block">
              <span class="text-xs font-medium">企業名稱：</span>
              <input type="text" name="company_name" value="<?php echo htmlspecialchars($user['company_name']); ?>" class="w-full border p-2 rounded">
            </label>

            <label class="block">
              <span class="text-xs font-medium">負責人姓名：</span>
              <input type="text" name="username" value="<?php echo htmlspecialchars($user['username']); ?>" class="w-full border p-2 rounded">
            </label>

            <label class="block">
              <span class="text-xs font-medium">公司地址：</span>
              <input type="text" name="address" value="<?php echo htmlspecialchars($user['address']); ?>" class="w-full border p-2 rounded">
            </label>

            <label class="block">
              <span class="text-xs font-medium">上傳頭像：</span>
              <input type="file" name="avatar" accept="image/*" class="w-full border p-2 rounded">
            </label>

            <label class="block">
              <span class="text-xs font-medium">簡介：</span>
              <textarea name="bio" rows="3" class="w-full border p-2 rounded"><?php echo htmlspecialchars($user['bio']); ?></textarea>
            </label>

            <button type="submit" name="update_profile" class="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
              儲存修改
            </button>
          </form>
        </div>
      </div>


           
            <!-- HR 聯絡方式更新表單 -->
            <form method="post" class="space-y-3 bg-white p-4 rounded shadow w-full max-w-md mb-6">
  <label class="block">
    <span class="text-sm font-bold">電話：</span>
    <input type="text" name="phone" value="<?php echo htmlspecialchars($user['phone']); ?>" class="w-full border p-2 rounded" required>
  </label>
  <label class="block">
    <span class="text-sm font-bold">Email:</span>
    <input type="email" name="email" value="<?php echo htmlspecialchars($user['email']); ?>" class="w-full border p-2 rounded" required>
  </label>
  <label class="block">
    <span class="text-sm font-bold">GitHub 帳號：</span>
    <input type="text" name="github" value="<?php echo htmlspecialchars($user['github']); ?>" class="w-full border p-2 rounded">
  </label>
  <label class="block">
    <span class="text-sm font-bold">LinkedIn ID:</span>
    <input type="text" name="linkedin" value="<?php echo htmlspecialchars($user['linkedin']); ?>" class="w-full border p-2 rounded">
  </label>
  <label class="block">
    <span class="text-sm font-bold">Instagram 帳號：</span>
    <input type="text" name="instagram" value="<?php echo htmlspecialchars($user['instagram']); ?>" class="w-full border p-2 rounded">
  </label>
  <label class="block">
    <span class="text-sm font-bold">Facebook ID:</span>
    <input type="text" name="facebook" value="<?php echo htmlspecialchars($user['facebook']); ?>" class="w-full border p-2 rounded">
  </label>
  <button type="submit" name="update_contact" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">更新聯絡資料</button>
</form>


            <!-- 聯絡方式區塊 -->
<section class="bg-pink-100 rounded-md p-6 mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-xs font-semibold">
  <div><i class="fab fa-github mr-2"></i><a href="https://github.com/<?php echo htmlspecialchars($user['github']); ?>" target="_blank" class="underline hover:text-blue-800"><?php echo $user['github']; ?></a> · GitHub</div>
  <div><i class="fab fa-linkedin mr-2"></i><a href="https://www.linkedin.com/in/<?php echo htmlspecialchars($user['linkedin']); ?>" target="_blank" class="underline hover:text-blue-800"><?php echo $user['linkedin']; ?></a></div>
  <div><i class="fab fa-instagram mr-2"></i><a href="https://instagram.com/<?php echo htmlspecialchars($user['instagram']); ?>" target="_blank" class="underline hover:text-blue-800"><?php echo $user['instagram']; ?></a></div>
  <div><i class="fas fa-envelope mr-2"></i><a href="mailto:<?php echo htmlspecialchars($user['email']); ?>" class="underline hover:text-blue-800"><?php echo $user['email']; ?></a></div>
  <div><i class="fab fa-facebook-f mr-2"></i><a href="https://facebook.com/<?php echo htmlspecialchars($user['facebook']); ?>" target="_blank" class="underline hover:text-blue-800"><?php echo $user['facebook']; ?> Facebook</a></div>
  <div><i class="fas fa-phone-alt mr-2"></i><span class="italic font-medium"><?php echo $user['phone']; ?></span></div>
  <div class="col-span-full text-right text-sm mt-2">檔案瀏覽次數 <span class="font-bold text-blue-800"><?php echo $user['view_count']; ?></span></div>
</section>

<!-- 企業簡介顯示區塊 -->
<?php if (!empty($user['bio'])): ?>
  <section class="bg-white border-l-4 border-indigo-400 p-4 rounded shadow mb-6">
    <h3 class="text-sm font-bold text-indigo-700 mb-2">企業簡介</h3>
    <p class="text-sm text-gray-800 leading-relaxed"><?php echo nl2br(htmlspecialchars($user['bio'])); ?></p>
  </section>
<?php endif; ?>

         
     <!-- 職缺清單 -->
<section class="bg-indigo-50 rounded-xl p-6 mb-10 relative">
  <h3 class="text-xl font-semibold mb-4">最新職缺</h3>
  <ul id="job-list" class="space-y-2">
    <?php
    $palette = [
      ['bg' => 'bg-red-100', 'text' => 'text-red-600'],
      ['bg' => 'bg-orange-100', 'text' => 'text-orange-600'],
      ['bg' => 'bg-amber-100', 'text' => 'text-amber-600'],
      ['bg' => 'bg-yellow-100', 'text' => 'text-yellow-600'],
      ['bg' => 'bg-lime-100', 'text' => 'text-lime-600'],
      ['bg' => 'bg-green-100', 'text' => 'text-green-600'],
      ['bg' => 'bg-emerald-100', 'text' => 'text-emerald-600'],
      ['bg' => 'bg-teal-100', 'text' => 'text-teal-600'],
      ['bg' => 'bg-cyan-100', 'text' => 'text-cyan-600'],
      ['bg' => 'bg-blue-100', 'text' => 'text-blue-600'],
      ['bg' => 'bg-indigo-100', 'text' => 'text-indigo-600'],
      ['bg' => 'bg-purple-100', 'text' => 'text-purple-600']
    ];
    foreach ($jobs as $job):
      $firstLetter = strtoupper(mb_substr($job['company_name'], 0, 1, 'UTF-8'));
      $index = ord($firstLetter) % count($palette);
      $colors = $palette[$index];
    ?>
    <li class="bg-white rounded-md p-3 shadow flex items-start space-x-3">
      <div class="w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg <?php echo $colors['bg'] . ' ' . $colors['text']; ?>">
        <?php echo $firstLetter; ?>
      </div>
      <div class="text-gray-800">
        <div class="font-semibold text-sm text-gray-700"><?php echo htmlspecialchars($job['company_name']); ?></div>
        <div><?php echo htmlspecialchars($job['job_title']); ?></div>
      </div>
    </li>
    <?php endforeach; ?>
  </ul>

  <div id="job-pagination" class="mt-4 flex justify-center text-sm text-gray-500">
    <div class="flex space-x-2">
      <?php if ($jobPage > 1): ?><a href="?job_page=<?php echo $jobPage - 1; ?>" class="hover:underline">← 上一頁</a><?php endif; ?>
      <?php for ($i = 1; $i <= $jobTotalPages; $i++): ?>
        <?php if ($i == $jobPage): ?><span class="font-bold text-indigo-600"><?php echo $i; ?></span>
        <?php else: ?><a href="?job_page=<?php echo $i; ?>" class="hover:underline"><?php echo $i; ?></a><?php endif; ?>
      <?php endfor; ?>
      <?php if ($jobPage < $jobTotalPages): ?><a href="?job_page=<?php echo $jobPage + 1; ?>" class="hover:underline">下一頁 →</a><?php endif; ?>
    </div>
  </div>
  <button id="loadAllJobsBtn" class="absolute bottom-2 left-2 text-blue-900 hover:underline">查看更多 &gt;&gt;</button>
</section>

<!-- 留言區 -->
<section class="bg-cyan-50 rounded-xl p-6 relative">
  <h3 class="text-xl font-semibold mb-4">留言</h3>
  <ul id="comment-list" class="space-y-2">
    <?php
    foreach ($comments as $comment):
      $firstLetter = strtoupper(mb_substr($comment['username'], 0, 1, 'UTF-8'));
      $index = ord($firstLetter) % count($palette);
      $colors = $palette[$index];
    ?>
    <li class="bg-white rounded-md p-3 shadow flex items-start space-x-3">
      <div class="w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg <?php echo $colors['bg'] . ' ' . $colors['text']; ?>">
        <?php echo $firstLetter; ?>
      </div>
      <div class="text-gray-800">
        <div class="font-semibold text-sm text-gray-700"><?php echo htmlspecialchars($comment['username']); ?></div>
        <div><?php echo htmlspecialchars($comment['content']); ?></div>
      </div>
    </li>
    <?php endforeach; ?>
  </ul>

  <div id="pagination" class="mt-4 flex justify-center text-sm text-gray-500">
    <div class="flex space-x-2">
      <?php if ($page > 1): ?><a href="?page=<?php echo $page - 1; ?>" class="hover:underline">← 上一頁</a><?php endif; ?>
      <?php for ($i = 1; $i <= $totalPages; $i++): ?>
        <?php if ($i == $page): ?><span class="font-bold text-blue-600"><?php echo $i; ?></span>
        <?php else: ?><a href="?page=<?php echo $i; ?>" class="hover:underline"><?php echo $i; ?></a><?php endif; ?>
      <?php endfor; ?>
      <?php if ($page < $totalPages): ?><a href="?page=<?php echo $page + 1; ?>" class="hover:underline">下一頁 →</a><?php endif; ?>
    </div>
  </div>
  <button id="loadAllBtn" class="absolute bottom-2 left-2 text-blue-900 hover:underline">查看更多 &gt;&gt;</button>
</section>


<!-- JS：更新完自動關 Modal 並顯示提示 -->
<?php if ($update_success): ?>
  <script>
    window.addEventListener('DOMContentLoaded', () => {
      document.getElementById('modal').classList.add('hidden');
      alert("資料更新成功！");
      // 即時更新畫面資料（非必要但美觀）
      document.getElementById('display-company-name').innerHTML = `<?php echo htmlspecialchars($user['company_name']); ?><br><span class="font-normal text-sm"><?php echo htmlspecialchars($user['address']); ?></span>`;
      document.getElementById('display-address').innerText = "<?php echo htmlspecialchars($user['address']); ?>";
      document.getElementById('display-bio').innerText = "<?php echo htmlspecialchars($user['bio']); ?>";
    });
  </script>
  <?php endif; ?>

<script>
document.getElementById('loadAllJobsBtn').addEventListener('click', function () {
  fetch('load_all_jobs.php')
    .then(res => res.text())
    .then(html => {
      document.getElementById('job-list').innerHTML = html;
      this.style.display = 'none';
      document.getElementById('job-pagination').style.display = 'none';
    });
});

document.getElementById('loadAllBtn').addEventListener('click', function () {
  fetch('load_all_comments.php')
    .then(response => response.text())
    .then(html => {
      document.getElementById('comment-list').innerHTML = html;
      this.style.display = 'none';
      document.getElementById('pagination').style.display = 'none';
    });
});
</script>

        </main>
    </div>
</body>
</html>
