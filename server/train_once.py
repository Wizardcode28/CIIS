import numpy as np
from src.train_classifier import train_and_save

# DUMMY FEATURES (9 features as defined)
X = np.random.rand(20, 9)

# DUMMY LABELS (5 classes)
y = np.random.randint(0, 5, size=20)

train_and_save(X, y)
