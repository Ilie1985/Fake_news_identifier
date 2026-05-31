export type PredictionResponse = {
  prediction: string;
  confidence: number;
  confidence_percentage: string;
  risk_level: string;
  explanation: string;
};

export type ModelMetrics = {
  dataset_rows_after_cleaning: number;
  training_rows: number;
  testing_rows: number;
  labels: string[];
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  confusion_matrix: number[][];
  classification_report: Record<string, unknown>;
};

export type FeatureWord = {
  word: string;
  coefficient: number;
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

export async function getModelMetrics(): Promise<ModelMetrics> {
  const response = await fetch(`${API_URL}/model/metrics`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.detail || "Could not load model metrics."
    );
  }

  return response.json();
}

export async function getTopFakeWords(): Promise<FeatureWord[]> {
  const response = await fetch(`${API_URL}/model/top-fake-words`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.detail || "Could not load top fake words."
    );
  }

  return response.json();
}

export async function getTopRealWords(): Promise<FeatureWord[]> {
  const response = await fetch(`${API_URL}/model/top-real-words`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.detail || "Could not load top real words."
    );
  }

  return response.json();
}