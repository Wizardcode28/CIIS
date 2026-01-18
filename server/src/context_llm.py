from transformers import pipeline
import torch

print("context_llm module loaded (Zero-Shot BART)")

# Global pipeline variable
classifier = None

def load_context_model():
    """
    Lazy load the Zero-Shot Classification pipeline.
    Uses facebook/bart-large-mnli.
    """
    global classifier
    if classifier is not None:
        return

    try:
        # Use CPU by default to be safe on Windows, or cuda if available
        device = 0 if torch.cuda.is_available() else -1
        
        print("[LLM] Loading valhalla/distilbart-mnli-12-3 (Distilled) for context analysis...")
        classifier = pipeline(
            "zero-shot-classification",
            model="valhalla/distilbart-mnli-12-3",
            device=device
        )
        print("[LLM] Context model loaded successfully.")
    except Exception as e:
        print(f"[LLM] CRITICAL ERROR: {e}")
        # non-fatal, will just return neutral scores
        pass

def get_context_probs(text: str) -> list:
    """
    Analyzes text against specific hypotheses to determine deep context.
    Returns probabilities for:
    [
      0: "Political Criticism" (Anti-Govt),
      1: "National Criticism" (Anti-India), 
      2: "Political Praise" (Pro-Govt),
      3: "National Praise" (Pro-India)
    ]
    """
    # Lazy load
    if classifier is None:
        load_context_model()

    if classifier is None:
        # Fallback if model failed to load
        return [0.25, 0.25, 0.25, 0.25]

    labels = [
        "criticism of the government",   # 0
        "criticism of the country",      # 1
        "praise of the government",      # 2
        "praise of the country"          # 3
    ]

    try:
        result = classifier(text, candidate_labels=labels, multi_label=False)
        
        # Result has 'labels' and 'scores' sorted by score descending.
        # We need to map them back to our fixed order [0, 1, 2, 3]
        
        score_map = {label: score for label, score in zip(result['labels'], result['scores'])}
        
        ordered_scores = [
            score_map.get(labels[0], 0.0),
            score_map.get(labels[1], 0.0),
            score_map.get(labels[2], 0.0),
            score_map.get(labels[3], 0.0)
        ]
        
        return ordered_scores

    except Exception as e:
        print(f"[LLM] Inference failed: {e}")
        return [0.25, 0.25, 0.25, 0.25]
