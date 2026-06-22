import os

import requests
from dotenv import load_dotenv
from google import genai


load_dotenv()

AI_PROVIDER = os.getenv("AI_PROVIDER", "gemini").lower().strip()

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
    This explanation is intentionally simple and user-friendly.
    """

    prediction_lower = prediction.lower()

    if prediction_lower == "fake":
        return (
            f"The machine-learning model thinks this content is likely fake with "
            f"{confidence_percentage} confidence. This does not mean the claim is definitely false. "
            "It means the wording looks similar to fake-news examples the model saw during training. "
            "The model may be reacting to vague wording, unusual claims, emotional language, or a lack of clear source details. "
            "Please check reliable sources before trusting or sharing the information."
        )

    if prediction_lower == "real":
        return (
            f"The machine-learning model thinks this content is likely real with "
            f"{confidence_percentage} confidence. This does not prove the claim is true. "
            "It means the wording looks more similar to real-news examples the model saw during training. "
            "The content may use a more neutral tone, clearer wording, or a more standard news style. "
            "Important claims should still be checked using trusted sources."
        )

    return (
        "The machine-learning model is uncertain about this content. "
        "The wording does not clearly match the fake or real examples it learned from. "
        "Please verify the information using reliable sources."
    )


def build_explanation_prompt(
    text: str,
    prediction: str,
    confidence_percentage: str,
    risk_level: str,
) -> str:
    """
    Builds one consistent prompt used by both Ollama and Gemini.

    The explanation should focus on why the machine-learning model may have
    made the prediction, not on claiming that the article is definitely true or false.
    """

    return f"""
You are explaining the result of a fake news detection machine-learning model to a non-technical user.

The user submitted this news content:

\"\"\"
{text[:2000]}
\"\"\"

The machine-learning model returned:
- Prediction: {prediction}
- Confidence: {confidence_percentage}
- Risk level: {risk_level}

Write a friendly, human explanation.

Important context:
- The prediction comes from a scikit-learn machine-learning model.
- The model uses TF-IDF word patterns and Logistic Regression.
- The model does not fact-check the news against the internet.
- The model does not know for certain whether the claim is true or false.
- It compares the wording with fake and real news examples seen during training.

Your explanation must:
1. Start by clearly saying what the model thinks.
2. Explain why the model may have reached that result based on wording patterns.
3. Mention specific words or phrases from the submitted text that may have influenced the result.
4. Explain the confidence score in simple language.
5. Remind the user that this is a risk estimate, not final proof.
6. Give 2 simple verification steps.

Style rules:
- Use plain English.
- Be natural and human-friendly.
- Do not sound too technical.
- Do not say the article is definitely fake or definitely real.
- Do not overstate the result.
- Keep it between 100 and 160 words.
- Avoid bullet points unless they make the explanation clearer.
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
    - AI_PROVIDER=ollama or AI_PROVIDER=gemini

    Deployed version:
    - AI_PROVIDER=gemini

    Safe fallback:
    - If the selected provider fails, return a simple fallback explanation.
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