from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI

from pydantic import BaseModel
from pathlib import Path
import json

import threading
import uuid
import cv2
import time

import ppe_main

from event_log import (
    get_recent_events,
    get_violation_stats,
    get_camera_stats,
    get_camera_violation_stats,
    init_db
)

from shapely.geometry import Polygon


# =========================================================
# APP
# =========================================================

app = FastAPI()


# =========================================================
# RESTRICTED ZONES
# =========================================================

restricted_zones = []


# =========================================================
# CAMERA REGISTRY
# =========================================================

cameras = []


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# =========================================================
# DATABASE
# =========================================================

init_db()
# ================= SETTINGS =================

SETTINGS_FILE = Path("settings.json")

DEFAULT_SETTINGS = {
    "workspaceName": "SafetyOps AI",
    "language": "English",
    "timezone": "Asia/Kolkata",

    "confidence": 0.5,

    "ppeDetection": True,
    "poseDetection": True,
    "restrictedZoneDetection": True,

    "criticalAlerts": True,
    "ppeAlerts": True,
    "restrictedZoneAlerts": True,
    "soundAlerts": True,

    "compactLayout": False
}


class SettingsModel(BaseModel):
    workspaceName: str = "SafetyOps AI"
    language: str = "English"
    timezone: str = "Asia/Kolkata"

    confidence: float = 0.5

    ppeDetection: bool = True
    poseDetection: bool = True
    restrictedZoneDetection: bool = True

    criticalAlerts: bool = True
    ppeAlerts: bool = True
    restrictedZoneAlerts: bool = True
    soundAlerts: bool = True

    compactLayout: bool = False


def load_settings():
    if SETTINGS_FILE.exists():
        try:
            with open(SETTINGS_FILE, "r") as f:
                saved_settings = json.load(f)

            return {**DEFAULT_SETTINGS, **saved_settings}

        except (json.JSONDecodeError, OSError):
            pass

    return DEFAULT_SETTINGS.copy()


def save_settings(settings):
    with open(SETTINGS_FILE, "w") as f:
        json.dump(settings, f, indent=4)


# Initialize settings file if it doesn't exist
if not SETTINGS_FILE.exists():
    save_settings(DEFAULT_SETTINGS)


@app.get("/settings")
def get_settings():
    return load_settings()


@app.put("/settings")
def update_settings(settings: SettingsModel):
    updated_settings = settings.model_dump()

    # Validate confidence threshold
    if not 0 <= updated_settings["confidence"] <= 1:
        return {"error": "Confidence must be between 0 and 1"}

    save_settings(updated_settings)

    return {
        "status": "success",
        "message": "Settings updated successfully",
        "settings": updated_settings
    }


# =========================================================
# HELPER - FIND CAMERA
# =========================================================

def find_camera(camera_id):

    for camera in cameras:

        if camera["camera_id"] == camera_id:

            return camera

    return None


# =========================================================
# CAMERA STREAM GENERATOR
# =========================================================

def generate_camera_frames(camera_id):

    while True:

        frame = ppe_main.get_camera_frame(
            camera_id
        )


        # No frame yet
        if frame is None:

            time.sleep(0.1)

            continue


        success, buffer = cv2.imencode(
            ".jpg",
            frame
        )


        if not success:

            time.sleep(0.03)

            continue


        frame_bytes = buffer.tobytes()


        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n"
            + frame_bytes
            + b"\r\n"
        )


        time.sleep(0.03)


# =========================================================
# OLD / DEFAULT VIDEO FEED
# =========================================================

def generate_frames():

    while True:

        frame = ppe_main.latest_frame


        if frame is None:

            time.sleep(0.1)

            continue


        success, buffer = cv2.imencode(
            ".jpg",
            frame
        )


        if not success:

            time.sleep(0.03)

            continue


        frame_bytes = buffer.tobytes()


        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n"
            + frame_bytes
            + b"\r\n"
        )


        time.sleep(0.03)


@app.get("/video_feed")
def video_feed():

    return StreamingResponse(

        generate_frames(),

        media_type=(
            "multipart/x-mixed-replace; "
            "boundary=frame"
        )

    )


# =========================================================
# CAMERA-SPECIFIC VIDEO FEED
# =========================================================

@app.get("/cameras/{camera_id}/video_feed")
def camera_video_feed(camera_id: str):

    camera = find_camera(camera_id)


    if camera is None:

        return {
            "error": "Camera not found"
        }


    return StreamingResponse(

        generate_camera_frames(
            camera_id
        ),

        media_type=(
            "multipart/x-mixed-replace; "
            "boundary=frame"
        )

    )


# =========================================================
# GET ALL CAMERAS
# =========================================================

@app.get("/cameras")
def get_cameras():

    result = []


    for camera in cameras:

        camera_copy = camera.copy()


        camera_copy["status"] = (
            ppe_main.get_camera_status(
                camera["camera_id"]
            )
        )


        result.append(
            camera_copy
        )


    return result


# =========================================================
# ADD CAMERA
# =========================================================

@app.post("/cameras")
def add_camera(data: dict):

    name = data.get("name")

    source = data.get("source")

    camera_type = data.get(
        "type",
        "RTSP"
    )


    # -----------------------------------------------------
    # VALIDATION
    # -----------------------------------------------------

    if not name:

        return {
            "error": "Camera name is required"
        }


    if not source:

        return {
            "error": "Camera source is required"
        }


    # -----------------------------------------------------
    # CREATE CAMERA
    # -----------------------------------------------------

    camera = {

        "camera_id":
            f"camera_{uuid.uuid4().hex[:8]}",

        "name":
            name,

        "source":
            source,

        "type":
            camera_type,

        "status":
            "registered"

    }


    cameras.append(
        camera
    )


    return camera


