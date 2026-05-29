from pathlib import Path
import json
import re

import joblib
import matplotlib.pyplot as plt
import pandas as pd

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    precision_score,
    recall_score,
    f1_score
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline


# ------------------------------------------------------------
# 1. Define project paths
# ------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[1]

DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"
ARTIFACTS_DIR = BASE_DIR / "artifacts"

FAKE_DATA_PATH = DATA_DIR / "Fake.csv"
TRUE_DATA_PATH = DATA_DIR / "True.csv"

MODEL_OUTPUT_PATH = MODELS_DIR / "fake_news_model.pkl"
METRICS_OUTPUT_PATH = ARTIFACTS_DIR / "model_metrics.json"
METRICS_CHART_PATH = ARTIFACTS_DIR / "model_metrics_chart.png"
CONFUSION_MATRIX_CHART_PATH = ARTIFACTS_DIR / "confusion_matrix.png"
TOP_FAKE_WORDS_PATH = ARTIFACTS_DIR / "top_fake_words.csv"
TOP_REAL_WORDS_PATH = ARTIFACTS_DIR / "top_real_words.csv"


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
# 4. Save model metrics to JSON
# ------------------------------------------------------------

def save_metrics_json(
    accuracy: float,
    precision: float,
    recall: float,
    f1: float,
    matrix,
    labels,
    report,
    total_rows: int,
    training_rows: int,
    testing_rows: int
) -> None:
    """
    Saves model evaluation results into a JSON file.
    This will later be useful for the ML Insights page.
    """

    metrics = {
        "dataset_rows_after_cleaning": total_rows,
        "training_rows": training_rows,
        "testing_rows": testing_rows,
        "labels": labels,
        "accuracy": round(float(accuracy), 4),
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "f1_score": round(float(f1), 4),
        "confusion_matrix": matrix.tolist(),
        "classification_report": report
    }

    with open(METRICS_OUTPUT_PATH, "w", encoding="utf-8") as file:
        json.dump(metrics, file, indent=4)

    print(f"Metrics JSON saved to: {METRICS_OUTPUT_PATH}")


# ------------------------------------------------------------
# 5. Save metrics bar chart
# ------------------------------------------------------------

def save_metrics_chart(accuracy: float, precision: float, recall: float, f1: float) -> None:
    """
    Saves a bar chart showing accuracy, precision, recall, and F1-score.
    """

    metric_names = ["Accuracy", "Precision", "Recall", "F1-score"]
    metric_values = [accuracy, precision, recall, f1]

    plt.figure(figsize=(8, 5))
    plt.bar(metric_names, metric_values)
    plt.ylim(0, 1)
    plt.title("Model Performance Metrics")
    plt.ylabel("Score")

    for index, value in enumerate(metric_values):
        plt.text(index, value + 0.01, f"{value:.4f}", ha="center")

    plt.tight_layout()
    plt.savefig(METRICS_CHART_PATH)
    plt.close()

    print(f"Metrics chart saved to: {METRICS_CHART_PATH}")


# ------------------------------------------------------------
# 6. Save confusion matrix chart
# ------------------------------------------------------------

def save_confusion_matrix_chart(matrix, labels) -> None:
    """
    Saves a confusion matrix chart.
    """

    plt.figure(figsize=(6, 5))
    plt.imshow(matrix)
    plt.title("Confusion Matrix")
    plt.xlabel("Predicted Label")
    plt.ylabel("Actual Label")

    plt.xticks(range(len(labels)), labels)
    plt.yticks(range(len(labels)), labels)

    for row_index in range(len(labels)):
        for column_index in range(len(labels)):
            plt.text(
                column_index,
                row_index,
                matrix[row_index][column_index],
                ha="center",
                va="center"
            )

    plt.tight_layout()
    plt.savefig(CONFUSION_MATRIX_CHART_PATH)
    plt.close()

    print(f"Confusion matrix chart saved to: {CONFUSION_MATRIX_CHART_PATH}")


# ------------------------------------------------------------
# 7. Save feature importance
# ------------------------------------------------------------

def save_feature_importance(model: Pipeline) -> None:
    """
    Saves the top words that influence fake and real predictions.

    Logistic Regression coefficients show which TF-IDF words are more strongly
    associated with each class.
    """

    tfidf = model.named_steps["tfidf"]
    classifier = model.named_steps["classifier"]

    feature_names = tfidf.get_feature_names_out()
    coefficients = classifier.coef_[0]

    feature_importance_df = pd.DataFrame({
        "word": feature_names,
        "coefficient": coefficients
    })

    # For binary Logistic Regression, one side of the coefficients points
    # towards one class and the other side points towards the other class.
    top_negative = feature_importance_df.sort_values(
        by="coefficient",
        ascending=True
    ).head(30)

    top_positive = feature_importance_df.sort_values(
        by="coefficient",
        ascending=False
    ).head(30)

    # Work out which class positive coefficients represent
    classes = list(classifier.classes_)

    positive_class = classes[1]
    negative_class = classes[0]

    if positive_class == "fake":
        top_fake_words = top_positive
        top_real_words = top_negative
    else:
        top_fake_words = top_negative
        top_real_words = top_positive

    top_fake_words.to_csv(TOP_FAKE_WORDS_PATH, index=False)
    top_real_words.to_csv(TOP_REAL_WORDS_PATH, index=False)

    print(f"Top fake words saved to: {TOP_FAKE_WORDS_PATH}")
    print(f"Top real words saved to: {TOP_REAL_WORDS_PATH}")


# ------------------------------------------------------------
# 8. Train model
# ------------------------------------------------------------

def train_model() -> None:
    """
    Trains the fake news detection model, evaluates it,
    saves the model, and generates Stage 3 artifacts.
    """

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

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

    report = classification_report(
        y_test,
        y_pred,
        labels=labels,
        output_dict=True,
        zero_division=0
    )

    print("\nModel performance:")
    print(f"Accuracy:  {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1-score:  {f1:.4f}")

    print("\nConfusion matrix:")
    print("Labels:", labels)
    print(matrix)

    print("\nSaving model and artifacts...")

    joblib.dump(model, MODEL_OUTPUT_PATH)

    save_metrics_json(
        accuracy=accuracy,
        precision=precision,
        recall=recall,
        f1=f1,
        matrix=matrix,
        labels=labels,
        report=report,
        total_rows=len(df),
        training_rows=len(X_train),
        testing_rows=len(X_test)
    )

    save_metrics_chart(
        accuracy=accuracy,
        precision=precision,
        recall=recall,
        f1=f1
    )

    save_confusion_matrix_chart(
        matrix=matrix,
        labels=labels
    )

    save_feature_importance(model)

    print(f"Model saved to: {MODEL_OUTPUT_PATH}")
    print("\nStage 3 complete.")


# ------------------------------------------------------------
# 9. Run training script
# ------------------------------------------------------------

if __name__ == "__main__":
    train_model()