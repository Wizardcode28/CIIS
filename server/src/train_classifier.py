import joblib
from sklearn.linear_model import LogisticRegression

print("train_classifier module loaded")

def train_and_save(X, y):
    """
    Train final stance classifier and save it
    """
    clf = LogisticRegression(
        max_iter=2000,
        multi_class="multinomial"
    )
    clf.fit(X, y)

    joblib.dump(clf, "models/final_classifier.pkl")
    print("✅ Model trained and saved")
