import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

print("sarcasm module loaded (BERT Sarcasm Detector)")

# FIX: Use a Twitter-based Irony model (RoBERTa) which is better for social media/Reddit
MODEL_NAME = "cardiffnlp/twitter-roberta-base-irony"

try:
    # FIX: Force use_fast=False to avoid Windows rust-tokenizer crashes
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, use_fast=False)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
    model.eval()
except Exception as e:
    print(f"CRITICAL ERROR loading sarcasm model: {e}")
    raise e


def sarcasm_score(text: str) -> float:
    """
    Deep sarcasm probability (0-1).
    Uses helinivan/english-sarcasm-detector (BERT-based).
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

        # The model 'helinivan/english-sarcasm-detector' labels:
        # 0: Not Sarcastic
        # 1: Sarcastic
        # We want the probability of it being sarcastic (index 1)
        return float(probs[0][1])
