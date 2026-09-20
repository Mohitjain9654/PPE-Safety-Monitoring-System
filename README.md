# 🦺 PPE Safety Monitoring System
### AI-Powered Industrial Safety Monitoring & 3D Factory Visualization

<p align="center">
  An AI-powered workplace safety monitoring platform that detects PPE compliance,
  monitors worker activity, identifies safety violations, and visualizes factory
  environments through an interactive 3D interface.
</p>

<p align="center">
  <img src="[https://img.shields.io/badge/Project-Final%20Year%20Project-blue](https://github.com/Mohitjain9654/PPE-Safety-Monitoring-System/blob/main/screenshot/Screenshot%202026-09-20%20at%2021.00.02.png)" />
  <img src="https://img.shields.io/badge/Python-FastAPI-green" />
  <img src="https://img.shields.io/badge/Frontend-React%20%7C%20Vite-blue" />
  <img src="https://img.shields.io/badge/AI-YOLO-orange" />
  <img src="https://img.shields.io/badge/3D-Three.js-black" />
  <img src="https://img.shields.io/badge/Status-Work%20In%20Progress-yellow" />
</p>

---

## 📌 Overview

Industrial workplaces require continuous monitoring to ensure worker safety
and compliance with Personal Protective Equipment (PPE) regulations.

Traditional safety monitoring often relies on manual inspections, which can
be time-consuming and difficult to scale across large industrial environments.

The **PPE Safety Monitoring System** is an AI-powered safety monitoring
platform designed to automate PPE compliance detection, identify safety
violations, maintain event records, and provide a centralized monitoring
dashboard.

The system combines computer vision, human pose estimation, real-time event
logging, analytics, and 3D spatial visualization to support workplace safety
monitoring.

This project is being developed as a **Final Year Project** for Computer
Science Engineering.

---

## 🚀 Key Features

### 1. AI-Based PPE Detection

The system uses a YOLO-based computer vision model to identify PPE compliance
in video streams.

Supported PPE categories include:

- Safety Helmet
- Safety Vest
- Safety Gloves
- Safety Boots

The detection module helps identify missing protective equipment and generate
safety violation events.

### 2. Human Pose Estimation

Human pose estimation is used to identify worker keypoints and support
worker-position visualization.

Features include:

- 17-keypoint human pose estimation
- Worker skeleton visualization
- Pose-based spatial positioning
- Worker movement visualization

### 3. Safety Violation Monitoring

The system is designed to identify and record safety violations such as:

- Missing Helmet
- Missing Safety Vest
- Missing Gloves
- Missing Safety Boots
- Restricted Zone Entry

Detected violations can be used to generate alerts and maintain historical
safety records.

### 4. Live Monitoring Dashboard

The React-based dashboard provides a centralized interface for workplace
safety monitoring.

Dashboard modules include:

- Live Video Monitoring
- PPE Detection Visualization
- Recent Safety Alerts
- Event Logs
- Violation Analytics
- Camera Management
- Settings
- Reports

### 5. Camera Management

The camera management module is designed to support camera configuration
and monitoring through the dashboard.

Features include:

- Camera management interface
- Camera monitoring interface
- Camera-based safety monitoring

### 6. 3D Factory Visualization

The system includes a Three.js-based 3D visualization module for representing
factory environments and worker positions.

The 3D module is designed to support:

- Factory floor visualization
- Factory layout generation
- Worker position visualization
- Worker skeleton representation
- Worker movement trails
- Gate and room representation
- Restricted zone visualization
- Spatial safety monitoring

### 7. Event Logging & Analytics

Safety-related events are stored using SQLite.

The event management system supports:

- Violation event logging
- Timestamp-based event records
- Zone and severity information
- Violation details
- Confidence information
- Historical event tracking

The analytics dashboard provides a foundation for analyzing safety events
and monitoring workplace safety trends.

---

## 🏗️ System Architecture

```text
                 ┌──────────────────────┐
                 │   Video / Camera     │
                 │       Input          │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │    OpenCV Video      │
                 │     Processing       │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │   YOLO Detection     │
                 │   & Pose Estimation │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │  Violation Detection │
                 │       Engine         │
                 └──────────┬───────────┘
                            │
             ┌──────────────┼────────────────┐
             │              │                │
             ▼              ▼                ▼
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
     │ Event Logging│ │ Alert System │ │ 3D Spatial   │
     │   SQLite     │ │              │ │ Visualization│
     └──────┬───────┘ └──────────────┘ └──────┬───────┘
            │                                 │
            └────────────────┬────────────────┘
                             ▼
                  ┌──────────────────────┐
                  │   FastAPI Backend    │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │   React Dashboard    │
                  │   Analytics & Logs   │
                  └──────────────────────┘
```

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Programming Languages | Python, JavaScript |
| Frontend | React.js, Vite |
| Styling | Tailwind CSS |
| 3D Visualization | Three.js, React Three Fiber |
| Backend | FastAPI |
| Database | SQLite |
| Computer Vision | OpenCV |
| AI / Deep Learning | YOLO, Human Pose Estimation |
| Geometry Processing | Shapely |
| Development Tools | Git, GitHub, VS Code |

---

## 📂 Project Structure

