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


# ─── Database (Supabase) ──────────────────────────────────────────────────────
def scrub_sensitive_data(data):
    """Remove passwords from students and proctors before sending to frontend."""
    if not data: return data
    clean = data.copy()
    if 'students' in clean:
        clean['students'] = [{k: v for k, v in s.items() if k != 'password'} for s in clean['students']]
    if 'proctors' in clean:
        clean['proctors'] = [{k: v for k, v in p.items() if k != 'password'} for p in clean['proctors']]
    return clean

@app.route('/api/db', methods=['GET'])
def get_db():
    try:
        result = supabase.table('store').select('data').eq('id', 1).single().execute()
        data = result.data['data']
        # Auto-seed if students are empty (first run with empty Supabase row)
        if not data.get('students'):
            print('Seeding Supabase with initial data...')
            supabase.table('store').upsert({'id': 1, 'data': INITIAL_DATA}).execute()
            return jsonify(scrub_sensitive_data(INITIAL_DATA))
        return jsonify(scrub_sensitive_data(data))
    except Exception as e:
        # No row exists yet — create it with initial data
        print(f'DB GET error (seeding fresh): {e}')
        try:
            supabase.table('store').upsert({'id': 1, 'data': INITIAL_DATA}).execute()
        except Exception as seed_err:
            print(f'Seed error: {seed_err}')
        return jsonify(scrub_sensitive_data(INITIAL_DATA))


@app.route('/api/db', methods=['POST'])
def save_db():
    # Note: This tool currently allows full overwrite. In a real app, 
    # we would merge the data on the server to prevent deleting users/passwords.
    data = request.get_json(silent=True) or {}
    try:
        # Fetch existing data to preserve users and passwords
        curr = supabase.table('store').select('data').eq('id', 1).single().execute()
        existing = curr.data['data']
        
        # Merge incoming changes (tests, sessions, violations) 
        # but keep existing students/proctors (passwords)
        existing.update({k: v for k, v in data.items() if k not in ['students', 'proctors']})
        
        supabase.table('store').upsert({'id': 1, 'data': existing}).execute()
        return jsonify({"status": "success"})
    except Exception as e:
        print(f'DB POST error: {e}')
        return jsonify({"error": str(e)}), 500


# ─── Authentication ──────────────────────────────────────────────────────────
@app.route('/api/login', methods=['POST'])
def login():
    credentials = request.get_json()
    email = credentials.get('email')
    password = credentials.get('password')
    role = credentials.get('role') # 'student' or 'proctor'

    try:
        result = supabase.table('store').select('data').eq('id', 1).single().execute()
        data = result.data['data']
        
        user_list = data.get('students' if role == 'student' else 'proctors', [])
        user = next((u for u in user_list if u['email'] == email and u['password'] == password), None)
        
        if user:
            # Return user info without password
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
