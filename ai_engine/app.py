from flask import Flask, request, jsonify
from flask_cors import CORS
from detector import analyze_frame

app = Flask(__name__)
# Enable CORS to allow React frontend to communicate with API
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

@app.route('/analyze', methods=['POST'])
def analyze():
    # Expects JSON data: { "frame": "<base64 jpeg string>" }
    data = request.get_json()
    if not data or 'frame' not in data:
        return jsonify({"error": "No frame provided"}), 400
        
    result = analyze_frame(data['frame'])
    return jsonify(result)

import os
import json

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
DB_FILE = os.path.join(DATA_DIR, 'db.json')

if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

@app.route('/db', methods=['GET'])
def get_db():
    if not os.path.exists(DB_FILE):
        return jsonify(None)
    with open(DB_FILE, 'r') as f:
        data = json.load(f)
    return jsonify(data)

@app.route('/db', methods=['POST'])
def save_db():
    data = request.get_json(silent=True) or {}
    with open(DB_FILE, 'w') as f:
        json.dump(data, f)
    return jsonify({"status": "success"})

if __name__ == '__main__':
    # Run independently on port 5001
    app.run(port=5001, debug=True)
