import cv2
import mediapipe as mp
import numpy as np
import base64

# Initialize MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
# Max num faces set to 10 to detect multiple faces for proctoring
face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=False,
    min_detection_confidence=0.7, 
    min_tracking_confidence=0.7, 
    max_num_faces=10
)

def extract_image(b64_string):
    """Decodes a base64 string to a cv2 image."""
    try:
        if ',' in b64_string:
            b64_string = b64_string.split(',')[1]
        img_data = base64.b64decode(b64_string)
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        print(f"Error decoding image: {e}")
        return None

def analyze_frame(b64_string):
    """
    Analyzes a base64 frame for exam integrity violations.
    Checks for: face not visible, multiple faces, and gaze away.
    """
    img = extract_image(b64_string)
    if img is None:
        return {
            "face_count": 0,
            "gaze_away": False,
            "multiple_faces": False,
            "face_visible": False,
            "violations": ["face_not_visible"]
        }

    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(img_rgb)
    
    face_count = 0
    if results.multi_face_landmarks:
        face_count = len(results.multi_face_landmarks)
        
    violations = []
    face_visible = face_count > 0
    multiple_faces = face_count > 1
    gaze_away = False
    
    if not face_visible:
        violations.append("face_not_visible")
    elif multiple_faces:
        violations.append("multiple_faces")
    else:
        # Check head pose for the single face
        face_landmarks = results.multi_face_landmarks[0]
        h, w, c = img.shape
        
        # Check head pose using stable 2D relative geometry heuristics
        left_eye = face_landmarks.landmark[33]
        right_eye = face_landmarks.landmark[263]
        nose = face_landmarks.landmark[1]
        
        # Calculate yaw (left/right) based on distance from nose to each eye
        left_dist = abs(nose.x - left_eye.x)
        right_dist = abs(right_eye.x - nose.x)
        
        # A person looking straight ahead will have left_dist ~= right_dist
        yaw_ratio = left_dist / (right_dist + 1e-6)
        
        # Calculate pitch (up/down) based on nose vs eye vs mouth height
        eye_y = (left_eye.y + right_eye.y) / 2
        mouth_y = (face_landmarks.landmark[61].y + face_landmarks.landmark[291].y) / 2
        nose_y = nose.y
        
        # Nose position relative to the distance between eyes and mouth
        # Typically around 0.45 when looking straight
        pitch_ratio = (nose_y - eye_y) / (mouth_y - eye_y + 1e-6)
        
        # Gaze away threshold
        # Yaw ratio < 0.5 (looking right) or > 2.0 (looking left)
        # Pitch ratio < 0.20 (looking up) or > 0.70 (looking down)
        if yaw_ratio < 0.5 or yaw_ratio > 2.0 or pitch_ratio < 0.20 or pitch_ratio > 0.70:
            gaze_away = True
            violations.append("gaze_away")

    return {
        "face_count": face_count,
        "gaze_away": gaze_away,
        "multiple_faces": multiple_faces,
        "face_visible": face_visible,
        "violations": violations
    }
