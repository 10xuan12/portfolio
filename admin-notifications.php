<?php
// 若要查詢資料庫，請先引入連線檔
// include 'includes/db_connect.php';
?>
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>通知頁</title>
  <style>
    body {
      margin: 0;
      font-family: sans-serif;
      background-color: #f3f4f6;
    }

    /* ✅ 固定左側欄，頂到底 */
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
      z-index: 1000;
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

    /* ✅ 主內容區避免被 sidebar 擋住 */
    .main {
      margin-left: 100px;
      padding: 2rem;
      min-height: 100vh;
    }

    .filter-bar {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }

    .filter-btn {
      padding: 8px 20px;
      border-radius: 8px;
      border: 1px solid #d1d5db;
      background-color: white;
      color: #374151;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .filter-btn:hover {
      background-color: #f3f4f6;
    }

    .filter-btn.active {
      background-color: #3b82f6;
      color: white;
      border-color: #3b82f6;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }

    .search-bar {
      display: flex;
      gap: 12px;
      align-items: center;
      background: #f9fafb;
      padding: 10px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      margin-bottom: 24px;
    }

    .search-bar select,
    .search-bar input {
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
    }

    .search-bar select {
      min-width: 100px;
    }

    .search-bar input {
      flex: 1;
    }

    .search-bar button {
      padding: 8px 16px;
      background-color: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .search-bar button:hover {
      background-color: #2563eb;
    }

    .notification-list {
      background: #fcf6ff;
      padding: 1rem;
      border-radius: 10px;
    }

    .notification-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid #eee;
    }

    .notification-item:last-child {
      border-bottom: none;
    }

    .checkbox {
      accent-color: #7c3aed;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      margin-top: 24px;
      padding: 20px;
    }

    .pagination button {
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      color: #374151;
      transition: all 0.2s ease;
    }

    .pagination button:hover {
      background: #f3f4f6;
      border-color: #9ca3af;
    }

    .pagination button.active {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .pagination .page-info {
      margin: 0 16px;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <!-- ✅ 固定左欄 -->
  <div class="sidebar">
    <a href="admin-index.php" class="sidebar-item">🏠<br>主頁</a>
    <a href="admin-accounts.php" class="sidebar-item">🧑‍💼<br>帳號管理</a>
    <a href="admin-works.php" class="sidebar-item">📁<br>管理審核</a>
    <a href="admin-notifications.php" class="sidebar-item selected">🔔<br>通知</a>
    <a href="admin-settings.php" class="sidebar-item">⚙️<br>設定</a>
    <div class="sidebar-item">↩️<br>登出</div>
  </div>

  <!-- 主內容 -->
  <div class="main">
    <div class="filter-bar">
      <button class="filter-btn active" data-type="all">全部</button>
      <button class="filter-btn" data-type="focus">焦點</button>
      <button class="filter-btn" data-type="comment">留言 <span style="color: red;">●</span></button>
      <button class="filter-btn" data-type="promo">促銷</button>
      <button class="filter-btn" data-type="other">其他</button>
      <button class="filter-btn" data-type="trash">垃圾桶</button>
    </div>

    <div class="search-bar">
      <select>
        <option value="title">標題</option>
        <option value="content">內容</option>
      </select>
      <input type="text" placeholder="輸入搜尋關鍵字..." />
      <button>🔍 搜尋</button>
    </div>

    <div class="notification-list">
      <?php
      // 範例：從資料庫撈通知
      // include 'includes/db_connect.php';
      // $sql = "SELECT title, content FROM notifications ORDER BY id DESC LIMIT 10";
      // $result = $conn->query($sql);
      // if ($result && $result->num_rows > 0) {
      //   while($row = $result->fetch_assoc()) {
      //     echo '<div class="notification-item">'
      //         .'<div><span style="background:#e9d5ff; border-radius:50%; padding:0.2rem 0.6rem; margin-right:1rem;">🔔</span> '
      //         .htmlspecialchars($row['title']).' '.htmlspecialchars($row['content']).'</div>'
      //         .'<input type="checkbox" checked class="checkbox">'
      //         .'</div>';
      //   }
      // } else {
      //   echo '<div class="notification-item"><div>暫無通知</div></div>';
      // }
      ?>
    </div>

    <div class="pagination">
      <button onclick="goToPage(1)">第一頁</button>
      <button onclick="goToPreviousPage()">‹ 上一頁</button>
      <button class="active" onclick="goToPage(1)">1</button>
      <button onclick="goToPage(2)">2</button>
      <button onclick="goToPage(3)">3</button>
      <button onclick="goToPage(4)">4</button>
      <span class="page-info">...</span>
      <button onclick="goToPage(7)">7</button>
      <button onclick="goToPage(8)">8</button>
      <button onclick="goToNextPage()">下一頁 ›</button>
      <button onclick="goToPage(8)">最後一頁</button>
    </div>
  </div>

  <script>
    const buttons = document.querySelectorAll('.filter-btn');
    const notificationList = document.querySelector('.notification-list');

    const notifications = {
      focus: [
        '【焦點】系統維護通知：6/30 晚間將暫停服務',
        '【焦點】更新：新增帳號分析功能'
      ],
      comment: [
        '【留言】您收到一則來自學生的回饋留言',
        '【留言】作品審核問題補充說明已回覆'
      ],
      promo: [
        '【促銷】六月限定：推薦帳號享優惠',
        '【促銷】開發者工具 5 折中'
      ],
      other: [
        '【其他】您的密碼已變更',
        '【其他】本週無新的通知'
      ],
      trash: [
        '【刪除】此通知已移至垃圾桶',
        '【刪除】無效訊息已移除'
      ]
    };

    const allNotifications = [
      ...notifications.focus,
      ...notifications.comment,
      ...notifications.promo,
      ...notifications.other
    ];

    function renderItems(type) {
      const data = type === 'all' ? allNotifications : notifications[type] || [];
      const items = data.map(msg => `
        <div class="notification-item">
          <div><span style="background:#e9d5ff; border-radius:50%; padding:0.2rem 0.6rem; margin-right:1rem;">🔔</span> ${msg}</div>
          <input type="checkbox" checked class="checkbox">
        </div>
      `).join('');
      notificationList.innerHTML = items;
    }

    buttons.forEach(button => {
      button.addEventListener('click', () => {
        buttons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        renderItems(button.getAttribute('data-type'));
      });
    });

    renderItems('all');

    let currentPage = 1;
    const totalPages = 8;

    function goToPage(page) {
      if (page < 1 || page > totalPages) return;
      currentPage = page;
      console.log(`切換到第 ${page} 頁`);
    }

    function goToPreviousPage() {
      if (currentPage > 1) {
        goToPage(currentPage - 1);
      }
    }

    function goToNextPage() {
      if (currentPage < totalPages) {
        goToPage(currentPage + 1);
      }
    }
  </script>
</body>
</html>
