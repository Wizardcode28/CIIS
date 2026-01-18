import numpy as np

print("feature_builder module loaded")

def build_features(similarity: dict, sentiment: list, sarcasm: float, context_probs: list) -> np.ndarray:
    """
    Build final feature vector for stance classification
    
    similarity: dict (5 scores)
    sentiment: [neg, neutral, pos]
    sarcasm: float
    context_probs: [pol_crit, nat_crit, pol_praise, nat_praise] (4 scores)
    """

    features = [
        similarity["pro_india"],
        similarity["anti_india"],
        similarity["pro_government"],
        similarity["anti_government"],
        similarity["neutral"],
        sentiment[0],   # negative
        sentiment[1],   # neutral
        sentiment[2],   # positive
        sarcasm,
        context_probs[0], # Political Criticism
        context_probs[1], # National Criticism
        context_probs[2], # Political Praise
        context_probs[3]  # National Praise
    ]

    return np.array(features, dtype=np.float32)
