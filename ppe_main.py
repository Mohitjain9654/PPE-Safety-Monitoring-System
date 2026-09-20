from datetime import datetime
from collections import deque
import cv2
import os
import threading

from ultralytics import YOLO
from ppe_nlp import generate_alert
from event_log import init_db, log_event

from shapely.geometry import Point, Polygon


# =========================================================
# CONFIGURATION
# =========================================================

BASE_DIR = "/Users/mohitjain965405gmail.com/Sync/Projects/Final_Year/ppe"

ZONE = "Zone A"

FRAME_BUFFER_SIZE = 10


# =========================================================
# MODELS
# =========================================================

pose_model = YOLO(
    os.path.join(
        BASE_DIR,
        "yolo26s-pose.pt"
    )
)

ppe_model = YOLO(
    os.path.join(
        BASE_DIR,
        "ppe_yolo.pt"
    )
)


# =========================================================
# DATABASE
# =========================================================

init_db()


# =========================================================
# MULTI-CAMERA STATE
# =========================================================

# Each camera gets its own latest frame
camera_frames = {}

# Each camera gets its own keypoints
camera_keypoints = {}

# Each camera gets its own stop event
camera_stop_events = {}

# Each camera gets its own detection thread
camera_threads = {}

# Camera status
camera_status = {}


# =========================================================
# BACKWARD COMPATIBILITY
# =========================================================

# Existing /video_feed endpoint currently uses these.
# We keep them so old dashboard functionality does not
# immediately break.

latest_frame = None
latest_keypoints = []


# =========================================================
# VALIDATION STATE
# =========================================================

# Structure:
#
# frame_buffers[camera_id][person_id]
#
# confirmed_states[camera_id][person_id]

frame_buffers = {}
confirmed_states = {}


# =========================================================
# LOCK
# =========================================================

state_lock = threading.Lock()


# =========================================================
# RESTRICTED ZONE CHECK
# =========================================================

def get_restricted_zones():
    """
    Get restricted zones from api.py.

    Imported inside the function intentionally to avoid
    circular import problems between api.py and ppe_main.py.
    """

    try:
        import api

        return api.restricted_zones

    except Exception:
        return []


def is_in_any_zone(kp_normalized, zones):
    """
    kp_normalized = [x, y]
    where x and y are normalized between 0 and 1.

    zones = list of polygon points.
    """

    try:
        pt = Point(kp_normalized)

        for zone_pts in zones:

            if len(zone_pts) >= 3:

                poly = Polygon(zone_pts)

                if poly.contains(pt):
                    return True

    except Exception as error:

        print(
            f"⚠️ Zone check error: {error}"
        )

    return False


# =========================================================
# VIOLATION VALIDATOR
# =========================================================

def update_validator(
    camera_id,
    person_id,
    current_violations: set
):
    """
    Confirms a violation only when the same state is
    consistently detected across FRAME_BUFFER_SIZE frames.

    Validation is now camera-specific.
    """

    if camera_id not in frame_buffers:

        frame_buffers[camera_id] = {}

    if camera_id not in confirmed_states:

        confirmed_states[camera_id] = {}


    if person_id not in frame_buffers[camera_id]:

        frame_buffers[camera_id][person_id] = deque(
            maxlen=FRAME_BUFFER_SIZE
        )

        confirmed_states[camera_id][person_id] = None


    buffer = frame_buffers[camera_id][person_id]

    buffer.append(
        frozenset(current_violations)
    )


    # Need enough frames before confirming
    if len(buffer) < FRAME_BUFFER_SIZE:
        return False


    # All states must be identical
    if len(set(buffer)) != 1:
        return False


    consistent_state = current_violations


    if (
        consistent_state
        != confirmed_states[camera_id][person_id]
    ):

        confirmed_states[camera_id][person_id] = (
            consistent_state
        )

        return True


    return False


# =========================================================
# PPE OBJECT CHECK
# =========================================================

def check_near(point, objects):

    px, py = int(point[0]), int(point[1])

    for (
        x1,
        y1,
        x2,
        y2,
        conf
    ) in objects:

        if (
            x1 < px < x2
            and
            y1 < py < y2
        ):

            return True, conf

    return False, 0.0


