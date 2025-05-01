<?php
$pdo = new PDO("mysql:host=localhost;dbname=testdb;charset=utf8", "root", "");

$stmt = $pdo->query("SELECT * FROM comments ORDER BY created_at DESC");
$comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

// A~Z 對應的 26 種自動顏色表
$colorPalette = [
  ['bg' => 'bg-red-100', 'text' => 'text-red-600'],
  ['bg' => 'bg-orange-100', 'text' => 'text-orange-600'],
  ['bg' => 'bg-amber-100', 'text' => 'text-amber-600'],
  ['bg' => 'bg-yellow-100', 'text' => 'text-yellow-600'],
  ['bg' => 'bg-lime-100', 'text' => 'text-lime-600'],
  ['bg' => 'bg-green-100', 'text' => 'text-green-600'],
  ['bg' => 'bg-emerald-100', 'text' => 'text-emerald-600'],
  ['bg' => 'bg-teal-100', 'text' => 'text-teal-600'],
  ['bg' => 'bg-cyan-100', 'text' => 'text-cyan-600'],
  ['bg' => 'bg-sky-100', 'text' => 'text-sky-600'],
  ['bg' => 'bg-blue-100', 'text' => 'text-blue-600'],
  ['bg' => 'bg-indigo-100', 'text' => 'text-indigo-600'],
  ['bg' => 'bg-violet-100', 'text' => 'text-violet-600'],
  ['bg' => 'bg-purple-100', 'text' => 'text-purple-600'],
  ['bg' => 'bg-fuchsia-100', 'text' => 'text-fuchsia-600'],
  ['bg' => 'bg-pink-100', 'text' => 'text-pink-600'],
  ['bg' => 'bg-rose-100', 'text' => 'text-rose-600'],
  ['bg' => 'bg-stone-100', 'text' => 'text-stone-600'],
  ['bg' => 'bg-gray-100', 'text' => 'text-gray-600'],
  ['bg' => 'bg-zinc-100', 'text' => 'text-zinc-600'],
  ['bg' => 'bg-neutral-100', 'text' => 'text-neutral-600'],
  ['bg' => 'bg-slate-100', 'text' => 'text-slate-600'],
  ['bg' => 'bg-yellow-50', 'text' => 'text-yellow-500'],
  ['bg' => 'bg-green-50', 'text' => 'text-green-500'],
  ['bg' => 'bg-blue-50', 'text' => 'text-blue-500'],
  ['bg' => 'bg-purple-50', 'text' => 'text-purple-500']
];

foreach ($comments as $comment) {
  $firstLetter = strtoupper(mb_substr($comment['username'], 0, 1, 'UTF-8'));
  $ascii = ord($firstLetter);
  $index = ($ascii >= 65 && $ascii <= 90) ? $ascii - 65 : 0; // A~Z 對應 0~25
  $colors = $colorPalette[$index % count($colorPalette)];

  echo '
    <li class="bg-white rounded-md p-3 shadow flex items-start space-x-3">
      <div class="w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg ' . $colors['bg'] . ' ' . $colors['text'] . '">
        ' . $firstLetter . '
      </div>
      <div class="text-gray-800">
        <div class="font-semibold text-sm text-gray-700">' . htmlspecialchars($comment['username']) . '</div>
        <div>' . htmlspecialchars($comment['content']) . '</div>
      </div>
    </li>';
}
?>
