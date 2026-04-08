from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from supabase import create_client, Client
import os
import requests

# MediaPipe may not be available in all server environments
try:
    from detector import analyze_frame
    DETECTOR_AVAILABLE = True
except Exception as e:
    print(f'WARNING: Detector not available: {e}')
    DETECTOR_AVAILABLE = False
    def analyze_frame(frame):
        return {"face_count": 1, "gaze_away": False, "multiple_faces": False,
                "face_visible": True, "violations": [],
                "note": "Proctoring engine unavailable on this server"}

app = Flask(__name__)
CORS(app)

# Supabase client — credentials from env vars (set on Render.com)
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://qjvanmguvwlnhqtmpfgg.supabase.co')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdmFubWd1dndsbmhxdG1wZmdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MDg0NzYsImV4cCI6MjA5MDk4NDQ3Nn0.ek0BwJBTIxy39v2xn8WbBFa6gxr-5vJ9mW1d9HveMrI')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

OPENROUTER_KEY = os.environ.get('OPENROUTER_KEY', '')

INITIAL_DATA = {
    "students": [
        {"id": "s1", "name": "Rohit Singh", "email": "rohit@gmail.com", "password": "username123", "role": "student", "enrollmentNo": "2319451"},
        {"id": "s2", "name": "Anushka Dandriyal", "email": "anushka@gmail.com", "password": "username123", "role": "student", "enrollmentNo": "230112555"},
        {"id": "s3", "name": "Kartik", "email": "kartik@gmail.com", "password": "username123", "role": "student", "enrollmentNo": "230112556"},
        {"id": "s4", "name": "Karan Joshi", "email": "karan@gmail.com", "password": "username123", "role": "student", "enrollmentNo": "230198712"},
        {"id": "s5", "name": "Sneha Rawat", "email": "sneha@gmail.com", "password": "username123", "role": "student", "enrollmentNo": "230187634"}
    ],
    "proctors": [
        {"id": "p1", "name": "Dr. A. Kumar", "email": "proctor@gmail.com", "password": "proctor123", "role": "proctor", "subject": "Computer Science"},
        {"id": "p2", "name": "Prof. R. Singh", "email": "proctor2@gmail.com", "password": "proctor123", "role": "proctor", "subject": "Mathematics"}
    ],
    "tests": [],
    "sessions": [],
    "violations": []
}


# ─── Health ───────────────────────────────────────────────────────────────────
@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})


# ─── Proctoring AI ────────────────────────────────────────────────────────────
@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    if not data or 'frame' not in data:
        return jsonify({"error": "No frame provided"}), 400
    result = analyze_frame(data['frame'])
    return jsonify(result)


# ─── Database (Supabase Multi-Table Architecture) ────────────────────────────
def scrub_sensitive_data(data):
    if not data: return data
    clean = data.copy()
    if 'students' in clean:
        clean['students'] = [{k: v for k, v in s.items() if k != 'password'} for s in clean['students']]
    if 'proctors' in clean:
        clean['proctors'] = [{k: v for k, v in p.items() if k != 'password'} for p in clean['proctors']]
    return clean

# Mapping helpers because Postgres lowercases unquoted columns and uses snake_case, 
# but the Javascript frontend expects strict camelCase.
def to_pg_user(u):
    return {
        'id': u.get('id'), 'name': u.get('name'), 'email': u.get('email'),
        'password': u.get('password'), 'role': u.get('role'),
        'enrollmentno': u.get('enrollmentNo'), 'subject': u.get('subject')
    }

def from_pg_user(u):
    return {
        'id': u.get('id'), 'name': u.get('name'), 'email': u.get('email'),
        'password': u.get('password'), 'role': u.get('role'),
        'enrollmentNo': u.get('enrollmentno'), 'subject': u.get('subject')
    }

def to_pg_test(t):
    return {
        'id': t.get('id'), 'title': t.get('title'), 'description': t.get('description'),
        'duration': t.get('duration'), 'status': t.get('status'),
        'createdby': t.get('createdBy'), 'scheduledat': t.get('scheduledAt'),
        'assignedstudents': t.get('assignedStudents'), 'instructions': t.get('instructions')
    }

def from_pg_test(t):
    return {
        'id': t.get('id'), 'title': t.get('title'), 'description': t.get('description'),
        'duration': t.get('duration'), 'status': t.get('status'),
        'createdBy': t.get('createdby'), 'scheduledAt': t.get('scheduledat'),
        'assignedStudents': t.get('assignedstudents'), 'instructions': t.get('instructions')
    }

def to_pg_session(s):
    return {
        'id': s.get('id'), 'status': s.get('status'), 'score': s.get('score'),
        'test_id': s.get('testId'), 'student_id': s.get('studentId'), 'proctor_id': s.get('proctorId'),
        'started_at': s.get('startedAt'), 'ended_at': s.get('endedAt'),
        'total_marks': s.get('totalMarks'), 'risk_score': s.get('riskScore'),
        'violation_count': s.get('violationCount'), 'total_violations': s.get('totalViolations'),
        'answers': s.get('answers')
    }

def from_pg_session(s):
    return {
        'id': s.get('id'), 'status': s.get('status'), 'score': s.get('score'),
        'testId': s.get('test_id'), 'studentId': s.get('student_id'), 'proctorId': s.get('proctor_id'),
        'startedAt': s.get('started_at'), 'endedAt': s.get('ended_at'),
        'totalMarks': s.get('total_marks'), 'riskScore': s.get('risk_score'),
        'violationCount': s.get('violation_count'), 'totalViolations': s.get('total_violations'),
        'answers': s.get('answers')
    }

