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

if __name__ == '__main__':
    # Run independently on port 5001
    app.run(port=5001, debug=True)
