<?php
// 測試資料庫連接和配置
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>測試資料庫連接</h1>";

// 測試 1: 檢查 config.php
echo "<h2>1. 檢查 config.php</h2>";
$configPath = __DIR__ . '/../config.php';
if (file_exists($configPath)) {
    echo "✅ config.php 存在<br>";
    require_once $configPath;
    echo "✅ config.php 載入成功<br>";
} else {
    echo "❌ config.php 不存在: $configPath<br>";
}

// 測試 2: 檢查資料庫連接
echo "<h2>2. 檢查資料庫連接</h2>";
if (isset($GLOBALS['conn']) && $GLOBALS['conn']) {
    echo "✅ 資料庫連接存在<br>";
    
    // 測試查詢
    $result = $GLOBALS['conn']->query("SELECT VERSION() as version");
    if ($result) {
        $row = $result->fetch_assoc();
        echo "✅ MySQL 版本: " . $row['version'] . "<br>";
    }
} else {
    echo "❌ 資料庫連接失敗<br>";
}

// 測試 3: 檢查管理員帳號
echo "<h2>3. 檢查管理員帳號</h2>";
if (isset($GLOBALS['conn']) && $GLOBALS['conn']) {
    $stmt = $GLOBALS['conn']->prepare("SELECT id, username, email, role, status FROM users WHERE role = 'admin'");
    if ($stmt) {
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            echo "✅ 找到 " . $result->num_rows . " 個管理員帳號:<br>";
            echo "<table border='1' cellpadding='5'>";
            echo "<tr><th>ID</th><th>使用者名稱</th><th>信箱</th><th>角色</th><th>狀態</th></tr>";
            while ($admin = $result->fetch_assoc()) {
                echo "<tr>";
                echo "<td>" . $admin['id'] . "</td>";
                echo "<td><strong>" . htmlspecialchars($admin['username']) . "</strong></td>";
                echo "<td>" . htmlspecialchars($admin['email']) . "</td>";
                echo "<td>" . $admin['role'] . "</td>";
                echo "<td>" . $admin['status'] . "</td>";
                echo "</tr>";
            }
            echo "</table>";
        } else {
            echo "❌ 沒有找到管理員帳號<br>";
        }
    } else {
        echo "❌ 查詢失敗: " . $GLOBALS['conn']->error . "<br>";
    }
}

// 測試 4: 測試密碼驗證
echo "<h2>4. 測試密碼驗證</h2>";
$testPassword = 'password';
$stmt = $GLOBALS['conn']->prepare("SELECT id, username, password_hash FROM users WHERE username = 'admin' AND role = 'admin'");
if ($stmt) {
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    
    if ($user) {
        echo "✅ 找到使用者: " . $user['username'] . "<br>";
        echo "密碼 hash: " . substr($user['password_hash'], 0, 30) . "...<br>";
        
        if (password_verify($testPassword, $user['password_hash'])) {
            echo "✅ 密碼 'password' 驗證成功!<br>";
        } else {
            echo "❌ 密碼 'password' 驗證失敗<br>";
            echo "嘗試產生新的 hash...<br>";
            $newHash = password_hash($testPassword, PASSWORD_DEFAULT);
            echo "新 hash: " . substr($newHash, 0, 30) . "...<br>";
        }
    } else {
        echo "❌ 沒有找到 username='admin' 的管理員<br>";
    }
}

// 測試 5: 測試 JSON API
echo "<h2>5. 測試 JSON API</h2>";
echo "<form method='POST' action='auth.php' target='_blank'>";
echo "<input type='hidden' name='test' value='1'>";
echo "<button type='button' onclick='testLoginAPI()'>測試登入 API</button>";
echo "</form>";

echo "<script>
function testLoginAPI() {
    fetch('auth.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'login',
            username: 'admin',
            password: 'password'
        })
    })
    .then(r => r.text())
    .then(text => {
        console.log('API Response:', text);
        try {
            const json = JSON.parse(text);
            alert('成功! ' + json.message);
        } catch(e) {
            alert('錯誤: API 返回非 JSON\\n\\n' + text.substring(0, 500));
        }
    })
    .catch(e => alert('請求失敗: ' + e.message));
}
</script>";

echo "<br><br>";
echo "<h2>📝 登入資訊</h2>";
echo "<div style='background: #f0f0f0; padding: 15px; border-radius: 5px;'>";
echo "<strong>使用者名稱:</strong> admin<br>";
echo "<strong>密碼:</strong> password<br>";
echo "<strong>⚠️ 注意:</strong> 使用 <code>admin</code> 而不是 email！";
echo "</div>";
?>

