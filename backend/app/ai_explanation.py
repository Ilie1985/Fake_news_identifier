import os

import requests
from dotenv import load_dotenv
from google import genai


load_dotenv()

AI_PROVIDER = os.getenv("AI_PROVIDER", "ollama").lower().strip()

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")


def generate_fallback_explanation(
    text: str,
    prediction: str,
    confidence_percentage: str,
    risk_level: str,
) -> str:
    """
    Fallback explanation used if Ollama or Gemini is unavailable.
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


def build_explanation_prompt(
    text: str,
    prediction: str,
    confidence_percentage: str,
    risk_level: str,
) -> str:
    """
    Builds one consistent prompt used by both Ollama and Gemini.
    """

    return f"""
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


def generate_ollama_explanation(
    text: str,
    prediction: str,
    confidence_percentage: str,
    risk_level: str,
) -> str:
    """
    Generates an AI explanation using local Ollama.

    This is mainly used during local development.
    """

    prompt = build_explanation_prompt(
        text=text,
        prediction=prediction,
        confidence_percentage=confidence_percentage,
        risk_level=risk_level,
    )

    response = requests.post(
        OLLAMA_URL,
        json={
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
        },
        timeout=90,
    )

    response.raise_for_status()

    data = response.json()
    explanation = data.get("response", "").strip()

    if not explanation:
        raise ValueError("Ollama returned an empty explanation.")

    return explanation


def generate_gemini_explanation(
    text: str,
    prediction: str,
    confidence_percentage: str,
    risk_level: str,
) -> str:
    """
    Generates an AI explanation using the Gemini API.

    This is mainly used for the deployed version.
    """

    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not set.")

    prompt = build_explanation_prompt(
        text=text,
        prediction=prediction,
        confidence_percentage=confidence_percentage,
        risk_level=risk_level,
    )

    client = genai.Client(api_key=GEMINI_API_KEY)

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
    )

    explanation = response.text.strip() if response.text else ""

    if not explanation:
        raise ValueError("Gemini returned an empty explanation.")

    return explanation


def generate_ai_explanation(
    text: str,
    prediction: str,
    confidence_percentage: str,
    risk_level: str,
) -> str:
    """
    Chooses the AI explanation provider based on the AI_PROVIDER environment variable.

    Local development:
    - AI_PROVIDER=ollama

    Deployed version:
    - AI_PROVIDER=gemini

    Safe fallback:
    - If the selected provider fails, return a fallback explanation.
    """

    try:
        if AI_PROVIDER == "gemini":
            return generate_gemini_explanation(
                text=text,
                prediction=prediction,
                confidence_percentage=confidence_percentage,
                risk_level=risk_level,
            )

        if AI_PROVIDER == "ollama":
            return generate_ollama_explanation(
                text=text,
                prediction=prediction,
                confidence_percentage=confidence_percentage,
                risk_level=risk_level,
            )

        return generate_fallback_explanation(
            text=text,
            prediction=prediction,
            confidence_percentage=confidence_percentage,
            risk_level=risk_level,
        )

    except Exception as error:
        print(f"AI explanation failed using provider '{AI_PROVIDER}': {error}")

        return generate_fallback_explanation(
            text=text,
            prediction=prediction,
            confidence_percentage=confidence_percentage,
            risk_level=risk_level,
        )