# =========================================================
# CAMERA INITIALIZATION
# =========================================================

def initialize_camera(camera_id):

    with state_lock:

        camera_frames[camera_id] = None

        camera_keypoints[camera_id] = []

        camera_stop_events[camera_id] = (
            threading.Event()
        )

        camera_status[camera_id] = "starting"


        frame_buffers[camera_id] = {}

        confirmed_states[camera_id] = {}


# =========================================================
# CAMERA CLEANUP
# =========================================================

def cleanup_camera(camera_id):

    with state_lock:

        camera_frames.pop(
            camera_id,
            None
        )

        camera_keypoints.pop(
            camera_id,
            None
        )

        camera_stop_events.pop(
            camera_id,
            None
        )

        camera_threads.pop(
            camera_id,
            None
        )

        camera_status.pop(
            camera_id,
            None
        )

        frame_buffers.pop(
            camera_id,
            None
        )

        confirmed_states.pop(
            camera_id,
            None
        )


# =========================================================
# GET CAMERA FRAME
# =========================================================

def get_camera_frame(camera_id):

    with state_lock:

        return camera_frames.get(
            camera_id
        )


# =========================================================
# GET CAMERA KEYPOINTS
# =========================================================

def get_camera_keypoints(camera_id):

    with state_lock:

        return camera_keypoints.get(
            camera_id,
            []
        )


# =========================================================
# GET CAMERA STATUS
# =========================================================

def get_camera_status(camera_id):

    with state_lock:

        return camera_status.get(
            camera_id,
            "offline"
        )


# =========================================================
# START CAMERA DETECTION
# =========================================================

def start_camera_detection(
    camera_id,
    source
):

    # Already running?
    existing_thread = camera_threads.get(
        camera_id
    )

    if (
        existing_thread
        and existing_thread.is_alive()
    ):

        return {
            "status": "already_running",
            "camera_id": camera_id
        }


    initialize_camera(camera_id)


    thread = threading.Thread(
        target=run_detection,
        args=(source, camera_id),
        daemon=True
    )


    with state_lock:

        camera_threads[camera_id] = thread


    thread.start()


    return {
        "status": "started",
        "camera_id": camera_id
    }


# =========================================================
# STOP CAMERA DETECTION
# =========================================================

def stop_camera_detection(camera_id):

    stop_event = camera_stop_events.get(
        camera_id
    )


    if stop_event is None:

        return {
            "status": "not_running",
            "camera_id": camera_id
        }


    stop_event.set()


    return {
        "status": "stopping",
        "camera_id": camera_id
    }


# =========================================================
# MAIN DETECTION
# =========================================================

