const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// ✅ MySQL Connection
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

// ✅ POST /attendance — Mark attendance
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

// ✅ GET /run/:script — Run Python script
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


// Optional: Catch-all for invalid routes
app.use((req, res) => {
    res.status(404).send("❌ Route not found");
});

// ✅ Start server
app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});
