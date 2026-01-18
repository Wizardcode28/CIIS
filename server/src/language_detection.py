from langdetect import detect_langs, DetectorFactory

# Enforce determinism
DetectorFactory.seed = 0

def detect_language(text: str):
    """
    Robust language detection for Reddit comments.
    Prioritizes English for short text if common stopwords are found.
    """
    # 1. Heuristic: Common English Stopwords
    # Solves short-text issues like "India has deep flaws" being detected as Spanish
    english_stopwords = {"the", "is", "are", "and", "of", "to", "in", "it", "has", "have", "for", "on", "with"}
    words = set(text.lower().split())
    
    # If intersection is non-empty, high confidence it's English
    if words & english_stopwords:
        return "en", 1.0

    # 2. Statistical Detection (langdetect)
    try:
        # returns list of [Language(lang, prob), ...]
        langs = detect_langs(text)
        best = langs[0]
        return best.lang, best.prob
    except Exception:
        # Fallback for empty/numeric text
        return "unknown", 0.0

