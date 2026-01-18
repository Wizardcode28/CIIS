import sys
import os

# ---- PERMANENT IMPORT FIX ----
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT_DIR)

from src.language_detection import detect_language
from src.preprocessing import clean_text
from src.predict import predict
from src.feature_builder import build_features
from src.anchor_similarity import compute_similarity
from src.embeddings import embedder
from src.sarcasm import sarcasm_score
from src.sentiment import sentiment_scores
from src.translation import translate_to_english
from src.context_llm import get_context_probs

# ---- SUPPORTED LANGUAGES ----
SUPPORTED_LANGS = {"en", "hi", "ta", "ur", "bn", "te", "ml", "gu", "kn", "mr"}

LABELS = [
    "Pro-India",
    "Anti-India",
    "Pro-Government",
    "Anti-Government",
    "Neutral"
]

def init_anchors():
    """
    Load anchor text from data/anchors/, encode them, and inject into anchor_similarity module.
    """
    print("[INIT] Loading anchor embeddings...")
    anchor_dir = os.path.join(ROOT_DIR, "data", "anchors")
    
    # Map keys to filenames
    keys = ["pro_india", "anti_india", "pro_government", "anti_government", "neutral"]
    loaded_anchors = {}

    for key in keys:
        file_path = os.path.join(anchor_dir, f"{key}.txt")
        if not os.path.exists(file_path):
            print(f"[WARNING] Anchor file missing: {file_path}")
            continue
            
        with open(file_path, "r", encoding="utf-8") as f:
            lines = [line.strip() for line in f if line.strip()]
            
        if not lines:
            print(f"[WARNING] Anchor file empty: {key}")
            continue

        # Encode (batch)
        # embedder is from src.embeddings
        embeddings_matrix = embedder.encode(lines)
        loaded_anchors[key] = embeddings_matrix
        print(f"   - Loaded {key}: {len(lines)} examples")

    # Inject into module
    from src.anchor_similarity import load_anchor_embeddings
    load_anchor_embeddings(loaded_anchors)
    print("[INIT] Anchor embeddings initialized.\n")

def classify(text: str):
    # 1. Clean text
    text = clean_text(text)

    if len(text.strip()) == 0:
        return {"error": "Empty input text"}

    # 2. Language detection
    lang, prob = detect_language(text)

    # DEBUG (you can remove later)
    print(f"[DEBUG] Detected language: {lang}, confidence: {round(prob, 3)}")


    # 2.5 Translation (if not English)
    # We use English for processing because the Sarcasm/Sentiment models are English-specific
    # and the Anchors are in English.
    processing_text = text
    if lang != 'en':
        print(f"[INFO] Translating {lang} to en...")
        translated = translate_to_english(text, source=lang)
        print(f"       -> {translated}")
        processing_text = translated

    # 3. Sentence embedding
    text_embedding = embedder.encode(processing_text, normalize_embeddings=True)

    # 4. Cosine similarity with anchors
    similarity_scores = compute_similarity(
        text_embedding=text_embedding,
        anchor_embeddings=None  # handled internally if global
    )

    # 5. Sentiment + sarcasm
    sentiment = sentiment_scores(processing_text)     # [neg, neutral, pos]
    sarcasm = sarcasm_score(processing_text)           # float 0–1

    # 5.5 LLM Context Analysis
    context_probs = get_context_probs(processing_text)

    # 6. Feature vector
    features = build_features(
        similarity=similarity_scores,
        sentiment=sentiment,
        sarcasm=sarcasm,
        context_probs=context_probs
    )

    # 7. Final prediction
    label_idx, confidence = predict(features)

    return {
        "text": text,
        "label": LABELS[label_idx],
        "confidence": round(confidence, 3),
        "language": lang,
        "sarcasm_score": round(sarcasm, 3),
        "sentiment": {
            "negative": round(sentiment[0], 3),
            "neutral": round(sentiment[1], 3),
            "positive": round(sentiment[2], 3),
        }
    }
  
# ---- ENTRY POINT ----
if __name__ == "__main__":
    init_anchors()
    
    # Process test.txt if it exists
    if os.path.exists("test.txt"):
        print("Processing test.txt...")
        with open("test.txt","r") as f:
            for line in f:
                if line.strip():
                    result= classify(line)
                    print(result)
        print("-" * 50)

    print("\n🔍 Reddit Political Stance Classifier")
    print("Type 'exit' to quit\n")

    while True:
        text = input("Enter Reddit post: ").strip()

        if text.lower() == "exit":
            break

        result = classify(text)
        print("\nResult:")
        print(result)
        print("-" * 50)