def run_detection(
    source,
    camera_id="default"
):

    print(
        f"🎥 Starting detection | "
        f"Camera: {camera_id} | "
        f"Source: {source}"
    )


    # -----------------------------------------------------
    # SOURCE PATH
    # -----------------------------------------------------

    if not os.path.isabs(source):

        source = os.path.join(
            BASE_DIR,
            source
        )


    # -----------------------------------------------------
    # OPEN CAMERA / VIDEO
    # -----------------------------------------------------

    cap = cv2.VideoCapture(source)


    if not cap.isOpened():

        print(
            f"❌ Cannot open camera: "
            f"{camera_id} | {source}"
        )

        with state_lock:

            camera_status[camera_id] = "offline"

        cleanup_camera(camera_id)

        return


    # -----------------------------------------------------
    # INITIALIZE STATE
    # -----------------------------------------------------

    if camera_id not in camera_stop_events:

        initialize_camera(camera_id)


    stop_event = camera_stop_events[
        camera_id
    ]


    with state_lock:

        camera_status[camera_id] = "online"


    frame_count = 0


    # =====================================================
    # DETECTION LOOP
    # =====================================================

    while not stop_event.is_set():

        ret, frame = cap.read()


        # -------------------------------------------------
        # VIDEO ENDED / CAMERA DISCONNECTED
        # -------------------------------------------------

        if not ret:

            print(
                f"⚠️ Camera stream ended: "
                f"{camera_id}"
            )

            break


        frame_count += 1


        # Process every 5th frame
        if frame_count % 5 != 0:
            continue


        # -------------------------------------------------
        # FRAME INFORMATION
        # -------------------------------------------------

        frame_h, frame_w = frame.shape[:2]

        timestamp = datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        )


        # =================================================
        # YOLO POSE
        # =================================================

        pose_results = pose_model(
            frame,
            conf=0.4
        )


        # =================================================
        # YOLO PPE
        # =================================================

        ppe_results = ppe_model(
            frame,
            conf=0.4
        )


        # =================================================
        # ANNOTATED FRAME
        # =================================================

        annotated = pose_results[0].plot()


        # =================================================
        # PPE OBJECT COLLECTIONS
        # =================================================

        helmets = []
        vests = []
        gloves = []
        boots = []


        # -------------------------------------------------
        # READ PPE DETECTIONS
        # -------------------------------------------------

        for box in ppe_results[0].boxes:

            cls = int(
                box.cls[0]
            )

            label = ppe_model.names[cls]

            conf = float(
                box.conf[0]
            )

            x1, y1, x2, y2 = map(
                int,
                box.xyxy[0]
            )


            if label == "helmet":

                helmets.append(
                    (
                        x1,
                        y1,
                        x2,
                        y2,
                        conf
                    )
                )


            elif label == "vest":

                vests.append(
                    (
                        x1,
                        y1,
                        x2,
                        y2,
                        conf
                    )
                )


            elif label == "gloves":

                gloves.append(
                    (
                        x1,
                        y1,
                        x2,
                        y2,
                        conf
                    )
                )


            elif label == "boots":

                boots.append(
                    (
                        x1,
                        y1,
                        x2,
                        y2,
                        conf
                    )
                )


        # =================================================
        # KEYPOINTS
        # =================================================

        frame_keypoints = []


        for r in pose_results:

            if r.keypoints is None:
                continue


            for kp_idx, person_kp in enumerate(
                r.keypoints.xy
            ):

                kp = person_kp.tolist()


                # -------------------------------------------------
                # SAFETY CHECK
                # -------------------------------------------------

                if len(kp) <= 16:
                    continue


                # -------------------------------------------------
                # PERSON ID
                # -------------------------------------------------

                person_id = (
                    f"person_{kp_idx}"
                )


                # -------------------------------------------------
                # BODY KEYPOINTS
                # -------------------------------------------------

                head = kp[0]

                left_hand = kp[9]

                right_hand = kp[10]

                left_foot = kp[15]

                right_foot = kp[16]


                # =================================================
                # HELMET
                # =================================================

                helmet_ok, helmet_conf = (
                    check_near(
                        head,
                        helmets
                    )
                )


                # =================================================
                # GLOVES
                # =================================================

                (
                    glove_left_ok,
                    glove_left_conf
                ) = check_near(
                    left_hand,
                    gloves
                )


                (
                    glove_right_ok,
                    glove_right_conf
                ) = check_near(
                    right_hand,
                    gloves
                )


                glove_ok = (
                    glove_left_ok
                    or
                    glove_right_ok
                )


                glove_conf = max(
                    glove_left_conf,
                    glove_right_conf
                )


                # =================================================
                # BOOTS
                # =================================================

                (
                    boot_left_ok,
                    boot_left_conf
                ) = check_near(
                    left_foot,
                    boots
                )


                (
                    boot_right_ok,
                    boot_right_conf
                ) = check_near(
                    right_foot,
                    boots
                )


                boot_ok = (
                    boot_left_ok
                    or
                    boot_right_ok
                )


                boot_conf = max(
                    boot_left_conf,
                    boot_right_conf
                )


                # =================================================
                # VEST
                # =================================================

                vest_ok = False

                vest_conf = 0.0


                for (
                    x1,
                    y1,
                    x2,
                    y2,
                    conf
                ) in vests:

                    cy = int(
                        (y1 + y2) / 2
                    )


                    if (
                        100
                        <
                        cy
                        <
                        frame.shape[0]
                    ):

                        vest_ok = True

                        vest_conf = max(
                            vest_conf,
                            conf
                        )


                # =================================================
                # RESTRICTED ZONE
                # =================================================

                hip_x = (
                    kp[11][0]
                    /
                    frame_w
                )


                hip_y = (
                    kp[11][1]
                    /
                    frame_h
                )


                restricted_zones = (
                    get_restricted_zones()
                )


                in_restricted = (
                    is_in_any_zone(
                        [
                            hip_x,
                            hip_y
                        ],
                        restricted_zones
                    )
                )


                # =================================================
                # VIOLATIONS
                # =================================================

                violation_types = []

                violation_confs = []


                # Helmet

                if not helmet_ok:

                    violation_types.append(
                        "no_helmet"
                    )

                else:

                    violation_confs.append(
                        helmet_conf
                    )


                # Vest

                if not vest_ok:

                    violation_types.append(
                        "no_vest"
                    )

                else:

                    violation_confs.append(
                        vest_conf
                    )


                # Gloves

                if not glove_ok:

                    violation_types.append(
                        "no_gloves"
                    )

                else:

                    violation_confs.append(
                        glove_conf
                    )


                # Boots

                if not boot_ok:

                    violation_types.append(
                        "no_boots"
                    )

                else:

                    violation_confs.append(
                        boot_conf
                    )


                # Restricted zone

                if in_restricted:

                    violation_types.append(
                        "restricted_zone_breach"
                    )


                # =================================================
                # CONFIDENCE
                # =================================================

                if violation_confs:

                    avg_conf = round(
                        sum(violation_confs)
                        /
                        len(violation_confs),
                        2
                    )

                else:

                    avg_conf = 0.0


                # =================================================
                # VALIDATE VIOLATION
                # =================================================

                should_alert = (
                    update_validator(
                        camera_id,
                        person_id,
                        set(violation_types)
                    )
                )


                # =================================================
                # CREATE ALERT
                # =================================================

                if should_alert:

                    event = {

                        "zone": ZONE,

                        "timestamp": timestamp,

                        "type": violation_types,

                        "confidence": avg_conf,

                    }


                    try:

                        alert = generate_alert(
                            event
                        )


                        # Keep camera information
                        # available for the next
                        # database/API integration.

                        alert["camera_id"] = (
                            camera_id
                        )


                        log_event(alert)


                    except Exception as error:

                        print(
                            "⚠️ Alert generation error:",
                            error
                        )


                # =================================================
                # KEYPOINT DATA
                # =================================================

                frame_keypoints.append({

                    "id": person_id,

                    "keypoints": kp,

                    "violations":
                        violation_types,

                    "zone": ZONE,

                    "camera_id":
                        camera_id,

                    "frame_width":
                        frame_w,

                    "frame_height":
                        frame_h,

                })


                # =================================================
                # STATUS MAP
                # =================================================

                status_map = [

                    (
                        "Helmet"
                        if helmet_ok
                        else
                        "No Helmet",
                        helmet_ok
                    ),

                    (
                        "Vest"
                        if vest_ok
                        else
                        "No Vest",
                        vest_ok
                    ),

                    (
                        "Gloves"
                        if glove_ok
                        else
                        "No Gloves",
                        glove_ok
                    ),

                    (
                        "Boots"
                        if boot_ok
                        else
                        "No Boots",
                        boot_ok
                    ),

                    (
                        "Safe Zone"
                        if not in_restricted
                        else
                        "RESTRICTED!",
                        not in_restricted
                    ),

                ]


                # =================================================
                # DRAW STATUS ON FRAME
                # =================================================

                y_offset = (
                    30
                    +
                    (kp_idx * 150)
                )


                for text, ok in status_map:

                    color = (
                        (0, 255, 0)
                        if ok
                        else
                        (0, 0, 255)
                    )


                    cv2.putText(

                        annotated,

                        text,

                        (
                            20,
                            y_offset
                        ),

                        cv2.FONT_HERSHEY_SIMPLEX,

                        0.7,

                        color,

                        2

                    )


                    y_offset += 30


        # =================================================
        # UPDATE CAMERA STATE
        # =================================================

        with state_lock:

            camera_frames[
                camera_id
            ] = annotated.copy()


            camera_keypoints[
                camera_id
            ] = frame_keypoints


            camera_status[
                camera_id
            ] = "online"


            # -------------------------------------------------
            # BACKWARD COMPATIBILITY
            # -------------------------------------------------

            global latest_frame
            global latest_keypoints

            latest_frame = (
                annotated.copy()
            )

            latest_keypoints = (
                frame_keypoints
            )


    # =====================================================
    # RELEASE CAMERA
    # =====================================================

    cap.release()


    # =====================================================
    # CAMERA STOPPED
    # =====================================================

    with state_lock:

        if camera_id in camera_status:

            camera_status[
                camera_id
            ] = "offline"


    print(
        f"🛑 Camera stopped: {camera_id}"
    )


