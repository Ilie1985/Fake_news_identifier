from pathlib import Path
import re

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline


# ------------------------------------------------------------
# 1. Define project paths
# ------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[1]

DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"

FAKE_DATA_PATH = DATA_DIR / "Fake.csv"
TRUE_DATA_PATH = DATA_DIR / "True.csv"

MODEL_OUTPUT_PATH = MODELS_DIR / "fake_news_model.pkl"


# ------------------------------------------------------------
# 2. Clean text function
# ------------------------------------------------------------

def clean_text(text: str) -> str:
    """
    Cleans article text before training.

    Steps:
    - Convert to lowercase
    - Remove URLs
    - Remove non-letter characters
    - Remove extra spaces
    """

    text = str(text).lower()
    text = re.sub(r"http\S+|www\.\S+", " ", text)
    text = re.sub(r"[^a-zA-Z\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()

    return text


# ------------------------------------------------------------
# 3. Load and prepare dataset
# ------------------------------------------------------------

def load_and_prepare_dataset() -> pd.DataFrame:
    """
    Loads Fake.csv and True.csv, adds labels, combines them,
    cleans text, removes weak rows, and removes duplicates.
    """

    if not FAKE_DATA_PATH.exists():
        raise FileNotFoundError(f"Could not find {FAKE_DATA_PATH}")

    if not TRUE_DATA_PATH.exists():
        raise FileNotFoundError(f"Could not find {TRUE_DATA_PATH}")

    print("Loading datasets...")

    fake_df = pd.read_csv(FAKE_DATA_PATH)
    true_df = pd.read_csv(TRUE_DATA_PATH)

    print(f"Fake rows before cleaning: {len(fake_df)}")
    print(f"Real rows before cleaning: {len(true_df)}")

    # Add labels
    fake_df["label"] = "fake"
    true_df["label"] = "real"

    # Combine both datasets
    df = pd.concat([fake_df, true_df], ignore_index=True)

    # Check required columns
    required_columns = {"title", "text", "label"}

    if not required_columns.issubset(df.columns):
        raise ValueError(
            f"Dataset must contain these columns: {required_columns}. "
            f"Found columns: {list(df.columns)}"
        )

    # Fill missing title/text values
    df["title"] = df["title"].fillna("")
    df["text"] = df["text"].fillna("")

    # Combine title and article text
    df["combined_text"] = df["title"] + " " + df["text"]

    # Clean combined text
    df["combined_text"] = df["combined_text"].apply(clean_text)

    # Count words after cleaning
    df["word_count"] = df["combined_text"].str.split().str.len()

    # Remove very short rows
    df = df[df["word_count"] >= 20]

    # Remove duplicate text
    df = df.drop_duplicates(subset=["combined_text"])

    # Keep only needed columns
    df = df[["combined_text", "label"]]

    print("\nRows after cleaning:")
    print(df["label"].value_counts())
    print(f"Total rows after cleaning: {len(df)}")

    return df


# ------------------------------------------------------------
# 4. Train model
# ------------------------------------------------------------

def train_model() -> None:
    """
    Trains the fake news detection model and saves it.
    """

    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    df = load_and_prepare_dataset()

    X = df["combined_text"]
    y = df["label"]

    print("\nSplitting dataset into training and testing sets...")

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    print(f"Training rows: {len(X_train)}")
    print(f"Testing rows: {len(X_test)}")

    print("\nTraining TF-IDF + Logistic Regression model...")

    model = Pipeline([
        (
            "tfidf",
            TfidfVectorizer(
                stop_words="english",
                max_df=0.7,
                min_df=2
            )
        ),
        (
            "classifier",
            LogisticRegression(
                max_iter=1000
            )
        )
    ])

    model.fit(X_train, y_train)

    print("\nEvaluating model...")

    y_pred = model.predict(X_test)

    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    recall = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

    labels = ["fake", "real"]
    matrix = confusion_matrix(y_test, y_pred, labels=labels)

    print("\nModel performance:")
    print(f"Accuracy:  {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1-score:  {f1:.4f}")

    print("\nConfusion matrix:")
    print("Labels:", labels)
    print(matrix)

    print("\nSaving model...")

    joblib.dump(model, MODEL_OUTPUT_PATH)

    print(f"Model saved to: {MODEL_OUTPUT_PATH}")


# ------------------------------------------------------------
# 5. Run training script
# ------------------------------------------------------------

if __name__ == "__main__":
    train_model()