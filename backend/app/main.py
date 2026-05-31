from pathlib import Path
import csv
import json

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.ml_model import fake_news_model
from app.schemas import PredictionRequest, PredictionResponse


BASE_DIR = Path(__file__).resolve().parents[1]
ARTIFACTS_DIR = BASE_DIR / "artifacts"

METRICS_PATH = ARTIFACTS_DIR / "model_metrics.json"
TOP_FAKE_WORDS_PATH = ARTIFACTS_DIR / "top_fake_words.csv"
TOP_REAL_WORDS_PATH = ARTIFACTS_DIR / "top_real_words.csv"


app = FastAPI(
    title="Fake News Detection API",
    description="Python FastAPI backend for ML-based fake news prediction.",
    version="1.0.0"
)


# CORS allows the frontend to call this backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    """
    Loads the ML model when the API starts.
    """

    try:
        fake_news_model.load_model()
        print("Fake news model loaded successfully.")
    except FileNotFoundError as error:
        print(f"Warning: {error}")


@app.get("/")
def root():
    """
    Root endpoint to confirm the API is running.
    """

    return {
        "message": "Fake News Detection API is running",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
def health_check():
    """
    Simple health check endpoint.
    """

    return {
        "status": "ok"
    }


@app.post("/predict", response_model=PredictionResponse)
def predict_news(request: PredictionRequest):
    """
    Receives news text and returns prediction result.
    """

    try:
        result = fake_news_model.predict(request.text)
        return result

    except FileNotFoundError as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(error)}"
        )


@app.get("/model/metrics")
def get_model_metrics():
    """
    Returns model evaluation metrics from the Stage 3 artifacts.
    """

    if not METRICS_PATH.exists():
        raise HTTPException(
            status_code=404,
            detail="model_metrics.json not found. Run python scripts/train_model.py first."
        )

    with open(METRICS_PATH, "r", encoding="utf-8") as file:
        return json.load(file)


def read_feature_words(file_path: Path):
    """
    Reads feature importance CSV files and returns the top words.
    """

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"{file_path.name} not found. Run python scripts/train_model.py first."
        )

    rows = []

    with open(file_path, "r", encoding="utf-8") as file:
        reader = csv.DictReader(file)

        for row in reader:
            rows.append({
                "word": row.get("word", ""),
                "coefficient": float(row.get("coefficient", 0))
            })

    return rows


@app.get("/model/top-fake-words")
def get_top_fake_words():
    """
    Returns words most strongly associated with fake predictions.
    """

    return read_feature_words(TOP_FAKE_WORDS_PATH)


@app.get("/model/top-real-words")
def get_top_real_words():
    """
    Returns words most strongly associated with real predictions.
    """

    return read_feature_words(TOP_REAL_WORDS_PATH)