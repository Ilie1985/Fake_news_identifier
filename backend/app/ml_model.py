from pathlib import Path

import joblib


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
        """

        if self.model is None:
            self.load_model()

        prediction = self.model.predict([text])[0]

        confidence = 0.0

        if hasattr(self.model, "predict_proba"):
            probabilities = self.model.predict_proba([text])[0]
            confidence = float(max(probabilities))

        risk_level = self.get_risk_level(
            prediction=prediction,
            confidence=confidence
        )

        explanation = self.get_basic_explanation(
            prediction=prediction,
            confidence=confidence
        )

        return {
            "prediction": str(prediction),
            "confidence": round(confidence, 4),
            "confidence_percentage": f"{confidence * 100:.2f}%",
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

    @staticmethod
    def get_basic_explanation(prediction: str, confidence: float) -> str:
        """
        Temporary rule-based explanation.

        In Stage 8, this will be replaced or improved using OpenAI-generated
        explanations.
        """

        confidence_percentage = f"{confidence * 100:.2f}%"

        if prediction == "fake":
            return (
                f"The model predicts this content as fake with "
                f"{confidence_percentage} confidence. This means the wording "
                "and patterns are similar to fake news examples seen during "
                "training. This result should be treated as a risk estimate, "
                "not final proof."
            )

        if prediction == "real":
            return (
                f"The model predicts this content as real with "
                f"{confidence_percentage} confidence. This means the wording "
                "and patterns are similar to real news examples seen during "
                "training. This does not guarantee the article is factually "
                "correct, so important claims should still be verified."
            )

        return (
            "The model could not confidently classify this content. "
            "Please verify the information using trusted sources."
        )


fake_news_model = FakeNewsModel()