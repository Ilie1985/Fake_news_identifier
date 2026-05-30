import os

import requests
from dotenv import load_dotenv


load_dotenv()

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")


def generate_fallback_explanation(
    text: str,
    prediction: str,
    confidence_percentage: str,
    risk_level: str
) -> str:
    """
    Fallback explanation used if Ollama is not running or fails.
    """

    if prediction == "fake":
        return (
            f"The model predicts this content as fake with {confidence_percentage} confidence. "
            "This means the wording and patterns are similar to fake news examples seen during training. "
            "The result should be treated as a risk estimate, not final proof. "
            "Please verify the claim using trusted sources before sharing it."
        )

    if prediction == "real":
        return (
            f"The model predicts this content as real with {confidence_percentage} confidence. "
            "This means the wording and patterns are similar to real news examples seen during training. "
            "This does not guarantee the article is factually correct. "
            "Important claims should still be verified using reliable sources."
        )

    return (
        "The model could not confidently classify this content. "
        "Please verify the information using trusted sources."
    )


def generate_ai_explanation(
    text: str,
    prediction: str,
    confidence_percentage: str,
    risk_level: str
) -> str:
    """
    Uses a local Ollama model to generate a user-friendly AI explanation.

    This keeps the AI part free and local during development.
    """

    prompt = f"""
You are explaining a fake news detection result to a non-technical user.

The machine-learning model analysed this news content:

\"\"\"
{text[:2000]}
\"\"\"

Model result:
- Prediction: {prediction}
- Confidence: {confidence_percentage}
- Risk level: {risk_level}

Write a concise explanation in plain English.

Rules:
- Do not say the article is definitely true or definitely false.
- Explain that this is a machine-learning risk estimate.
- Mention possible reasons the content may look risky or reliable.
- Give 2 practical verification steps.
- Keep it under 150 words.
- Use a responsible and neutral tone.
"""

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False
            },
            timeout=90
        )

        response.raise_for_status()

        data = response.json()
        explanation = data.get("response", "").strip()

        if not explanation:
            return generate_fallback_explanation(
                text=text,
                prediction=prediction,
                confidence_percentage=confidence_percentage,
                risk_level=risk_level
            )

        return explanation

    except Exception as error:
        print(f"Ollama explanation failed: {error}")

        return generate_fallback_explanation(
            text=text,
            prediction=prediction,
            confidence_percentage=confidence_percentage,
            risk_level=risk_level
        )