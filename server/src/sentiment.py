import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

print("sentiment module loaded (English RoBERTa)")

# FIX: Use the standard (older) model which definitely has support for slow tokenizers
# The 'latest' version sometimes lacks full file support for use_fast=False on all setups
MODEL_NAME = "cardiffnlp/twitter-roberta-base-sentiment"

try:
    # FIX: Force use_fast=False to avoid Windows rust-tokenizer crashes
    # This uses the stable Python-based tokenizer (Byte-Level BPE)
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, use_fast=False)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
    model.eval()
except Exception as e:
    print(f"CRITICAL ERROR loading sentiment model: {e}")
    raise e


def sentiment_scores(text: str):
    """
    Returns sentiment probabilities as:
    [negative, neutral, positive]
    """
    with torch.no_grad():
        inputs = tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=128
        )
        outputs = model(**inputs)
        probs = torch.softmax(outputs.logits, dim=1)
        # Model returns: negative, neutral, positive
        return probs[0].tolist()
