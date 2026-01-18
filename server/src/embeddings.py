from sentence_transformers import SentenceTransformer

print("embeddings module loaded")

# Multilingual sentence embedding model
EMBEDDING_MODEL_NAME = "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"

embedder = SentenceTransformer(EMBEDDING_MODEL_NAME)
