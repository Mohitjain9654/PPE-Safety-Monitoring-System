from datetime import datetime
from collections import deque
import cv2
import os
from ultralytics import YOLO
from ppe_nlp import generate_alert
from event_log import init_db, log_event
import api 
from shapely.geometry import Point, Polygon  # <-- Added for polygon zone checks

ZONE = "Zone A"
FRAME_BUFFER_SIZE = 10

pose_model = YOLO('/Users/mohitjain965405gmail.com/Downloads/ppe/yolo26s-pose.pt')
ppe_model  = YOLO('/Users/mohitjain965405gmail.com/Downloads/ppe/ppe_yolo.pt')

frame_buffers    = {}
confirmed_states = {}

# Global frames for streaming
latest_frame     = None
latest_keypoints = []  # list of persons with keypoints + violations


def is_in_any_zone(kp_normalized, zones):
    """kp = [x,y] normalized (0-1), zones = list of polygons"""
    pt = Point(kp_normalized)
    for zone_pts in zones:
        if len(zone_pts) >= 3:
            poly = Polygon(zone_pts)
            if poly.contains(pt):
                return True
    return False


def update_validator(person_id, current_violations: set) -> bool:
    if person_id not in frame_buffers:
        frame_buffers[person_id]    = deque(maxlen=FRAME_BUFFER_SIZE)
        confirmed_states[person_id] = None

    buffer = frame_buffers[person_id]
    buffer.append(frozenset(current_violations))

    if len(buffer) < FRAME_BUFFER_SIZE:
        return False

    if len(set(buffer)) != 1:
        return False

    consistent_state = current_violations

    if consistent_state != confirmed_states[person_id]:
        confirmed_states[person_id] = consistent_state
        return True

    return False


def check_near(point, objects):
    px, py = int(point[0]), int(point[1])
    for (x1, y1, x2, y2, conf) in objects:
        if x1 < px < x2 and y1 < py < y2:
            return True, conf
    return False, 0.0


def run_detection(source):

    if not os.path.isabs(source):
        source = os.path.join("/Users/mohitjain965405gmail.com/Downloads/ppe", source)

    cap = cv2.VideoCapture(source)

    if not cap.isOpened():
        print("❌ Cannot open:", source)
        return

    init_db()

    frame_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame_count += 1

        if frame_count % 5 != 0:
            continue

        frame_h, frame_w = frame.shape[:2]  # get actual frame dimensions
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        pose_results = pose_model(frame, conf=0.4)
        ppe_results  = ppe_model(frame, conf=0.4)

        annotated = pose_results[0].plot()

        helmets, vests, gloves, boots = [], [], [], []

        for box in ppe_results[0].boxes:
            cls   = int(box.cls[0])
            label = ppe_model.names[cls]
            conf  = float(box.conf[0])
            x1, y1, x2, y2 = map(int, box.xyxy[0])

            if label == "helmet":
                helmets.append((x1, y1, x2, y2, conf))
            elif label == "vest":
                vests.append((x1, y1, x2, y2, conf))
            elif label == "gloves":
                gloves.append((x1, y1, x2, y2, conf))
            elif label == "boots":
                boots.append((x1, y1, x2, y2, conf))

        # build keypoints list fresh every processed frame
        frame_keypoints = []

        for r in pose_results:
            if r.keypoints is None:
                continue

            for kp_idx, person_kp in enumerate(r.keypoints.xy):
                kp = person_kp.tolist()

                # Safety Check: ensure the model actually returned enough keypoints
                if len(kp) <= 16:
                    continue

                person_id  = f"person_{kp_idx}"

                head       = kp[0]
                left_hand  = kp[9]
                right_hand = kp[10]
                left_foot  = kp[15]
                right_foot = kp[16]

                helmet_ok, helmet_conf = check_near(head, helmets)

                glove_left_ok,  glove_left_conf  = check_near(left_hand,  gloves)
                glove_right_ok, glove_right_conf = check_near(right_hand, gloves)
                glove_ok   = glove_left_ok or glove_right_ok
                glove_conf = max(glove_left_conf, glove_right_conf)

                boot_left_ok,  boot_left_conf  = check_near(left_foot,  boots)
                boot_right_ok, boot_right_conf = check_near(right_foot, boots)
                boot_ok   = boot_left_ok or boot_right_ok
                boot_conf = max(boot_left_conf, boot_right_conf)

                vest_ok, vest_conf = False, 0.0
                for (x1, y1, x2, y2, conf) in vests:
                    cy = int((y1 + y2) / 2)
                    if 100 < cy < frame.shape[0]:
                        vest_ok   = True
                        vest_conf = max(vest_conf, conf)

                # --- NEW CODE ADDED HERE ---
                # Check restricted zone breach via hip keypoint (kp[11] is left hip)
                hip_x = kp[11][0] / frame_w  
                hip_y = kp[11][1] / frame_h
                in_restricted = is_in_any_zone([hip_x, hip_y], api.restricted_zones)
                # ----------------------------

                violation_types = []
                violation_confs = []

                if not helmet_ok:
                    violation_types.append("no_helmet")
                else:
                    violation_confs.append(helmet_conf)

                if not vest_ok:
                    violation_types.append("no_vest")
                else:
                    violation_confs.append(vest_conf)

                if not glove_ok:
                    violation_types.append("no_gloves")
                else:
                    violation_confs.append(glove_conf)

                if not boot_ok:
                    violation_types.append("no_boots")
                else:
                    violation_confs.append(boot_conf)

                # --- NEW CODE ADDED HERE ---
                if in_restricted:
                    violation_types.append("restricted_zone_breach")
                # ----------------------------

                avg_conf = round(sum(violation_confs) / len(violation_confs), 2) if violation_confs else 0.0

                should_alert = update_validator(person_id, set(violation_types))

                if should_alert:
                    event = {
                        "zone": ZONE,
                        "timestamp": timestamp,
                        "type": violation_types,
                        "confidence": avg_conf
                    }
                    alert = generate_alert(event)
                    log_event(alert)

                # append this person's data for the /keypoints endpoint
                frame_keypoints.append({
                    "id": person_id,
                    "keypoints": kp,           # [[x, y], ...] 17 points in pixel coords
                    "violations": violation_types,
                    "zone": ZONE,
                    "frame_width": frame_w,    # so frontend can normalize correctly
                    "frame_height": frame_h,
                })

                status_map = [
                    ("Helmet" if helmet_ok else "No Helmet", helmet_ok),
                    ("Vest" if vest_ok else "No Vest", vest_ok),
                    ("Gloves" if glove_ok else "No Gloves", glove_ok),
                    ("Boots" if boot_ok else "No Boots", boot_ok),
                    ("Safe Zone" if not in_restricted else "RESTRICTED!", not in_restricted) # Optional UI Feedback
                ]

                y_offset = 30 + (kp_idx * 150) # Adjusted offset slightly for the 5th line
                for text, ok in status_map:
                    color = (0,255,0) if ok else (0,0,255)
                    cv2.putText(annotated, text, (20, y_offset),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
                    y_offset += 30

        # Update globals atomically at end of frame
        global latest_frame, latest_keypoints
        latest_frame     = annotated.copy()
        latest_keypoints = frame_keypoints  

    cap.release()