# =========================================================
# END OF FILE
# =========================================================

# from datetime import datetime
# from collections import deque
# import cv2
# import os
# from ultralytics import YOLO
# from ppe_nlp import generate_alert
# from event_log import init_db, log_event
# import api 
# from shapely.geometry import Point, Polygon  # <-- Added for polygon zone checks

# ZONE = "Zone A"
# FRAME_BUFFER_SIZE = 10

# pose_model = YOLO('/Users/mohitjain965405gmail.com/Sync/Projects/Final_Year/ppe/yolo26s-pose.pt')
# ppe_model  = YOLO('/Users/mohitjain965405gmail.com/Sync/Projects/Final_Year/ppe/ppe_yolo.pt')

# frame_buffers    = {}
# confirmed_states = {}

# # Global frames for streaming
# latest_frame     = None
# latest_keypoints = []  # list of persons with keypoints + violations


# def is_in_any_zone(kp_normalized, zones):
#     """kp = [x,y] normalized (0-1), zones = list of polygons"""
#     pt = Point(kp_normalized)
#     for zone_pts in zones:
#         if len(zone_pts) >= 3:
#             poly = Polygon(zone_pts)
#             if poly.contains(pt):
#                 return True
#     return False


# def update_validator(person_id, current_violations: set) -> bool:
#     if person_id not in frame_buffers:
#         frame_buffers[person_id]    = deque(maxlen=FRAME_BUFFER_SIZE)
#         confirmed_states[person_id] = None

