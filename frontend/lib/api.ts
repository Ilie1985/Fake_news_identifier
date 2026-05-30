export type PredictionResponse = {
  prediction: string;
  confidence: number;
  confidence_percentage: string;
  risk_level: string;
  explanation: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function analyseNews(text: string): Promise<PredictionResponse> {
  const response = await fetch(`${API_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.detail || "The prediction request failed. Please try again."
    );
  }

  return response.json();
}