```text
PPE-Safety-Monitoring-System/
│
├── api.py
├── ppe_main.py
├── ppe_nlp.py
├── event_log.py
├── model_setup.ipynb
├── flow.txt
├── start.txt
├── requirements.txt
│
├── safety-dashboard/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── camera/
│   │   │   │   ├── CameraManager.jsx
│   │   │   │   └── CameraMonitoring.jsx
│   │   │   │
│   │   │   ├── reports/
│   │   │   │   └── Reports.jsx
│   │   │   │
│   │   │   ├── AddCamera.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── EventLog.jsx
│   │   │   ├── Settings.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── VideoPanel.jsx
│   │   │
│   │   ├── threeD/
│   │   │   ├── components/
│   │   │   ├── data/
│   │   │   ├── factory/
│   │   │   ├── gates/
│   │   │   ├── generator/
│   │   │   ├── hooks/
│   │   │   ├── monitoring/
│   │   │   ├── rooms/
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   ├── workers/
│   │   │   └── FactoryScene.jsx
│   │   │
│   │   ├── App.jsx
│   │   └── ...
│   │
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
├── README.md
└── .gitignore
```

> Note: This is a high-level project structure. Some modules and 3D assets
> are still under development.

---

## ⚙️ Installation & Setup

### Prerequisites

Make sure the following tools are installed:

- Python 3.10+
- Node.js and npm
- Git
- A compatible environment for running the required YOLO models

### 1. Clone the Repository

```bash
git clone https://github.com/Mohitjain9654/PPE-Safety-Monitoring-System.git

cd PPE-Safety-Monitoring-System
```

### 2. Backend Setup

Create and activate a Python virtual environment:

```bash
python -m venv venv
```

**macOS / Linux**

```bash
source venv/bin/activate
```

**Windows**

```bash
venv\Scripts\activate
```

Install the backend dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI backend:

```bash
python api.py
```

The backend is configured to run locally at:

```text
http://127.0.0.1:8001
```

### 3. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd safety-dashboard
```

Install the frontend dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

Open the local URL displayed in the terminal to access the dashboard.

### 4. AI Model Setup

The system uses YOLO-based models for PPE detection and human pose estimation.

The trained model weights are not included in this repository.

Before running the detection pipeline:

1. Obtain the required model weights.
2. Place them in the appropriate project directories.
3. Verify that the model paths in the backend configuration are correct.
4. Ensure all required Python dependencies are installed.

---

## 🔌 Backend API

The backend is built using FastAPI and provides endpoints for communication
between the AI pipeline and the frontend dashboard.

| Endpoint | Method | Description |
|---|---|---|
| `/video_feed` | GET | Streams the processed video feed |
| `/start-detection` | POST | Starts the detection process |

The API is hosted locally at:

```text
http://127.0.0.1:8001
```

> Additional endpoints may be available depending on the current backend
> implementation.

---

## 🗄️ Database & Event Logging

The project uses SQLite for storing safety-related events.

The event logging system maintains information such as:

- Event ID
- Timestamp
- Zone
- Severity
- Violations
- Confidence
- Alert Message

The database is used to support historical event tracking and safety
monitoring analytics.

---

## 📸 Screenshots & Demo

Screenshots and demonstrations will be added as the dashboard and
visualization modules continue to evolve.

### Dashboard

<!-- Add dashboard screenshot here -->

### PPE Detection

<!-- Add PPE detection screenshot here -->

### Event Logs

<!-- Add event logs screenshot here -->

### Analytics Dashboard

<!-- Add analytics screenshot here -->

### 3D Factory Visualization

<!-- Add 3D factory screenshot here -->

---

## 🚧 Development Status

This project is actively under development.

### Implemented Modules

- YOLO-based PPE detection pipeline
- Human pose estimation integration
- FastAPI backend
- SQLite event logging
- React-based monitoring dashboard
- Safety event and alert interface
- Analytics dashboard foundation
- Camera management interface
- Settings and reports interfaces
- Three.js-based 3D visualization structure

### In Progress

- Dynamic restricted zone management
- Advanced 3D factory layout generation
- Room and gate-based spatial monitoring
- Worker tracking improvements
- Real-time worker movement visualization
- Multi-camera monitoring improvements
- Analytics enhancements
- Integration and testing of 3D assets

---

## 🔮 Future Enhancements

The following features are planned for future development:

- Multi-camera safety monitoring
- Improved worker identification and tracking
- Advanced restricted-zone detection
- Enhanced 3D factory digital twin
- Depth estimation for spatial positioning
- Real-time worker movement analytics
- Industrial IoT integration
- Automated safety report generation
- Mobile-based safety notifications
- Improved model accuracy and performance

---

## 👨‍💻 Project Team

| Name | Role |
|---|---|
| Mohit Jain | Project Team Member |
| Siddhi Vats | Project Team Member |
| Raunak Pratap Singh | Project Team Member |

**Final Year Project**  
Bachelor of Technology – Computer Science Engineering

---

## 🎓 Academic Context

This project is developed as part of the Final Year Project for the
Computer Science Engineering program.

The objective is to explore the application of Artificial Intelligence,
Computer Vision, and 3D visualization in industrial workplace safety
monitoring.

---

## ⭐ Support

If you find this project interesting, consider giving the repository a star
on GitHub.

Contributions, suggestions, and feedback are welcome.

---

<p align="center">
  Developed with ❤️ by Team PPE Safety Monitoring System
</p>
