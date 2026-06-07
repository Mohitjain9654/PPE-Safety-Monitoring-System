# 🦺 PPE Safety Monitoring System

🚧 **Work In Progress – Final Year Project**

An AI-powered workplace safety monitoring system that automatically detects Personal Protective Equipment (PPE) compliance, monitors worker activities, identifies safety violations, and visualizes worker movement in a 3D spatial environment.

---

## 📌 Overview

Industrial workplaces require strict adherence to safety protocols. Manual monitoring is often inefficient, time-consuming, and prone to human error.

This project leverages **Computer Vision**, **Pose Estimation**, **Real-Time Analytics**, and **3D Spatial Monitoring** to automatically monitor workers and identify safety violations.

The system is designed to:

* Detect PPE compliance in real-time
* Monitor worker pose using human keypoints
* Generate safety alerts
* Log violations into a database
* Display analytics dashboards
* Visualize workers in a 3D environment
* Monitor restricted zones and worker movement

---

## 🚀 Features

### PPE Detection

* Helmet Detection
* Safety Vest Detection
* Gloves Detection
* Safety Boots Detection

### Human Pose Estimation

* 17-Keypoint Human Skeleton Tracking
* Real-Time Worker Monitoring
* Pose-Based Worker Visualization

### Violation Detection

* Missing Helmet
* Missing Vest
* Missing Gloves
* Missing Boots
* Restricted Zone Breach

### Analytics Dashboard

* Violation Statistics
* Event Logs
* Recent Alerts
* Live Monitoring Dashboard

### 3D Spatial Monitoring

* Worker Skeleton Visualization
* Factory Floor Representation
* Restricted Zone Visualization
* Interactive Camera Controls

### Event Management

* Automated Violation Logging
* Alert Generation
* Historical Event Tracking

---

## 🚧 Current Development Status

### ✅ Completed

* PPE Detection Module
* Human Pose Estimation
* Event Logging System
* Alert Generation
* Analytics Dashboard
* Live Monitoring Dashboard
* 3D Spatial Visualization
* Restricted Zone Detection

### 🔄 Currently Under Development

* Dynamic Restricted Zone Creation
* Gate Definition System
* Room-Based Access Control
* Advanced 3D Factory Layout
* Worker Tracking Improvements
* Multi-Zone Monitoring

---

## 🏗 System Architecture

```text
Video Feed
     │
     ▼
YOLO Pose Estimation
     │
     ▼
YOLO PPE Detection
     │
     ▼
Violation Detection Engine
     │
     ├── Event Logging
     ├── Alert Generation
     ├── Analytics Dashboard
     └── 3D Spatial Visualization
```

---

## 🛠 Tech Stack

### Backend

* Python
* FastAPI
* SQLite
* OpenCV
* Shapely

### AI Models

* YOLO Pose Estimation
* YOLO PPE Detection

### Frontend

* React.js
* Vite
* Tailwind CSS
* Three.js
* React Three Fiber

---

## 📷 Screenshots

### Dashboard

![Dashboard Screenshot](screenshots/dashboard.png)

---

### Event Logs

![Event Logs Screenshot](screenshots/event_logs.png)

---

### PPE Detection

🚧 **Under Development**

Screenshots will be added in future updates.

Please check back later.

---

### Analytics Dashboard

🚧 **Under Development**

Screenshots will be added in future updates.

Please check back later.

---

### 3D Spatial Monitoring

🚧 **Under Development**

Screenshots will be added in future updates.

Please check back later.

---

### Restricted Zone Monitoring

🚧 **Under Development**

Screenshots will be added in future updates.

Please check back later.

---

## 📂 Project Structure

```text
PPE-Safety-Monitoring-System
│
├── api.py
├── ppe_main.py
├── ppe_nlp.py
├── event_log.py
│
├── safety-dashboard
│   ├── src
│   │   ├── components
│   │   ├── data
│   │   └── assets
│   │
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## ⚙ Installation

### Clone Repository

```bash
git clone https://github.com/Mohitjain9654/PPE-Safety-Monitoring-System.git

cd PPE-Safety-Monitoring-System
```

### Backend Setup

```bash
pip install -r requirements.txt

python api.py
```

### Frontend Setup

```bash
cd safety-dashboard

npm install

npm run dev
```

---

## 🎯 Future Enhancements

* Multi-Camera Monitoring
* Worker Identification & Tracking
* Depth Estimation
* Digital Twin Integration
* Industrial IoT Integration
* Mobile Notifications
* Advanced Restricted-Zone Management
* Real-Time Factory Mapping

---

## 👨‍💻 Project Team

* **Mohit Jain**
* **Siddhi Vats**
* **Raunak Pratap Singh**

Final Year Project

Computer Science Engineering

---

## ⭐ Support

If you find this project useful, consider giving it a star on GitHub.

