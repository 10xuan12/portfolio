require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise"); // 使用 promise-based MySQL 連線
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || "default_secret_key"; // 確保 SECRET_KEY 存在

// 允許跨來源請求 (CORS)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static("public"));

// 連接 MySQL
const dbConfig = {
    host: "127.0.0.1",
    user: "root",
    password: "a1050203",
    database: "portfolio",
    port: 3306,
};

let db;
async function connectDB() {
    try {
        db = await mysql.createPool(dbConfig);
        console.log("✅ 成功連接到 MySQL");
    } catch (err) {
        console.error("❌ 無法連接到 MySQL:", err);
    }
}
connectDB();

// 測試 API
app.get("/", (req, res) => {
    res.send("🚀 伺服器運行中！");
});

// 註冊 API
app.post("/register", async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
        return res.status(400).json({ success: false, error: "請提供所有必要資訊" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";
        const [result] = await db.execute(sql, [name, email, hashedPassword, role]);

        res.status(201).json({ message: "註冊成功", userId: result.insertId });
    } catch (error) {
        console.error("❌ 註冊錯誤:", error);
        res.status(500).json({ message: "註冊失敗" });
    }
});

// 登入 API
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "請提供電子郵件與密碼" });
    }

    try {
        const sql = "SELECT * FROM users WHERE email = ?";
        const [results] = await db.execute(sql, [email]);

        if (results.length === 0) {
            return res.status(400).json({ message: "用戶不存在" });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "密碼錯誤" });
        }

        // 生成 JWT Token
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: "2h" });

        res.json({ message: "登入成功", token });
    } catch (err) {
        console.error("❌ 登入錯誤:", err);
        return res.status(500).json({ message: "登入失敗" });
    }
});
// 路由處理，更新學生資料
app.put('/api/student/:id', (req, res) => {
    const studentId = req.params.id;
    const { name, major, graduation_year, bio, profile_picture } = req.body;

    const query = `UPDATE students 
                   SET name = ?, major = ?, graduation_year = ?, bio = ?, profile_picture = ? 
                   WHERE student_id = ?`;

    db.query(query, [name, major, graduation_year, bio, profile_picture, studentId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: '資料更新錯誤' });
        }
        res.json({ message: '資料更新成功' });
    });
});
// 路由處理，取得學生資料
app.get('/api/student/:id', (req, res) => {
    const studentId = req.params.id;
    db.query('SELECT * FROM students WHERE student_id = ?', [studentId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: '資料查詢錯誤' });
        }
        res.json(result[0]);
    });
});
// 路由處理，企業發送訊息給學生
app.post('/api/message', (req, res) => {
    const { student_id, company_id, message_content } = req.body;

    const query = `INSERT INTO messages (student_id, company_id, message_content) 
                   VALUES (?, ?, ?)`;

    db.query(query, [student_id, company_id, message_content], (err, result) => {
        if (err) {
            return res.status(500).json({ error: '訊息發送失敗' });
        }
        res.json({ message: '訊息發送成功' });
    });
});


// 啟動伺服器
app.listen(PORT, () => {
    console.log(`🚀 伺服器運行於 http://localhost:${PORT}`);
});