#     buffer = frame_buffers[person_id]
#     buffer.append(frozenset(current_violations))

#     if len(buffer) < FRAME_BUFFER_SIZE:
#         return False

#     if len(set(buffer)) != 1:
#         return False

#     consistent_state = current_violations

#     if consistent_state != confirmed_states[person_id]:
#         confirmed_states[person_id] = consistent_state
#         return True

#     return False


# def check_near(point, objects):
#     px, py = int(point[0]), int(point[1])
#     for (x1, y1, x2, y2, conf) in objects:
#         if x1 < px < x2 and y1 < py < y2:
#             return True, conf
#     return False, 0.0


# def run_detection(source):

#     if not os.path.isabs(source):
#         source = os.path.join("/Users/mohitjain965405gmail.com/Sync/Projects/Final_Year/ppe", source)

#     cap = cv2.VideoCapture(source)

#     if not cap.isOpened():
#         print("❌ Cannot open:", source)
#         return

#     init_db()

#     frame_count = 0

#     while True:
#         ret, frame = cap.read()
#         if not ret:
#             break

#         frame_count += 1

#         if frame_count % 5 != 0:
#             continue

#         frame_h, frame_w = frame.shape[:2]  # get actual frame dimensions
#         timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

#         pose_results = pose_model(frame, conf=0.4)
#         ppe_results  = ppe_model(frame, conf=0.4)

#         annotated = pose_results[0].plot()

#         helmets, vests, gloves, boots = [], [], [], []

#         for box in ppe_results[0].boxes:
#             cls   = int(box.cls[0])
#             label = ppe_model.names[cls]
#             conf  = float(box.conf[0])
#             x1, y1, x2, y2 = map(int, box.xyxy[0])

#             if label == "helmet":
#                 helmets.append((x1, y1, x2, y2, conf))
#             elif label == "vest":
#                 vests.append((x1, y1, x2, y2, conf))
#             elif label == "gloves":
#                 gloves.append((x1, y1, x2, y2, conf))
#             elif label == "boots":
#                 boots.append((x1, y1, x2, y2, conf))

#         # build keypoints list fresh every processed frame
#         frame_keypoints = []

#         for r in pose_results:
#             if r.keypoints is None:
#                 continue

#             for kp_idx, person_kp in enumerate(r.keypoints.xy):
#                 kp = person_kp.tolist()