def to_pg_violation(v):
    return {
        'id': v.get('id'), 'type': v.get('type'), 'timestamp': v.get('timestamp'), 'severity': v.get('severity'),
        'session_id': v.get('sessionId'), 'test_id': v.get('testId'), 'student_id': v.get('studentId')
    }

def from_pg_violation(v):
    return {
        'id': v.get('id'), 'type': v.get('type'), 'timestamp': v.get('timestamp'), 'severity': v.get('severity'),
        'sessionId': v.get('session_id'), 'testId': v.get('test_id'), 'studentId': v.get('student_id')
    }

def seed_and_return_db():
    print('Seeding Supabase users table...')
    try:
        users = [to_pg_user(u) for u in INITIAL_DATA['students'] + INITIAL_DATA['proctors']]
        supabase.table('users').upsert(users).execute()
    except Exception as e:
        print(f'Seed error: {e}')
    return jsonify(scrub_sensitive_data(INITIAL_DATA))

@app.route('/api/db', methods=['GET'])
def get_db():
    try:
        users_res = supabase.table('users').select('*').execute()
        tests_res = supabase.table('tests').select('*').execute()
        questions_res = supabase.table('questions').select('*').execute()
        sessions_res = supabase.table('sessions').select('*').execute()
        violations_res = supabase.table('violations').select('*').execute()
        
        users_raw = users_res.data if users_res and hasattr(users_res, 'data') else []
        users = [from_pg_user(u) for u in users_raw]
        students = [u for u in users if u.get('role') == 'student']
        proctors = [u for u in users if u.get('role') == 'proctor']
        
        tests_raw = tests_res.data if tests_res and hasattr(tests_res, 'data') else []
        tests = [from_pg_test(t) for t in tests_raw]
        questions = questions_res.data if questions_res and hasattr(questions_res, 'data') else []
        
        for test in tests:
            test['questions'] = [q for q in questions if q.get('test_id') == test.get('id')]
            
        sessions_raw = sessions_res.data if sessions_res and hasattr(sessions_res, 'data') else []
        violations_raw = violations_res.data if violations_res and hasattr(violations_res, 'data') else []
            
        data = {
            "students": students,
            "proctors": proctors,
            "tests": tests,
            "sessions": [from_pg_session(s) for s in sessions_raw],
            "violations": [from_pg_violation(v) for v in violations_raw]
        }
        
        if not students:
            return seed_and_return_db()
            
        return jsonify(scrub_sensitive_data(data))
    except Exception as e:
        print(f'DB GET error: {e}')
        return jsonify(scrub_sensitive_data(INITIAL_DATA))

@app.route('/api/db', methods=['POST'])
def save_db():
    data = request.get_json(silent=True) or {}
    try:
        tests = data.get('tests', [])
        test_records = []
        questions = []
        
        for t in tests:
            # Note: q['correct_idx'] was stored as 'correct' in frontend originally maybe?
            # Looking at db.json: yes, frontend uses 'correct' for the integer index.
            # So map frontend 'correct' to Postgres 'correct_idx'.
            for q in t.get('questions', []):
                q_rec = q.copy()
                q_rec['test_id'] = t['id']
                if 'correct' in q_rec:
                    q_rec['correct_idx'] = q_rec.pop('correct')
                questions.append(q_rec)
                
            test_records.append(to_pg_test(t))
                
        if test_records:
            supabase.table('tests').upsert(test_records).execute()
        if questions:
            supabase.table('questions').upsert(questions).execute()
            
        sessions = data.get('sessions', [])
        if sessions:
            supabase.table('sessions').upsert([to_pg_session(s) for s in sessions]).execute()
            
        violations = data.get('violations', [])
        if violations:
            supabase.table('violations').upsert([to_pg_violation(v) for v in violations]).execute()
            
        return jsonify({"status": "success"})
    except Exception as e:
        print(f'DB POST error: {e}')
        return jsonify({"error": str(e)}), 500

# ─── Authentication (Relational Query) ────────────────────────────────────────
@app.route('/api/login', methods=['POST'])
def login():
    credentials = request.get_json()
    email = credentials.get('email')
    password = credentials.get('password')
    role = credentials.get('role')

    try:
        res = supabase.table('users').select('*').eq('email', email).eq('role', role).execute()
        users_raw = res.data if res and hasattr(res, 'data') else []
        
        if users_raw and users_raw[0].get('password') == password:
            user = from_pg_user(users_raw[0])
            session_user = {k: v for k, v in user.items() if k != 'password'}
            return jsonify({"status": "success", "user": session_user})
        else:
            return jsonify({"status": "error", "message": "Invalid email or password"}), 401
            
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ─── OpenRouter Proxy (key stays server-side) ─────────────────────────────────
@app.route('/api/questions', methods=['POST'])
def generate_questions():
    key = OPENROUTER_KEY
    if not key:
        return jsonify({"error": "OpenRouter key not configured on server"}), 500

    data = request.get_json()
    try:
        resp = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://integrisight.onrender.com",
                "X-Title": "IntegriSight"
            },
            json=data,
            timeout=60
        )
        return jsonify(resp.json()), resp.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Serve Frontend Static Files ──────────────────────────────────────────────
@app.route('/', defaults={'path': 'login.html'})
@app.route('/<path:path>')
def serve_frontend(path):
    return send_from_directory('../html-frontend', path)


if __name__ == '__main__':
    app.run(port=5001, debug=True)
