# IntegriSight - Real-Time Exam Proctoring System

IntegriSight is a comprehensive, real-time exam proctoring system designed to ensure the integrity of online assessments. It utilizes modern web technologies and a dedicated AI engine for continuous monitoring of students during an exam.

## 📌 Project Overview (How it works)

The system is composed of two main parts: a **React Frontend** for the user interface and a **Python/Flask Backend (AI Engine)** for real-time video analysis.

1. **User Roles**: The application supports two primary roles: **Proctor** and **Student**.
2. **Proctor Dashboard**: Proctors can log in to create new tests. They can utilize the integrated "AI Question Generator" (powered by Open-Source LLMs) to quickly generate MCQs. Proctors can also monitor active test sessions in real-time.
3. **Student Dashboard & Test Session**: Students log in, view their assigned tests, and begin taking them. During the test, the interface captures frames from the student's webcam at regular intervals.
4. **Real-Time AI Proctoring**: 
   - Captured frames are encoded in base64 and sent to the AI Engine API (`/analyze`).
   - The AI Engine processes these frames using OpenCV and Google's MediaPipe Face Mesh.
   - It calculates facial landmarks to detect head pitch (up/down) and yaw (left/right).
   - The system flags violations natively, such as:
     - **Face not visible**: If no face is detected.
     - **Multiple faces**: If more than one face is detected in the frame.
     - **Gaze away**: If the head pose exceeds typical thresholds (looking left/right/up/down).
5. **Real-Time Violation Reporting**: Violations are instantly sent back to the frontend, which updates a dynamic "Risk Score". Proctors can view this data in the `ProctorTestMonitor` to ensure exam integrity.

---

## 🛠️ Libraries & Technologies Used

### Frontend (React + Vite)
- **`react` & `react-dom`**: The core UI library for building dynamic user interfaces.
- **`react-router-dom`**: Manages navigation routing between pages (e.g., Dashboards, Test View).
- **`lucide-react`**: Provides crisp, customizable SVG icons used throughout the app.
- **`recharts`**: A composable charting library used for data visualization in the Proctor Dashboard.
- **`vite`**: A fast build tool and development server.
- **`eslint`**: Enforces code formatting and best practices.
- **CSS**: Pure vanilla CSS styled mostly via `App.css` and `index.css`.

### Backend AI Engine (Python)
- **`Flask`**: A lightweight WSGI web application framework used to host the `/analyze` API.
- **`flask-cors`**: Provides Cross-Origin Resource Sharing logic, allowing the React frontend to communicate with the Flask API seamlessly.
- **`opencv-python` (`cv2`)**: A prominent computer vision library used to decode and process base64 image frames.
- **`mediapipe` (v0.10.14)**: Google's ML framework used specifically for `FaceMesh`, enabling high-precision facial landmark detection for proctoring logic.
- **`numpy`**: A core library for numerical operations, extensively used alongside OpenCV for image array manipulation.

---

## 📂 Folder Structure & File Functions

```
.
├── ai_engine/                    # 🧠 Backend Python application for AI frame analysis
│   ├── app.py                    # Main Flask application. Defines the `/health` and `/analyze` endpoints.
│   ├── detector.py               # Core AI logic file. Uses MediaPipe to extract facial landmarks and calculate gaze/pose violations.
│   └── requirements.txt          # Contains all Python dependencies required by the backend.
│
├── frontend/                     # 💻 React Frontend application
│   ├── package.json              # Defines NPM configuration, scripts, and dependencies.
│   └── src/                      # Source code directory for the frontend application.
│       ├── App.jsx               # The root React component. Defines app routes using `react-router-dom`.
│       ├── App.css               # Global styling.
│       ├── index.css             # Main stylesheet, setting up base styles and variables.
│       ├── main.jsx              # Application entry point binding the React app to the HTML DOM.
│       │
│       ├── components/           # Reusable UI components used across different pages.
│       │   ├── AIQuestionGenerator.jsx # Allows proctors to automatically generate test questions using AI.
│       │   ├── ConfirmModal.jsx        # A generic modal wrapper for confirmation actions.
│       │   ├── ManageStudentsModal.jsx # Interface for proctors to assign/manage students for a specific test.
│       │   ├── Navbar.jsx              # Top navigation bar containing links and logout functionality.
│       │   ├── ProtectedRoute.jsx      # Wrapper component enforcing authentication and role-based access to routes.
│       │   ├── QuestionCard.jsx        # Component to render an individual multiple-choice question during a test.
│       │   ├── RiskBar.jsx             # Visual indicator showing a student's current cheating risk score.
│       │   ├── StatCard.jsx            # Simple card component to display statistics in the dashboard.
│       │   ├── TestCard.jsx            # Card component summarizing test details (used in dashboards).
│       │   ├── Toast.jsx               # Notification pop-up component for alerts and success messages.
│       │   └── ViolationBadge.jsx      # Small UI badge rendering specific violation labels (e.g., "Looked Away").
│       │
│       ├── context/              # React Contexts for global state management.
│       │   └── ViolationContext.jsx    # Manages proctoring violation data and risk scores globally across components.
│       │
│       ├── data/                 # Mock and standard configuration datasets.
│       │   └── mockStore.js            # Initial mock state/database simulating backend data for users, tests, and active sessions.
│       │
│       ├── pages/                # Top-level Page components corresponding to specific routes.
│       │   ├── AboutPage.jsx           # An informational page describing the project, mission, and team members.
│       │   ├── CreateTest.jsx          # Dedicated page for Proctors to manually create or AI-generate a new exam.
│       │   ├── LoginPage.jsx           # The authentication entry page with role selection.
│       │   ├── ProctorDashboard.jsx    # Dashboard for proctors displaying overview statistics and test assignments.
│       │   ├── ProctorTestMonitor.jsx  # Live monitoring interface for proctors to observer students taking tests.
│       │   ├── StudentDashboard.jsx    # Dashboard for students displaying pending and completed tests.
│       │   ├── StudentResult.jsx       # Displays overall result overview for a student's completed tests.
│       │   ├── StudentView.jsx         # The strict, monitored test-taking interface where webcam capture actively runs.
│       │   └── TestResults.jsx         # Detailed metric display of a completed test (score, timeline, violations).
│       │
│       └── assets/               # Directory containing static files (e.g., images, SVGs).
└── README.md                     # This documentation file.
```

---

## 🚀 Setup & Installation

### 1. Start the AI Engine (Backend)

Navigate to the `ai_engine` folder, install the necessary Python dependencies, and run the server.

```bash
cd ai_engine
pip install -r requirements.txt
python app.py
```
> **Note**: The AI Engine runs locally on `http://localhost:5001`.

### 2. Start the Frontend

In a new terminal, navigate to the `frontend` folder, install the node modules, and start the Vite development server.

```bash
cd frontend
npm install
npm run dev
```
> **Note**: The frontend runs locally, typically on `http://localhost:5173`.

---

## 👤 Demo Credentials

You can test the application using the following mock credentials:

- **Student:** `student@exam.com` / `student123`
- **Proctor:** `proctor@exam.com` / `proctor123`
