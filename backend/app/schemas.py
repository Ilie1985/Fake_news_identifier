from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    """
    Request body expected by the prediction endpoint.
    """

    text: str = Field(
        ...,
        min_length=10,
        description="News headline or article text to analyse"
    )


class PredictionResponse(BaseModel):
    """
    Response returned by the prediction endpoint.
    """

    prediction: str
    confidence: float
    confidence_percentage: str
    risk_level: str
    explanation: str