from pathlib import Path

import joblib

from app.ai_explanation import generate_ai_explanation


BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_PATH = BASE_DIR / "models" / "fake_news_model.pkl"


class FakeNewsModel:
    """
    Loads the trained machine-learning model and makes predictions.
    """

    def __init__(self):
        self.model = None

    def load_model(self) -> None:
        """
        Loads the saved model from the models folder.
        """

        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Model file not found at {MODEL_PATH}. "
                "Please run python scripts/train_model.py first."
            )

        self.model = joblib.load(MODEL_PATH)

    def predict(self, text: str) -> dict:
        """
        Predicts whether the submitted news text is fake or real.
        Then generates an AI explanation using OpenAI.
        """

        if self.model is None:
            self.load_model()

        prediction = self.model.predict([text])[0]

        confidence = 0.0

        if hasattr(self.model, "predict_proba"):
            probabilities = self.model.predict_proba([text])[0]
            confidence = float(max(probabilities))

        confidence_percentage = f"{confidence * 100:.2f}%"

        risk_level = self.get_risk_level(
            prediction=prediction,
            confidence=confidence
        )

        explanation = generate_ai_explanation(
            text=text,
            prediction=str(prediction),
            confidence_percentage=confidence_percentage,
            risk_level=risk_level
        )

        return {
            "prediction": str(prediction),
            "confidence": round(confidence, 4),
            "confidence_percentage": confidence_percentage,
            "risk_level": risk_level,
            "explanation": explanation
        }

    @staticmethod
    def get_risk_level(prediction: str, confidence: float) -> str:
        """
        Converts the model prediction and confidence into a simple risk level.
        """

        if prediction == "fake":
            if confidence >= 0.80:
                return "High"
            if confidence >= 0.60:
                return "Medium"
            return "Uncertain"

        if prediction == "real":
            if confidence >= 0.80:
                return "Low"
            if confidence >= 0.60:
                return "Medium"
            return "Uncertain"

        return "Uncertain"


fake_news_model = FakeNewsModel()