import numpy as np
import joblib
import os
from sklearn.linear_model import LogisticRegression

# Output path
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "final_classifier.pkl")
os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

print(">>> Generating Synthetic Logic-Aligned Training Data...")

# Features:
# 0: sim_pro_india
# 1: sim_anti_india
# 2: sim_pro_govt
# 3: sim_anti_govt
# 4: sim_neutral
# 5: neg
# 6: neu
# 7: pos
# 8: sarcasm
# 9: context_pol_crit (Anti-Govt)
# 10: context_nat_crit (Anti-India)
# 11: context_pol_praise (Pro-Govt)
# 12: context_nat_praise (Pro-India)

def generate_sample(label_idx):
    # Base noise for 13 features
    feats = np.random.uniform(0.0, 0.3, 13)
    
    # 0: Pro-India
    if label_idx == 0:
        feats[0] = np.random.uniform(0.6, 1.0) # High Pro-India Sim
        feats[7] = np.random.uniform(0.5, 1.0) # High Positive
        feats[5] = np.random.uniform(0.0, 0.2) # Low Negative
        feats[8] = np.random.uniform(0.0, 0.2) # IGNORE SARCASM
        # LLM Context
        feats[12] = np.random.uniform(0.7, 1.0) # High National Praise
        feats[9] = np.random.uniform(0.0, 0.2)  # Low Pol Crit
        
    # 1: Anti-India
    elif label_idx == 1:
        feats[1] = np.random.uniform(0.6, 1.0) # High Anti-India Sim
        feats[5] = np.random.uniform(0.5, 1.0) # High Negative
        feats[7] = np.random.uniform(0.0, 0.2) # Low Positive
        feats[8] = np.random.uniform(0.0, 0.2) # IGNORE SARCASM
        # LLM Context
        feats[10] = np.random.uniform(0.7, 1.0) # High National Criticism
        feats[9] = np.random.uniform(0.0, 0.3)  # Low/Med Pol Crit

    # 2: Pro-Government
    elif label_idx == 2:
        feats[2] = np.random.uniform(0.6, 1.0) # High Pro-Govt Sim
        feats[7] = np.random.uniform(0.5, 1.0) # High Positive
        feats[5] = np.random.uniform(0.0, 0.2) # Low Negative
        feats[8] = np.random.uniform(0.0, 0.2) # IGNORE SARCASM
        # LLM Context
        feats[11] = np.random.uniform(0.7, 1.0) # High Political Praise
        feats[10] = np.random.uniform(0.0, 0.2) # Low Nat Crit

    # 3: Anti-Government
    elif label_idx == 3:
        feats[3] = np.random.uniform(0.6, 1.0) # High Anti-Govt Sim
        feats[5] = np.random.uniform(0.5, 1.0) # High Negative
        feats[7] = np.random.uniform(0.0, 0.2) # Low Positive
        feats[8] = np.random.uniform(0.0, 0.2) # IGNORE SARCASM
        # LLM Context
        feats[9] = np.random.uniform(0.7, 1.0) # High Political Criticism!
        feats[10] = np.random.uniform(0.0, 0.4) # Low/Med Nat Crit

    # 4: Neutral
    elif label_idx == 4:
        feats[4] = np.random.uniform(0.5, 1.0) # High Neutral Sim
        feats[6] = np.random.uniform(0.5, 1.0) # High Neutral Sentiment
        feats[5] = np.random.uniform(0.0, 0.2) 
        feats[7] = np.random.uniform(0.0, 0.2)
        feats[8] = np.random.uniform(0.0, 0.1)
        # LLM Context -> All low or balanced
        feats[9] = np.random.uniform(0.0, 0.3)
        feats[10] = np.random.uniform(0.0, 0.3)

    return feats

# Generate data
X = []
y = []
SAMPLES_PER_CLASS = 500

for label in range(5):
    for _ in range(SAMPLES_PER_CLASS):
        X.append(generate_sample(label))
        y.append(label)

X = np.array(X)
y = np.array(y)

print(f"Training Logistic Regression on {len(X)} synthetic samples (13 features)...")
clf = LogisticRegression(max_iter=1000, multi_class='multinomial', solver='lbfgs')
clf.fit(X, y)

print(f"Accuracy on Training Set: {clf.score(X, y):.4f}")

print(f"Saving model to {MODEL_PATH}...")
joblib.dump(clf, MODEL_PATH)
print("DONE.")

