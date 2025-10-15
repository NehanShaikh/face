```markdown
# 🎥 AI-Powered Smart Attendance System using CCTV Camera

An advanced **AI + Computer Vision-based Attendance Management System** that automates student attendance and behavioral analysis using live CCTV footage.  
It uses **Face Recognition (MTCNN + FaceNet)**, a secure **web dashboard**, and **MySQL + Node.js backend** for real-time processing and monitoring.

---

## 🧠 Project Overview

Traditional attendance systems are time-consuming and prone to errors.  
This project eliminates manual work by integrating **AI-based face recognition** through CCTV cameras and linking it with an intelligent web interface for automated attendance marking and behavior monitoring.

The system identifies individuals from live CCTV feeds, verifies their identity against a database, and logs attendance automatically with timestamps.

---

## 🚀 Key Features

- 📸 **Automatic Attendance** through real-time face recognition  
- 🧠 **AI-Based Behavior Monitoring** for detecting student focus, attention, or unusual activity  
- 🎥 **CCTV Integration** — uses pre-existing camera feeds  
- 👩‍🏫 **Role-Based Access** (Admin, Faculty, Student dashboards)  
- 💾 **MySQL Database** for secure storage of attendance and user data  
- 💻 **Web Interface** built using HTML, CSS, and JavaScript  
- ⚙️ **Backend with Node.js + Express.js**  
- 🐍 **Python Scripts** for image capture, training, embedding, and recognition  

---

## 🗂️ Folder Structure

```

AI_CCTV_Attendance/
├── backend/
│   ├── server.js
│   ├── routes/
│   │   ├── login.js
│   │   ├── attendance.js
│   └── database/
│       └── connection.js
│
├── python_scripts/
│   ├── 1_capture_images.py
│   ├── 2_crop_faces.py
│   ├── 3_generate_embeddings.py
│   ├── insert_embedding.py
│   └── 4_face_recognition.py
│
├── frontend/
│   ├── pipeline.html
│   ├── admin.html
│   ├── faculty.html
│   ├── student.html
│   ├── assets/
│   └── css/
│
├── database/
│   └── face_db_fym1.sql
│
├── README.md
└── package.json

````

---

## ⚙️ Tech Stack

### 🧩 Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Bootstrap 5 for styling
- Dynamic role-based pages (Admin, Faculty, Student)

### 🖥️ Backend
- Node.js + Express.js
- REST APIs for login, attendance retrieval, and management

### 🧠 AI & Computer Vision
- **Python (OpenCV, MTCNN, FaceNet)**
- Image Embedding and Similarity Matching for Recognition

### 🗄️ Database
- **MySQL** hosted locally or on Render

---

## 🔒 Authentication Flow

- Users (Admin/Faculty/Student) log in via the web portal.
- Credentials are verified via Node.js backend.
- Upon success, a **JWT token** is issued and stored in `localStorage`.
- Based on the user role, the system redirects to:
  - `admin.html` → Manage users and attendance
  - `faculty.html` → Monitor class attendance
  - `student.html` → View personal attendance

---

## 🧰 Setup & Installation

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/yourusername/AI_CCTV_Attendance.git
cd AI_CCTV_Attendance
````

### 2️⃣ Backend Setup

```bash
cd backend
npm install
node server.js
```

### 3️⃣ Python Environment Setup

```bash
cd python_scripts
pip install -r requirements.txt
```

**Sample requirements.txt**

```
opencv-python
keras-facenet
mtcnn
numpy
requests
psycopg2
```

### 4️⃣ MySQL Setup

* Create a database (e.g., `face_db_fym1`)
* Import `face_db_fym1.sql`
* Update credentials in `database/connection.js`

### 5️⃣ Run Face Recognition

Run Python scripts sequentially:

```bash
python 1_capture_images.py
python 2_crop_faces.py
python 3_generate_embeddings.py
python insert_embedding.py
python 4_face_recognition.py
```

### 6️⃣ Frontend Access

Open `frontend/login.html` in your browser.
Default backend runs on `http://localhost:3000`

---

## 🧩 How It Works

1. **Image Capture:** Captures student images and stores them locally.
2. **Face Detection (MTCNN):** Detects faces from captured images.
3. **Feature Embedding (FaceNet):** Generates 128D feature vectors for each face.
4. **Database Storage:** Stores embeddings and user data in MySQL.
5. **Live Recognition:** CCTV feed runs real-time recognition and marks attendance.
6. **Dashboard:** Displays attendance logs per user/subject/date.

---

## 🧑‍🏫 Roles and Access

| Role        | Access Rights                                     |
| ----------- | ------------------------------------------------- |
| **Admin**   | Add/remove users, manage attendance, view reports |
| **Faculty** | View student attendance, monitor behavior         |
| **Student** | View personal attendance and history              |

---

## 📊 Example Login Flow

1. Enter username & password → `/login` API
2. Server verifies credentials in MySQL
3. Response → `{ token, role }`
4. Browser saves data in `localStorage`
5. Redirects user based on role

---

## 🧠 Future Enhancements

* 📈 Emotion or Attention Tracking via AI
* 📹 Multi-Camera Feed Integration
* ☁️ Cloud Deployment (AWS / Render / Azure)
* 📱 Mobile Dashboard for Faculty and Students
* 🕵️ Face Spoofing Detection

---

## 👨‍💻 Contributors

* **Nehan Shaikh** — Lead Developer (AI & Web Integration)
* **Team Members** — AI Model Training, Frontend, Database

---

## 🪪 License

This project is licensed under the **MIT License** — feel free to use and modify.

---

**📧 Contact:**
📩 [nehan.shaikh07@outlook.com](mailto:nehan.shaikh07@outlook.com)
🌐 GitHub: [https://github.com/NehanShaikh](https://github.com/NehanShaikh)

Would you like me to also include a **project diagram (architecture + flow)** section (in Markdown or image format) showing how the CCTV feed connects with Python + backend + frontend? It would make your README stand out for reports and GitHub.
