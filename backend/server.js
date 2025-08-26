const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;

// ---------------- MIDDLEWARE ----------------
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// ---------------- DATABASE ----------------
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'StrongPass@123',
    database: 'face_attendance'
});

db.connect(err => {
    if (err) throw err;
    console.log("✅ MySQL Connected!");
});

// ---------------- AUTH ----------------
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, "secretkey", (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// ---------------- LOGIN ----------------
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: "Username and password required" });

    const sql = "SELECT * FROM users WHERE username=? AND password=?";
    db.query(sql, [username, password], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(401).json({ error: "Invalid credentials" });

        const user = results[0];
        const token = jwt.sign({
            id: user.user_id,
            role: user.role,
            student_id: user.student_id,
            faculty_id: user.faculty_id,
            username: user.username
        }, "secretkey", { expiresIn: "2h" });

        res.json({ token, role: user.role, username: user.username });
    });
});


app.post('/attendance', (req, res) => {
    const { name } = req.body;

    const getStudentIdQuery = "SELECT student_id FROM students WHERE name = ?";
    db.query(getStudentIdQuery, [name], (err, results) => {
        if (err) {
            console.error("❌ Error fetching student_id:", err);
            return res.status(500).send("Internal Server Error");
        }

        if (results.length === 0) {
            console.warn("⚠️ Student not found:", name);
            return res.status(404).send("Student not found");
        }

        const student_id = results[0].student_id;

        const insertAttendanceQuery = "INSERT INTO attendance (student_id, name) VALUES (?, ?)";
        db.query(insertAttendanceQuery, [student_id, name], (err, result) => {
            if (err) {
                console.error("❌ Error inserting attendance:", err);
                return res.status(500).send("Failed to mark attendance");
            }

            console.log(`✅ Attendance marked for ${name} (ID: ${student_id})`);
            res.send({ status: "success", student_id });
        });
    });
});

