const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the current directory (index.html, style.css, script.js)
app.use(express.static(path.join(__dirname)));

// Admin Authentication Middleware
app.use((req, res, next) => {
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
        const pwd = req.headers['x-admin-password'];
        if (pwd !== 'kruapo08012552') {
            return res.status(403).json({ error: "Unauthorized: รหัสผ่านแอดมินไม่ถูกต้อง" });
        }
    }
    next();
});

// Database Initialization
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            user_group TEXT NOT NULL,
            avatar TEXT,
            facebook TEXT,
            icon TEXT
        )`, (createErr) => {
            if (createErr) {
                console.error('Error creating table', createErr);
            } else {
                // Insert default data if the table is completely empty
                db.get("SELECT COUNT(*) AS count FROM users", (err, row) => {
                    if (row && row.count === 0) {
                        const stmt = db.prepare("INSERT INTO users (name, user_group, avatar, facebook, icon) VALUES (?, ?, ?, ?, ?)");
                        stmt.run("สมชาย ใจดี", "Head", "https://i.pravatar.cc/150?img=11", "https://facebook.com/", "fa-crown");
                        stmt.run("สมหญิง รักเรียน", "Member", "https://i.pravatar.cc/150?img=5", "https://facebook.com/", "fa-user");
                        stmt.run("กิตติพงษ์ ยอดเยี่ยม", "Head", "https://i.pravatar.cc/150?img=12", "", "fa-crown");
                        stmt.finalize();
                    }
                });
            }
        });
    }
});

// --- API Routes ---

// Get all users
app.get('/api/users', (req, res) => {
    const sql = "SELECT id, name, user_group AS 'group', avatar, facebook, icon FROM users ORDER BY CASE WHEN user_group = 'Head' THEN 1 ELSE 2 END, id DESC";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Add a new user
app.post('/api/users', (req, res) => {
    const { name, group, avatar, facebook, icon } = req.body;
    const sql = "INSERT INTO users (name, user_group, avatar, facebook, icon) VALUES (?, ?, ?, ?, ?)";
    const params = [name, group, avatar, facebook, icon];

    db.run(sql, params, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            id: this.lastID,
            name,
            group,
            avatar,
            facebook,
            icon
        });
    });
});

// Update a user
app.put('/api/users/:id', (req, res) => {
    const { name, group, avatar, facebook, icon } = req.body;
    const id = req.params.id;
    const sql = "UPDATE users SET name = ?, user_group = ?, avatar = ?, facebook = ?, icon = ? WHERE id = ?";
    const params = [name, group, avatar, facebook, icon, id];

    db.run(sql, params, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: "updated", changes: this.changes });
    });
});

// Delete a user
app.delete('/api/users/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM users WHERE id = ?";

    db.run(sql, id, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: "deleted", changes: this.changes });
    });
});

// Route for homepage explicitly
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`\n==============================================`);
    console.log(`🚀 Server is running on: http://localhost:${PORT}`);
    console.log(`==============================================\n`);
});
