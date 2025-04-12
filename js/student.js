document.addEventListener("DOMContentLoaded", function () {
    // 聯絡按鈕事件
    document.getElementById("contact-btn").addEventListener("click", function () {
        alert("請聯絡 mail@000.com");
    });

    // 履歷表按鈕事件
    document.getElementById("resume-btn").addEventListener("click", function () {
        window.location.href = "images/411146708黃玟瑄.pdf"; // 假設履歷表是 PDF 檔案
    });

    // 編輯按鈕事件
    document.querySelector(".edit-btn").addEventListener("click", function () {
        alert("進入編輯模式");
    });

    // 取得學生資料並更新在線狀態
    const studentId = 1; // 假設是當前學生的 ID
    fetch(`/student.php?student_id=${studentId}`)  // 使用 GET 請求來傳遞學生 ID，根據實際情況修改
        .then(response => response.json())
        .then(data => {
            const statusElement = document.getElementById("status");
            const statusDot = document.getElementById("status-dot");

            if (data.error) {
                console.error(data.error);
                return;
            }

            // 填充學生資料到頁面
            document.getElementById("student-name").textContent = data.name;
            document.getElementById("student-major").textContent = data.major;
            document.getElementById("student-bio").textContent = data.bio;

            // 更新在線狀態
            if (data.status === "online") {
                statusElement.textContent = "上線中";
                statusDot.style.backgroundColor = "green";
            } else {
                statusElement.textContent = "下線中";
                statusDot.style.backgroundColor = "red";
            }
        })
        .catch(error => console.error("Error fetching student data:", error));

    // 更新學生資料
    document.getElementById("update-btn").addEventListener("click", function () {
        const name = document.getElementById("name-input").value;
        const major = document.getElementById("major-input").value;
        const bio = document.getElementById("bio-input").value;

        const formData = new FormData();
        formData.append("student_id", studentId);
        formData.append("name", name);
        formData.append("major", major);
        formData.append("bio", bio);

        fetch("/student.php", {
            method: "POST",
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    alert(data.message);
                } else {
                    alert(data.error || "更新失敗");
                }
            })
            .catch(error => console.error('Error updating student data:', error));
    });

    // 更新學生在線狀態
    document.getElementById("status-update-btn").addEventListener("click", function () {
        const status = document.getElementById("status-input").value; // 可以是 'online' 或 'offline'

        const formData = new FormData();
        formData.append("student_id", studentId);
        formData.append("status", status);

        fetch("/student.php", {
            method: "POST",
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    alert(data.message);
                    // 更新狀態顯示
                    const statusElement = document.getElementById("status");
                    const statusDot = document.getElementById("status-dot");
                    if (status === "online") {
                        statusElement.textContent = "上線中";
                        statusDot.style.backgroundColor = "green";
                    } else {
                        statusElement.textContent = "下線中";
                        statusDot.style.backgroundColor = "red";
                    }
                } else {
                    alert(data.error || "狀態更新失敗");
                }
            })
            .catch(error => console.error('Error updating status:', error));
    });
});
