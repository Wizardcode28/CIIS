import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

print("anchor_similarity module loaded")

# --------------------------------------------------
# GLOBAL ANCHOR EMBEDDINGS
# --------------------------------------------------
# These must be filled during initialization
# Example structure:
# {
#   "pro_india": np.ndarray,
#   "anti_india": np.ndarray,
#   "pro_government": np.ndarray,
#   "anti_government": np.ndarray,
#   "neutral": np.ndarray
# }

ANCHOR_EMBEDDINGS = {}

def load_anchor_embeddings(anchor_embeddings: dict):
    """
    Load precomputed anchor embeddings once at startup
    """
    global ANCHOR_EMBEDDINGS
    ANCHOR_EMBEDDINGS = anchor_embeddings


def compute_similarity(text_embedding: np.ndarray, anchor_embeddings=None) -> dict:
    """
    Compute cosine similarity between text embedding and anchor sets
    """

    # Use global anchors if not explicitly passed
    anchors = anchor_embeddings if anchor_embeddings is not None else ANCHOR_EMBEDDINGS

    if not anchors:
        raise ValueError("Anchor embeddings not loaded")

    scores = {}

    for label, vectors in anchors.items():
        sims = cosine_similarity(
            text_embedding.reshape(1, -1),
            vectors
        )[0]

        # top-k mean similarity
        scores[label] = float(np.mean(np.sort(sims)[-5:]))

    return scores
