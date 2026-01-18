import joblib
import numpy as np

print("predict module loaded")

MODEL_PATH = "models/final_classifier.pkl"

clf = joblib.load(MODEL_PATH)

def predict(features: np.ndarray):
    """
    Predict stance label and confidence
    """
    probs = clf.predict_proba([features])[0]

    sorted_idx = np.argsort(probs)[::-1]
    best = sorted_idx[0]
    second = sorted_idx[1]

    confidence = (probs[best] - probs[second]) / probs[best]

    return best, float(confidence)
