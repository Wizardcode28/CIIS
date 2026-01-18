print("preprocessing module loaded")

import re

def clean_text(text):
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()
import re

def clean_text(text: str) -> str:
    """
    Basic text normalization for Reddit posts
    """
    text = re.sub(r"http\S+", "", text)     # remove URLs
    text = re.sub(r"\s+", " ", text)        # normalize spaces
    return text.strip()