# =========================================================
# START SPECIFIC CAMERA
# =========================================================

@app.post("/cameras/{camera_id}/start")
def start_camera(camera_id: str):

    camera = find_camera(
        camera_id
    )


    if camera is None:

        return {
            "error": "Camera not found"
        }


    result = (
        ppe_main.start_camera_detection(

            camera_id,

            camera["source"]

        )
    )


    return result


# =========================================================
# STOP SPECIFIC CAMERA
# =========================================================

@app.post("/cameras/{camera_id}/stop")
def stop_camera(camera_id: str):

    camera = find_camera(
        camera_id
    )


    if camera is None:

        return {
            "error": "Camera not found"
        }


    result = (
        ppe_main.stop_camera_detection(
            camera_id
        )
    )


    return result


# =========================================================
# CAMERA STATUS
# =========================================================

@app.get("/cameras/{camera_id}/status")
def camera_status(camera_id: str):

    camera = find_camera(
        camera_id
    )


    if camera is None:

        return {
            "error": "Camera not found"
        }


    return {

        "camera_id":
            camera_id,

        "status":
            ppe_main.get_camera_status(
                camera_id
            )

    }


# =========================================================
# DELETE CAMERA
# =========================================================

@app.delete("/cameras/{camera_id}")
def delete_camera(camera_id: str):

    camera = find_camera(
        camera_id
    )


    if camera is None:

        return {
            "error": "Camera not found"
        }


    # -----------------------------------------------------
    # STOP DETECTION FIRST
    # -----------------------------------------------------

    ppe_main.stop_camera_detection(
        camera_id
    )


    # -----------------------------------------------------
    # REMOVE FROM REGISTRY
    # -----------------------------------------------------

    cameras.remove(
        camera
    )


    return {

        "status":
            "deleted",

        "camera_id":
            camera_id

    }


# =========================================================
# OLD START DETECTION ENDPOINT
# =========================================================

@app.post("/start-detection")
def start_detection(data: dict):

    source = data.get(
        "source"
    )


    if not source:

        return {
            "error":
                "No source provided"
        }


    # -----------------------------------------------------
    # Generate temporary camera ID
    # -----------------------------------------------------

    camera_id = (
        f"camera_{uuid.uuid4().hex[:8]}"
    )


    result = (
        ppe_main.start_camera_detection(

            camera_id,

            source

        )
    )


    return {

        "status":
            result.get(
                "status",
                "started"
            ),

        "source":
            source,

        "camera_id":
            camera_id

    }


# =========================================================
# EVENTS
# =========================================================

@app.get("/events")
def get_events():

    return get_recent_events(
        50
    )


# =========================================================
# STATS
# =========================================================

@app.get("/stats")
def get_stats():

    return get_violation_stats()


# =========================================================
# ANALYTICS - OVERALL VIOLATIONS
# =========================================================

@app.get("/analytics/violations")
def analytics_violations():

    return get_violation_stats()


# =========================================================
# ANALYTICS - CAMERA TOTALS
# =========================================================

@app.get("/analytics/cameras")
def analytics_cameras():

    return get_camera_stats()


# =========================================================
# ANALYTICS - CAMERA + VIOLATION
# =========================================================

@app.get("/analytics/cameras/violations")
def analytics_camera_violations():

    return get_camera_violation_stats()


# =========================================================
# LATEST ALERT
# =========================================================

@app.get("/latest")
def latest():

    events = get_recent_events(
        1
    )


    return (
        events[0]
        if events
        else {}
    )


# =========================================================
# ALL KEYPOINTS
# =========================================================

@app.get("/keypoints")
def get_keypoints():

    return ppe_main.latest_keypoints


# =========================================================
# CAMERA KEYPOINTS
# =========================================================

@app.get("/cameras/{camera_id}/keypoints")
def get_camera_keypoints(
    camera_id: str
):

    camera = find_camera(
        camera_id
    )


    if camera is None:

        return {
            "error":
                "Camera not found"
        }


    return ppe_main.get_camera_keypoints(
        camera_id
    )


# =========================================================
# RESTRICTED ZONES
# =========================================================

@app.post("/set-zone")
def set_zone(data: dict):

    global restricted_zones

    points = data.get(
        "points",
        []
    )


    if len(points) < 3:

        return {
            "error":
                "A zone needs at least 3 points"
        }


    restricted_zones.append(
        points
    )


    return {

        "status":
            "saved",

        "points":
            len(points)

    }


# =========================================================
# GET ZONES
# =========================================================

@app.get("/zones")
def get_zones():

    return restricted_zones


# =========================================================
# CLEAR ZONES
# =========================================================

@app.delete("/zones")
def clear_zones():

    global restricted_zones

    restricted_zones = []


    return {
        "status":
            "cleared"
    }


# =========================================================
# GENERATE 3D LAYOUT
# =========================================================

@app.delete("/generate-layout")
def generate_layout():

    layout = []


    for zone in restricted_zones:

        if len(zone) < 3:

            continue


        polygon = Polygon(
            zone
        )


        layout.append(
            polygon
        )


    return {

        "status":
            "layout generated",

        "layout": [

            list(
                polygon.exterior.coords
            )

            for polygon in layout

        ]

    }
