"use client";

import { useEffect, useState } from "react";
import { analyseNews, PredictionResponse } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

type InputType = "headline" | "article" | "url";

type SavedAnalysisResult = {
  id?: string;
  user_id: string;
  input_text: string;
  input_type: InputType;
  prediction: string;
  confidence: number;
  confidence_percentage: string;
  risk_level: string;
  explanation: string;
};

export default function AnalysePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [inputType, setInputType] = useState<InputType>("article");
  const [text, setText] = useState("");

  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [savedResult, setSavedResult] = useState<SavedAnalysisResult | null>(
    null
  );

  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        window.location.href = "/login";
        return;
      }

      setUser(data.user);
      setIsCheckingAuth(false);
    }

    checkUser();
  }, []);

  async function saveResultToSupabase(
    analysisResult: Omit<SavedAnalysisResult, "id">
  ) {
    const { data, error: insertError } = await supabase
      .from("checks")
      .insert(analysisResult)
      .select()
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    return data as SavedAnalysisResult;
  }

  async function handleAnalyse() {
    setError("");
    setSaveMessage("");
    setResult(null);
    setSavedResult(null);

    const trimmedText = text.trim();

    if (!user) {
      setError("You must be logged in to analyse news.");
      return;
    }

    if (!trimmedText) {
      setError("Please enter a headline, article, or URL.");
      return;
    }

    if (inputType === "headline" && trimmedText.length < 10) {
      setError("Please enter a longer headline.");
      return;
    }

    if (inputType === "article" && trimmedText.length < 20) {
      setError("Please enter a longer article text.");
      return;
    }

    if (inputType === "url") {
      setError(
        "URL extraction will be added later. For now, please paste the article text instead."
      );
      return;
    }

    try {
      setIsLoading(true);

      const predictionResult = await analyseNews(trimmedText);

      setResult(predictionResult);

      const analysisResult: Omit<SavedAnalysisResult, "id"> = {
        user_id: user.id,
        input_text: trimmedText,
        input_type: inputType,
        prediction: predictionResult.prediction,
        confidence: predictionResult.confidence,
        confidence_percentage: predictionResult.confidence_percentage,
        risk_level: predictionResult.risk_level,
        explanation: predictionResult.explanation,
      };

      const savedData = await saveResultToSupabase(analysisResult);

      setSavedResult(savedData);
      setSaveMessage("Analysis saved to your history.");
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

  const placeholderText =
    inputType === "headline"
      ? "Paste a news headline here..."
      : inputType === "article"
      ? "Paste the full article text here..."
      : "Paste a news article URL here...";

  if (isCheckingAuth) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-slate-700">Checking login...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-700">
          News Analysis
        </p>

        <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">
          Analyse news content
        </h1>

        <p className="mt-3 max-w-3xl leading-7 text-slate-600">
          Paste a headline or article below. The Python FastAPI backend will
          send the text to the trained machine-learning model and return a
          prediction.
        </p>

        {user?.email && (
          <p className="mt-3 text-sm text-slate-500">
            Logged in as <span className="font-semibold">{user.email}</span>
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <p className="mb-3 font-semibold text-slate-900">
              What do you want to analyse?
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setInputType("headline")}
                className={`rounded-xl border px-4 py-3 font-semibold ${
                  inputType === "headline"
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-300 bg-white text-slate-700"
                }`}
              >
                Headline
              </button>

              <button
                type="button"
                onClick={() => setInputType("article")}
                className={`rounded-xl border px-4 py-3 font-semibold ${
                  inputType === "article"
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-300 bg-white text-slate-700"
                }`}
              >
                Article
              </button>

              <button
                type="button"
                onClick={() => setInputType("url")}
                className={`rounded-xl border px-4 py-3 font-semibold ${
                  inputType === "url"
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-300 bg-white text-slate-700"
                }`}
              >
                URL
              </button>
            </div>
          </div>

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
            placeholder={placeholderText}
            className="min-h-72 w-full resize-y rounded-2xl border border-slate-300 p-4 leading-7 text-slate-900 outline-none focus:border-slate-950"
          />

          <div className="mt-3 flex flex-col gap-1 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>{text.trim().length} characters</span>
            <span>
              Selected input type:{" "}
              <span className="font-semibold capitalize">{inputType}</span>
            </span>
          </div>

          {inputType === "url" && (
            <p className="mt-4 rounded-xl bg-blue-50 p-3 text-sm leading-6 text-blue-800">
              URL extraction is planned as a future improvement. For this
              version, paste the article text manually for the best result.
            </p>
          )}

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm leading-6 text-red-700">
              {error}
            </p>
          )}

          {saveMessage && (
            <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm leading-6 text-green-700">
              {saveMessage}
            </p>
          )}

          <button
            onClick={handleAnalyse}
            disabled={isLoading}
            className="mt-5 w-full rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Analysing and saving..." : "Analyse News"}
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

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Input Type
                </p>
                <p className="mt-2 text-2xl font-bold capitalize text-slate-950">
                  {inputType}
                </p>
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

              {savedResult && (
                <details className="rounded-2xl border border-slate-200 p-4">
                  <summary className="cursor-pointer font-semibold text-slate-900">
                    Saved result preview
                  </summary>

                  <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs text-white">
                    {JSON.stringify(savedResult, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}