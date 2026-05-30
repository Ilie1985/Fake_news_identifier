"use client";

import { useState } from "react";
import { analyseNews, PredictionResponse } from "@/lib/api";

export default function AnalysePage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleAnalyse() {
    setError("");
    setResult(null);

    if (text.trim().length < 20) {
      setError("Please enter a longer headline or article text.");
      return;
    }

    try {
      setIsLoading(true);

      const predictionResult = await analyseNews(text);

      setResult(predictionResult);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  const predictionStyle =
    result?.prediction === "fake"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-green-200 bg-green-50 text-green-800";

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-700">
          News Analysis
        </p>

        <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">
          Analyse a headline or article
        </h1>

        <p className="mt-3 max-w-3xl leading-7 text-slate-600">
          Paste a news headline or full article below. The Python FastAPI
          backend will send the text to the trained machine-learning model and
          return a prediction.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
          <label
            htmlFor="news-text"
            className="mb-2 block font-semibold text-slate-900"
          >
            News content
          </label>

          <textarea
            id="news-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Paste a headline or article text here..."
            className="min-h-72 w-full resize-y rounded-2xl border border-slate-300 p-4 leading-7 text-slate-900 outline-none focus:border-slate-950"
          />

          <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-500">
            <span>{text.trim().length} characters</span>
            <span>Minimum recommended: 20 characters</span>
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm leading-6 text-red-700">
              {error}
            </p>
          )}

          <button
            onClick={handleAnalyse}
            disabled={isLoading}
            className="mt-5 w-full rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Analysing..." : "Analyse News"}
          </button>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 text-xl font-bold text-slate-950">
            Prediction Result
          </h2>

          {!result && (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-slate-600">
              Your prediction result will appear here after analysis.
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className={`rounded-2xl border p-5 ${predictionStyle}`}>
                <p className="text-sm font-semibold uppercase tracking-wide">
                  Prediction
                </p>
                <p className="mt-2 text-4xl font-bold capitalize">
                  {result.prediction}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Confidence
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">
                    {result.confidence_percentage}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Risk Level
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">
                    {result.risk_level}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="mb-2 font-bold text-slate-950">Explanation</p>
                <p className="leading-7 text-slate-700">
                  {result.explanation}
                </p>
              </div>

              <div className="rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                This result is generated by a machine-learning model. It should
                be used as a risk estimate, not as final proof.
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}