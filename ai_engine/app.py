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
@app.route('/api/db', methods=['GET'])
def get_db():
    try:
        result = supabase.table('store').select('data').eq('id', 1).single().execute()
        return jsonify(result.data['data'])
    except Exception as e:
        # If no row exists yet, seed with initial data
        print(f'DB GET error (seeding): {e}')
        try:
            supabase.table('store').upsert({'id': 1, 'data': INITIAL_DATA}).execute()
        except Exception as seed_err:
            print(f'Seed error: {seed_err}')
        return jsonify(INITIAL_DATA)


@app.route('/api/db', methods=['POST'])
def save_db():
    data = request.get_json(silent=True) or {}
    try:
        supabase.table('store').upsert({'id': 1, 'data': data}).execute()
        return jsonify({"status": "success"})
    except Exception as e:
        print(f'DB POST error: {e}')
        return jsonify({"error": str(e)}), 500


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
