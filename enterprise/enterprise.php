<?php
session_start();
require_once __DIR__ . '/../includes/db_connect.php';

// 判斷是否登入（有 company_id 則為編輯，否則為註冊）
$editing = isset($_SESSION['company_id']);
$company = [
    'name' => '', 'email' => '', 'logo' => '', 'address' => '', 'phone' => '',
    'website' => '', 'description' => '', 'industry' => '', 'size' => '', 'founded_year' => ''
];

if ($editing) {
    $company_id = $_SESSION['company_id'];
    $sql = "SELECT * FROM company_profiles WHERE company_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $company_id);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows === 1) {
        $company = $result->fetch_assoc();
    }
    $stmt->close();
}

// 處理表單提交
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = $_POST['name'] ?? '';
    $email = $_POST['email'] ?? '';
    $address = $_POST['address'] ?? '';
    $phone = $_POST['phone'] ?? '';
    $website = $_POST['website'] ?? '';
    $description = $_POST['description'] ?? '';
    $industry = $_POST['industry'] ?? '';
    $size = $_POST['size'] ?? '';
    $founded_year = $_POST['founded_year'] ?? '';
    $logo = $company['logo'] ?? '';
    // 處理logo上傳
    if (isset($_FILES['logo']) && $_FILES['logo']['error'] === UPLOAD_ERR_OK) {
        $ext = pathinfo($_FILES['logo']['name'], PATHINFO_EXTENSION);
        $logo = 'company_' . time() . '.' . $ext;
        move_uploaded_file($_FILES['logo']['tmp_name'], __DIR__ . '/../uploads/' . $logo);
    }
    if ($editing) {
        // 編輯模式
        $sql = "UPDATE company_profiles SET name=?, email=?, logo=?, address=?, phone=?, website=?, description=?, industry=?, size=?, founded_year=? WHERE company_id=?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('ssssssssssi', $name, $email, $logo, $address, $phone, $website, $description, $industry, $size, $founded_year, $company_id);
        $stmt->execute();
        $stmt->close();
        $msg = '資料已更新！';
    } else {
        // 註冊模式
        $password = password_hash($_POST['password'], PASSWORD_DEFAULT);
        $sql = "INSERT INTO company_profiles (name, email, password, logo, address, phone, website, description, industry, size, founded_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('sssssssssss', $name, $email, $password, $logo, $address, $phone, $website, $description, $industry, $size, $founded_year);
        $stmt->execute();
        $stmt->close();
        $msg = '註冊成功，請登入！';
    }
    // 重新導向避免重複提交
    header('Location: enterprise.php?success=1');
    exit();
}
$conn->close();
?>

<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>企業基本資料填寫</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50">
    <div class="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div class="max-w-2xl mx-auto">
            <h2 class="text-2xl font-bold text-center text-gray-900 mb-8">
                <?= $editing ? '編輯企業資料' : '企業註冊' ?>
            </h2>
            <?php if (isset($_GET['success'])): ?>
                <div class="mb-6 p-4 bg-green-100 text-green-700 rounded-lg flex items-center justify-between">
                    <span>資料已成功送出！</span>
                </div>
            <?php endif; ?>
            <form method="POST" enctype="multipart/form-data" class="bg-white shadow-sm rounded-lg p-6 space-y-6">
                <div class="space-y-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">公司名稱</label>
                    <input type="text" name="name" required value="<?= htmlspecialchars($company['name']) ?>" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div class="space-y-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">公司電子郵件</label>
                    <input type="email" name="email" required value="<?= htmlspecialchars($company['email']) ?>" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                </div>
                <?php if (!$editing): ?>
                <div class="space-y-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">密碼</label>
                    <input type="password" name="password" required class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                </div>
                <?php endif; ?>
                <div class="space-y-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">公司標誌</label>
                    <input type="file" name="logo" accept="image/*" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                    <?php if ($editing && $company['logo']): ?>
                        <img src="/portfolio/uploads/<?= htmlspecialchars($company['logo']) ?>" alt="公司標誌" class="h-16 mt-2">
                    <?php endif; ?>
                </div>
                <div class="space-y-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">公司地址</label>
                    <input type="text" name="address" value="<?= htmlspecialchars($company['address']) ?>" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div class="space-y-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">聯絡電話</label>
                    <input type="text" name="phone" value="<?= htmlspecialchars($company['phone']) ?>" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div class="space-y-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">公司網站</label>
                    <input type="url" name="website" value="<?= htmlspecialchars($company['website']) ?>" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div class="space-y-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">公司簡介</label>
                    <textarea name="description" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"><?= htmlspecialchars($company['description']) ?></textarea>
                </div>
                <div class="space-y-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">產業類別</label>
                    <input type="text" name="industry" value="<?= htmlspecialchars($company['industry']) ?>" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div class="space-y-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">公司規模</label>
                    <input type="text" name="size" value="<?= htmlspecialchars($company['size']) ?>" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div class="space-y-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">成立年份</label>
                    <input type="number" name="founded_year" value="<?= htmlspecialchars($company['founded_year']) ?>" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div class="flex justify-center pt-4">
                    <button type="submit" class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        <i class="fas fa-save mr-2"></i><?= $editing ? '儲存修改' : '註冊' ?>
                    </button>
                </div>
            </form>
        </div>
    </div>
</body>
</html>
