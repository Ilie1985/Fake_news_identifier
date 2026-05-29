from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.ml_model import fake_news_model
from app.schemas import PredictionRequest, PredictionResponse


app = FastAPI(
    title="Fake News Detection API",
    description="Python FastAPI backend for ML-based fake news prediction.",
    version="1.0.0"
)


# CORS allows the future frontend to call this backend.
# During development, we allow localhost frontend URLs.
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
    