<?php
// 若要查詢資料庫，請先引入連線檔
// include 'includes/db_connect.php';
// $work_id = $_GET['id'] ?? 1;
// $sql = "SELECT * FROM works WHERE id = $work_id";
// $result = $conn->query($sql);
// $work = $result ? $result->fetch_assoc() : null;
?>
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>作品審核詳情</title>
  <style>
    body {
      margin: 0;
      font-family: sans-serif;
      display: flex;
      background-color: #f4f4f4;
    }
    /* ✅ 固定左側欄 */
    .sidebar {
      position: fixed;
      top: 0;
      bottom: 0;
      width: 100px;
      background: #f0f0f0;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-top: 1rem;
    }

    .sidebar-item {
      text-align: center;
      padding: 1rem;
      width: 100%;
      cursor: pointer;
      text-decoration: none;
      color: inherit;
    }

    /* 側邊欄選中狀態（目前頁面） */
    .sidebar-item.selected {
      background-color: #d8dae1;
      color: rgb(71, 45, 71);
      box-shadow: inset 0 3px 6px rgba(0, 0, 0, 0.3);
      transform: none;
      border: none;
      width: 100%;
      box-sizing: border-box;
      border-radius: 4px;
    }
    .main {
      margin-left: 100px;
      flex: 1;
      padding: 2rem;
    }
    .preview {
      display: flex;
      gap: 2rem;
    }
    .preview-img {
      width: 300px;
      height: 200px;
      background: #ddd;
      border-radius: 10px;
    }
    .info-title {
      font-size: 20px;
      font-weight: bold;
    }
    .dropdown {
      margin-top: 0.5rem;
    }
    .section {
      margin-top: 2rem;
    }
    .section-title {
      background-color: #2563eb;
      color: white;
      display: inline-block;
      padding: 0.3rem 1rem;
      border-radius: 4px;
      font-weight: bold;
    }
    .description {
      background: #f4eaea;
      padding: 1rem;
      margin-top: 0.5rem;
      border-radius: 6px;
    }
    .files {
      margin-top: 1rem;
    }
    .files div {
      margin: 0.4rem 0;
    }
    .review-area {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-top: 2rem;
    }
    .review-area input {
      padding: 0.5rem;
      width: 300px;
    }
    .approve-btn {
      background-color: #90ee90;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
    }
    .reject-btn {
      background-color: #f5c2c2;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <!-- 側邊欄 -->
  <div class="sidebar">
    <a href="admin-index.php" class="sidebar-item">🏠<br>主頁</a>
    <a href="admin-accounts.php" class="sidebar-item">🧑‍💼<br>帳號管理</a>
    <a href="admin-works.php" class="sidebar-item selected">📁<br>管理審核</a>
    <a href="admin-notifications.php" class="sidebar-item">🔔<br>通知</a>
    <a href="admin-settings.php" class="sidebar-item">⚙️<br>設定</a>
    <div class="sidebar-item">↩️<br>登出</div>
  </div>

  <!-- 內容 -->
  <div class="main">
    <!-- 預覽區塊 -->
    <div class="preview">
      <div class="preview-img"></div>
      <div>
        <div class="info-title">
          <?php
          // 範例：顯示作品標題
          // echo $work ? htmlspecialchars($work['title']) : '機器人';
          echo '機器人';
          ?>
        </div>
        <select class="dropdown">
          <option>資訊</option>
          <option>外語</option>
          <option>藝術</option>
          <option>教育</option>
          <option>工程</option>
          <option>管理</option>
          <option>財經</option>
          <option>法政</option>
          <option>文史哲</option>
          <option>數理化</option>
          <option>生物資源</option>
          <option>大眾傳播</option>
          <option>醫藥衛生</option>
          <option>生命科學</option>
          <option>地球與環境</option>
          <option>社會與心理</option>
          <option>建築與設計</option>
          <option>遊憩與運動</option>
          <option>其他</option>
        </select>
      </div>
    </div>

    <!-- 簡介區塊 -->
    <div class="section">
      <div class="section-title">簡介</div>
      <div class="description">
        <strong>
        <?php
        // 範例：顯示作品簡介
        // echo $work ? htmlspecialchars($work['description']) : '123';
        echo '123';
        ?>
        </strong>
      </div>
    </div>

    <!-- 附加檔案 -->
    <div class="section files">
      <?php
      // 範例：顯示附加檔案
      // if ($work && !empty($work['files'])) {
      //   $files = explode(',', $work['files']);
      //   foreach ($files as $file) {
      //     echo '<div>📁 ' . htmlspecialchars($file) . '</div>';
      //   }
      // } else {
      //   echo '<div>📁 LineBOT示範文件.doc</div><div>📁 LineBOT執行檔.exe</div>';
      // }
      echo '<div>📁 LineBOT示範文件.doc</div><div>📁 LineBOT執行檔.exe</div>';
      ?>
    </div>

    <!-- 審核按鈕與備註 -->
    <div class="review-area">
      <button class="approve-btn">✔ 通過</button>
      <button class="reject-btn">✘ 不通過</button>
      <input type="text" placeholder="請輸入未通過原因" />
    </div>
  </div>
</body>
</html>
