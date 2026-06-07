import sqlite3
import json
from datetime import datetime

DB_PATH = "ppe_events.db"

def init_db():
    """Create table if it doesn't exist — call once at startup"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS events (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp   TEXT NOT NULL,
            zone        TEXT NOT NULL,
            severity    TEXT NOT NULL,
            violations  TEXT NOT NULL,   -- stored as JSON string
            confidence  REAL NOT NULL,
            message     TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

def log_event(alert: dict):
    """
    Takes the dict returned by generate_alert() and saves it to DB.
    Also prints to console so you can still see it.
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO events (timestamp, zone, severity, violations, confidence, message)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        alert["timestamp"],
        alert["zone"],
        alert["severity"],
        json.dumps(alert["violations"]),   # list → JSON string
        alert["confidence"],
        alert["message"]
    ))
    conn.commit()
    conn.close()

    # Console print (will be replaced by dashboard push later)
    print(f"[{alert['severity'].upper()}] {alert['message']} | Confidence: {alert['confidence']}")


def get_recent_events(limit: int = 50) -> list:
    """
    Fetch last N events — dashboard will call this later
    Returns list of dicts
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row   # so we get dict-like rows
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM events
        ORDER BY id DESC
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()

    result = []
    for row in rows:
        result.append({
            "id":         row["id"],
            "timestamp":  row["timestamp"],
            "zone":       row["zone"],
            "severity":   row["severity"],
            "violations": json.loads(row["violations"]),  # JSON string → list
            "confidence": row["confidence"],
            "message":    row["message"]
        })
    return result


def get_violation_stats() -> dict:
    """
    Returns violation frequency per type — Analytics will use this later
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT severity, COUNT(*) as count
        FROM events
        GROUP BY severity
    """)
    rows = cursor.fetchall()
    conn.close()

    return {row[0]: row[1] for row in rows}