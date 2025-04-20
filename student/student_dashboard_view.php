<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>學生儀表板</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">

<div class="container py-5">
    <h2 class="text-center mb-4">學生儀表板</h2>

    <?php if ($student_data): ?>
        <div class="row">
            <div class="col-12">
                <h4>學號：<?php echo htmlspecialchars($student_data['student_id']); ?></h4>
                <p>姓名：<?php echo htmlspecialchars($student_data['student_name']); ?></p>
                <p>系所：<?php echo htmlspecialchars($student_data['department']); ?></p>
                <p>年級：<?php echo htmlspecialchars($student_data['grade']); ?></p>
                <p>聯絡電話：<?php echo htmlspecialchars($student_data['phone']); ?></p>
                <p>電子郵件：<?php echo htmlspecialchars($student_data['email']); ?></p>
            </div>
        </div>
    <?php else: ?>
        <p>找不到資料，請確認您的帳號是否正確。</p>
    <?php endif; ?>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
