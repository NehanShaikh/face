import cv2
import numpy as np
from keras_facenet import FaceNet
import requests
import mysql.connector

# --------------------------
# Config
# --------------------------
USE_COSINE = False   # Set True to use cosine similarity
THRESHOLD = 1.0      # Euclidean: ~0.9–1.2 | Cosine: ~0.5–0.7
FRAMES_REQUIRED = 10 # Number of frames needed before marking attendance

# --------------------------
# Initialize FaceNet
# --------------------------
embedder = FaceNet()
already_marked = set()
detection_counts = {}   # Track detections per student

# --------------------------
# DB connection
# --------------------------
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="StrongPass@123",
    database="face_attendance"
)
cursor = conn.cursor()

# Load saved embeddings
cursor.execute("""
    SELECT s.name, f.embedding FROM face_embeddings f
    JOIN students s ON s.student_id = f.student_id
""")
known_embeddings, names = [], []
for name, emb_str in cursor.fetchall():
    emb = np.array(list(map(float, emb_str.strip('[]').split(','))))
    known_embeddings.append(emb)
    names.append(name)

# --------------------------
# Attendance marking
# --------------------------
def mark_attendance(name):
    if name not in already_marked:
        try:
            r = requests.post("http://localhost:3000/attendance", json={"name": name})
            if r.ok:
                already_marked.add(name)
                print(f"✅ Attendance marked: {name}")
            else:
                print(f"❌ API failed ({r.status_code})")
        except Exception as e:
            print("Error:", e)

# --------------------------
# Similarity functions
# --------------------------
def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# --------------------------
# Webcam loop
# --------------------------
cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    results = embedder.extract(frame, threshold=0.95)  # MTCNN + embeddings
    for res in results:
        x, y, w, h = res['box']
        x, y = max(0, x), max(0, y)
        emb = res['embedding']

        # Default unknown
        name = "Unknown"

        if USE_COSINE:
            max_sim, best_match = -1, None
            for i, known_emb in enumerate(known_embeddings):
                sim = cosine_similarity(emb, known_emb)
                if sim > max_sim:
                    max_sim, best_match = sim, names[i]

            if max_sim >= THRESHOLD:
                name = best_match
        else:
            min_dist, best_match = float('inf'), None
            for i, known_emb in enumerate(known_embeddings):
                dist = np.linalg.norm(emb - known_emb)
                if dist < min_dist:
                    min_dist, best_match = dist, names[i]

            if min_dist <= THRESHOLD:
                name = best_match

        # Draw box & label
        cv2.rectangle(frame, (x, y), (x+w, y+h), (0,255,0), 2)
        cv2.putText(frame, name, (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,255,0), 2)

        # --------------------------
        # Frame-count based attendance
        # --------------------------
        if name != "Unknown":
            detection_counts[name] = detection_counts.get(name, 0) + 1

            # Mark only if detected in required frames
            if detection_counts[name] >= FRAMES_REQUIRED and name not in already_marked:
                mark_attendance(name)
                detection_counts[name] = 0   # reset after marking
        else:
            detection_counts["Unknown"] = 0

    cv2.imshow("Recognition", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