// ✅ GET /attendance — Fetch logs
app.get('/attendance', (req, res) => {
    const sql = `
        SELECT a.attendance_id, a.name, a.timestamp
        FROM attendance a
        ORDER BY a.timestamp DESC
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error("❌ Error fetching attendance:", err);
            return res.status(500).send("Failed to retrieve attendance");
        }

        res.send(results);
    });
});

// ---------------- STUDENT ROUTES ----------------
// Get student attendance (student)
app.get('/student/attendance', authenticateToken, (req, res) => {
    if (req.user.role !== 'student') return res.status(403).json({ error: "Forbidden" });

    const sql = "SELECT attendance_id, name, timestamp FROM attendance WHERE student_id=? ORDER BY timestamp DESC";
    db.query(sql, [req.user.student_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ---------------- FACULTY ROUTES ----------------
// Get all students
app.get('/faculty/students', authenticateToken, (req, res) => {
    if (req.user.role !== 'faculty') return res.status(403).json({ error: "Forbidden" });

    db.query("SELECT * FROM students", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Add student
app.post('/faculty/students', authenticateToken, (req, res) => {
    if (req.user.role !== 'faculty') return res.status(403).json({ error: "Forbidden" });

    const { name, roll_number, class_name, email, phone } = req.body;
    const sql = "INSERT INTO students (name, roll_number, class, email, phone) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [name, roll_number, class_name, email, phone], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Student added", student_id: result.insertId });
    });
});

// Update student
app.put('/faculty/students/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'faculty') return res.status(403).json({ error: "Forbidden" });

    const id = req.params.id;
    const { name, roll_number, class_name, email, phone } = req.body;
    const sql = "UPDATE students SET name=?, roll_number=?, class=?, email=?, phone=? WHERE student_id=?";
    db.query(sql, [name, roll_number, class_name, email, phone, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: "Student not found" });
        res.json({ message: "Student updated" });
    });
});

// Delete student
app.delete('/faculty/students/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'faculty') return res.status(403).json({ error: "Forbidden" });

    const id = req.params.id;
    const sql = "DELETE FROM students WHERE student_id=?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: "Student not found" });
        res.json({ message: "Student deleted" });
    });
});

// Get all attendance records
app.get('/faculty/attendance', authenticateToken, (req, res) => {
    if (req.user.role !== 'faculty') return res.status(403).json({ error: "Forbidden" });

    db.query("SELECT * FROM attendance ORDER BY timestamp DESC", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Add attendance
app.post('/faculty/attendance', authenticateToken, (req, res) => {
    if (req.user.role !== 'faculty') return res.status(403).json({ error: "Forbidden" });

    const { student_id, name } = req.body;
    const sql = "INSERT INTO attendance (student_id, name, timestamp) VALUES (?, ?, NOW())";
    db.query(sql, [student_id, name], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Attendance added", attendance_id: result.insertId });
    });
});

// Update attendance
app.put('/faculty/attendance/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'faculty') return res.status(403).json({ error: "Forbidden" });

    const id = req.params.id;
    const { student_id, timestamp } = req.body;
    const sql = "UPDATE attendance SET student_id=?, timestamp=? WHERE attendance_id=?";
    db.query(sql, [student_id, timestamp, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: "Attendance not found" });
        res.json({ message: "Attendance updated" });
    });
});

// Delete attendance
app.delete('/faculty/attendance/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'faculty') return res.status(403).json({ error: "Forbidden" });

    const id = req.params.id;
    const sql = "DELETE FROM attendance WHERE attendance_id=?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: "Attendance not found" });
        res.json({ message: "Attendance deleted" });
    });
});

// ---------------- PYTHON SCRIPT RUNNING ----------------
app.get('/run/:script', (req, res) => {
    const script = req.params.script;
    const userName = req.query.name || ""; // <-- get name from query

    const allowedScripts = [
        '1_capture_images.py',
        '2_crop_faces.py',
        '3_generate_embeddings.py',
        'insert_embedding.py',
        '4_face_recognition.py'
    ];

    if (!allowedScripts.includes(script)) {
        return res.status(400).send("❌ Script not allowed.");
    }

    const scriptPath = path.join(__dirname, 'python_scripts', script);

    // Add username as argument
    const command = `/home/hp/Downloads/face/faceenv/bin/python "${scriptPath}" "${userName}"`;


    exec(command, (err, stdout, stderr) => {
        if (err) {
            console.error(`❌ Error running ${script}:`, stderr);
            return res.status(500).send(`❌ Error:\n${stderr}`);
        }

        console.log(`✅ Successfully ran ${script}`);
        res.json({ output: stdout.trim() });
    });
});

app.get('/run_capture/:name', (req, res) => {
    const script = '1_capture_images.py';
    const name = req.params.name;
    const scriptPath = path.join(__dirname, 'python_scripts', script);

    const command = `python3 "${scriptPath}" "${name}"`;
    exec(command, (err, stdout, stderr) => {
        if (err) {
            console.error(`❌ Script error:`, stderr);
            return res.status(500).json({ output: `Error:\n${stderr}` });
        }

        console.log(`✅ Ran capture for ${name}`);
        res.json({ output: stdout.trim() });
    });
});

app.get("/crop", (req, res) => {
    const name = req.query.name;

    if (!name) {
        return res.status(400).send("❌ Name query parameter missing!");
    }

    const scriptPath = path.join(__dirname, 'python_scripts', '2_crop_faces.py');
    const command = `python3 "${scriptPath}" "${name}"`;

    exec(command, (err, stdout, stderr) => {
        if (err) {
            console.error(`❌ Error running 2_crop_faces.py:`, stderr);
            return res.status(500).send(`❌ Error:\n${stderr}`);
        }

        console.log(`✅ Cropped faces for ${name}`);
        res.json({ output: stdout.trim() });
    });
});

app.post("/crop-faces", (req, res) => {
  const { name } = req.body;
  console.log(`⏳ Running 2_crop_faces.py for ${name}...`);

  const process = exec(`python3 backend/python_scripts/2_crop_faces.py ${name}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error: ${error.message}`);
      return res.status(500).send("Crop script failed.");
    }
    if (stderr) console.error(`⚠️ stderr: ${stderr}`);
    console.log(`✅ stdout: ${stdout}`);
    res.send("✅ Cropping done");
  });
});


app.get('/run_embedding/:name', (req, res) => {
    const name = req.params.name;
    const scriptPath = path.join(__dirname, 'python_scripts', 'insert_embedding.py');
    const command = `python3 "${scriptPath}" "${name}"`;

    exec(command, (err, stdout, stderr) => {
        if (err) {
            console.error(`❌ Error running insert_embedding:`, stderr);
            return res.status(500).json({ error: stderr });
        }

        console.log(`✅ Embedding inserted for ${name}`);
        res.send({ output: stdout.trim() });
    });
});

// ---------------- CATCH ALL ----------------
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// ---------------- START SERVER ----------------
app.listen(port, () => console.log(`🚀 Server running at http://localhost:${port}`));
