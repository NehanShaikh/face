import cv2
import numpy as np
from keras_facenet import FaceNet
import requests
import mysql.connector

# Initialize FaceNet embedder
embedder = FaceNet()
already_marked = set()

# Database connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="StrongPass@123",
    database="face_attendance"
)
cursor = conn.cursor()

# Load all saved embeddings from DB (once at the start)
cursor.execute("""
    SELECT s.name, f.embedding FROM face_embeddings f
    JOIN students s ON s.student_id = f.student_id
""")
known_embeddings = []
names = []

for name, emb_str in cursor.fetchall():
    emb = np.fromstring(emb_str.strip('[]'), sep=',')
    known_embeddings.append(emb)
    names.append(name)

def mark_attendance(name):
    if name not in already_marked:
        try:
            r = requests.post("http://localhost:3000/attendance", json={"name": name})
            if r.status_code == 200:
                already_marked.add(name)
                print(f"✅ Attendance marked: {name}")
            else:
                print("❌ Attendance API failed.")
        except Exception as e:
            print("Error:", e)

# Start webcam
cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    results = embedder.extract(frame, threshold=0.95)  # detect + embed
    for res in results:
        x, y, w, h = res['box']
        emb = res['embedding']
        
        name = "Unknown"
        min_dist = float('inf')
        threshold = 1.1  # Try tuning if needed

        for i, known_emb in enumerate(known_embeddings):
            dist = np.linalg.norm(emb - known_emb)
            if dist < min_dist:
                min_dist = dist
                if dist < threshold:
                    name = names[i]

        # Draw face box and name
        cv2.rectangle(frame, (x, y), (x+w, y+h), (0,255,0), 2)
        cv2.putText(frame, name, (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,255,0), 2)

        if name != "Unknown":
            mark_attendance(name)

    cv2.imshow("Recognition", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