#                 # Safety Check: ensure the model actually returned enough keypoints
#                 if len(kp) <= 16:
#                     continue

#                 person_id  = f"person_{kp_idx}"

#                 head       = kp[0]
#                 left_hand  = kp[9]
#                 right_hand = kp[10]
#                 left_foot  = kp[15]
#                 right_foot = kp[16]

#                 helmet_ok, helmet_conf = check_near(head, helmets)

#                 glove_left_ok,  glove_left_conf  = check_near(left_hand,  gloves)
#                 glove_right_ok, glove_right_conf = check_near(right_hand, gloves)
#                 glove_ok   = glove_left_ok or glove_right_ok
#                 glove_conf = max(glove_left_conf, glove_right_conf)

#                 boot_left_ok,  boot_left_conf  = check_near(left_foot,  boots)
#                 boot_right_ok, boot_right_conf = check_near(right_foot, boots)
#                 boot_ok   = boot_left_ok or boot_right_ok
#                 boot_conf = max(boot_left_conf, boot_right_conf)

#                 vest_ok, vest_conf = False, 0.0
#                 for (x1, y1, x2, y2, conf) in vests:
#                     cy = int((y1 + y2) / 2)
#                     if 100 < cy < frame.shape[0]:
#                         vest_ok   = True
#                         vest_conf = max(vest_conf, conf)

#                 # --- NEW CODE ADDED HERE ---
#                 # Check restricted zone breach via hip keypoint (kp[11] is left hip)
#                 hip_x = kp[11][0] / frame_w  
#                 hip_y = kp[11][1] / frame_h
#                 in_restricted = is_in_any_zone([hip_x, hip_y], api.restricted_zones)
#                 # ----------------------------

#                 violation_types = []
#                 violation_confs = []

#                 if not helmet_ok:
#                     violation_types.append("no_helmet")
#                 else:
#                     violation_confs.append(helmet_conf)

#                 if not vest_ok:
#                     violation_types.append("no_vest")
#                 else:
#                     violation_confs.append(vest_conf)

#                 if not glove_ok:
#                     violation_types.append("no_gloves")
#                 else:
#                     violation_confs.append(glove_conf)

#                 if not boot_ok:
#                     violation_types.append("no_boots")
#                 else:
#                     violation_confs.append(boot_conf)

#                 # --- NEW CODE ADDED HERE ---
#                 if in_restricted:
#                     violation_types.append("restricted_zone_breach")
#                 # ----------------------------

#                 avg_conf = round(sum(violation_confs) / len(violation_confs), 2) if violation_confs else 0.0

#                 should_alert = update_validator(person_id, set(violation_types))

#                 if should_alert:
#                     event = {
#                         "zone": ZONE,
#                         "timestamp": timestamp,
#                         "type": violation_types,
#                         "confidence": avg_conf
#                     }
#                     alert = generate_alert(event)
#                     log_event(alert)

#                 # append this person's data for the /keypoints endpoint
#                 frame_keypoints.append({
#                     "id": person_id,
#                     "keypoints": kp,           # [[x, y], ...] 17 points in pixel coords
#                     "violations": violation_types,
#                     "zone": ZONE,
#                     "frame_width": frame_w,    # so frontend can normalize correctly
#                     "frame_height": frame_h,
#                 })

#                 status_map = [
#                     ("Helmet" if helmet_ok else "No Helmet", helmet_ok),
#                     ("Vest" if vest_ok else "No Vest", vest_ok),
#                     ("Gloves" if glove_ok else "No Gloves", glove_ok),
#                     ("Boots" if boot_ok else "No Boots", boot_ok),
#                     ("Safe Zone" if not in_restricted else "RESTRICTED!", not in_restricted) # Optional UI Feedback
#                 ]

#                 y_offset = 30 + (kp_idx * 150) # Adjusted offset slightly for the 5th line
#                 for text, ok in status_map:
#                     color = (0,255,0) if ok else (0,0,255)
#                     cv2.putText(annotated, text, (20, y_offset),
#                                 cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
#                     y_offset += 30

#         # Update globals atomically at end of frame
#         global latest_frame, latest_keypoints
#         latest_frame     = annotated.copy()
#         latest_keypoints = frame_keypoints  

#     cap.release()