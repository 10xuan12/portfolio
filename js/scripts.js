const API_URL = ""; // 直接留空，讓請求相對於目前的網站目錄

// **註冊用戶**
async function registerUser(event) {
    event.preventDefault(); // 防止表單提交刷新頁面

    let formData = new FormData(document.getElementById("registerForm"));

    try {
        console.log("📤 發送註冊請求...");

        const response = await fetch("register.php", { // 修改為 PHP API
            method: "POST",
            body: formData
        });

        const result = await response.json();
        console.log("🔄 註冊回應:", result);

        if (result.status === "success") {
            alert("✅ 註冊成功！請登入");
            window.location.href = "login.html"; // 跳轉到登入頁面
        } else {
            alert(`❌ 註冊失敗: ${result.message}`);
        }
    } catch (error) {
        console.error("❌ 註冊錯誤:", error);
        alert("❌ 無法連接伺服器，請稍後再試");
    }
}

// **登入用戶**
async function loginUser(event) {
    event.preventDefault(); // 防止表單提交刷新頁面

    let formData = new FormData(document.getElementById("loginForm"));

    try {
        console.log("📤 發送登入請求...");

        const response = await fetch("login.php", { // 修改為 PHP API
            method: "POST",
            body: formData
        });

        const result = await response.json();
        console.log("🔄 伺服器回應:", result);

        if (result.status === "success") {
            localStorage.setItem("token", result.token); // 假設後端有提供 token
            showSuccessMessage("🎉 登入成功！");
            setTimeout(() => {
                window.location.href = "student.html";
            }, 1500);
        } else {
            alert(`❌ 登入失敗: ${result.message}`);
        }
    } catch (error) {
        console.error("❌ 登入錯誤:", error);
        alert("❌ 無法連接伺服器，請稍後再試");
    }
}

// **顯示成功訊息**
function showSuccessMessage(message) {
    let successBox = document.createElement("div");
    successBox.className = "success-message";
    successBox.innerHTML = `<span class="success-icon">✅</span> ${message}`;

    document.body.appendChild(successBox);
    successBox.style.display = "block";

    setTimeout(() => {
        successBox.style.display = "none";
        successBox.remove();
    }, 3000);
}

// **綁定註冊與登入按鈕**
document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ 網頁已載入");

    const currentPage = window.location.pathname;

    if (currentPage.endsWith("register.html")) {
        console.log("🔹 檢查註冊表單...");
        const registerForm = document.querySelector("#registerForm");
        if (registerForm) {
            registerForm.addEventListener("submit", registerUser);
        } else {
            console.error("❌ 找不到 `#registerForm`，請確認 HTML");
        }
    }

    if (currentPage.endsWith("login.html")) {
        console.log("🔹 檢查登入表單...");
        const loginForm = document.getElementById("loginForm");
        if (loginForm) {
            console.log("🔑 登入表單已找到");
            loginForm.addEventListener("submit", loginUser);
        } else {
            console.error("❌ 找不到 `#loginForm`，請確認 HTML");
        }
    }
});
