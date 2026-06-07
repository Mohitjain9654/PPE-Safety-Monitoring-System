from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from ppe_main import run_detection
from event_log import get_recent_events, get_violation_stats, init_db
from shapely.geometry import Point, Polygon
import threading

from fastapi.responses import StreamingResponse
import cv2
import time
import ppe_main  #

app = FastAPI()
restricted_zones = [] 

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for dev (later restrict)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DB init once
init_db()

def generate_frames():
    while True:
        if ppe_main.latest_frame is None:
            time.sleep(0.1)
            continue

        _, buffer = cv2.imencode('.jpg', ppe_main.latest_frame)
        frame = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

        time.sleep(0.03)

@app.get("/video_feed")
def video_feed():
    return StreamingResponse(generate_frames(),
        media_type='multipart/x-mixed-replace; boundary=frame')

# ▶ Start detection (UNCHANGED LOGIC)
@app.post("/start-detection")
def start_detection(data: dict):
    source = data.get("source")

    if not source:
        return {"error": "No source provided"}

    thread = threading.Thread(target=run_detection, args=(source,))
    thread.start()

    return {"status": "started", "source": source}


# 🔥 ADD THESE (dashboard ke liye)

@app.get("/events")
def get_events():
    return get_recent_events(50)


@app.get("/stats")
def get_stats():
    return get_violation_stats()


@app.get("/latest")
def latest():
    events = get_recent_events(1)
    return events[0] if events else {}

@app.get("/keypoints")
def get_keypoints():
    return ppe_main.latest_keypoints

@app.post("/set-zone")
def set_zone(data: dict):
    global restricted_zones
    points = data.get("points", [])  # [[x,y], ...] normalized 0-1
    restricted_zones.append(points)
    return {"status": "saved", "points": len(points)}

@app.get("/zones")
def get_zones():
    return restricted_zones