"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

type CheckRecord = {
  id: string;
  user_id: string;
  input_text: string;
  input_type: "headline" | "article" | "url";
  prediction: string;
  confidence: number;
  confidence_percentage: string;
  risk_level: string;
  explanation: string;
  created_at: string;
};

export default function HistoryPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checks, setChecks] = useState<CheckRecord[]>([]);

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoadingChecks, setIsLoadingChecks] = useState(false);

  const [error, setError] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");

  useEffect(() => {
    async function checkUserAndLoadHistory() {
      setError("");

      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        window.location.href = "/login";
        return;
      }

      setUser(data.user);
      setIsCheckingAuth(false);

      await loadHistory();
    }

    checkUserAndLoadHistory();
  }, []);

  async function loadHistory() {
    try {
      setIsLoadingChecks(true);

      const { data, error: fetchError } = await supabase
        .from("checks")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setChecks((data || []) as CheckRecord[]);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Could not load history.");
      }
    } finally {
      setIsLoadingChecks(false);
    }
  }

  async function handleDelete(checkId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this saved analysis?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setDeleteMessage("");

      const { error: deleteError } = await supabase
        .from("checks")
        .delete()
        .eq("id", checkId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      setChecks((currentChecks) =>
        currentChecks.filter((check) => check.id !== checkId)
      );

      setDeleteMessage("Saved analysis deleted.");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Could not delete this analysis.");
      }
    }
  }

  function formatDate(dateValue: string) {
    return new Date(dateValue).toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function getPredictionStyle(prediction: string) {
    if (prediction === "fake") {
      return "bg-red-50 text-red-800 border-red-200";
    }

    return "bg-green-50 text-green-800 border-green-200";
  }

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
          History
        </p>

        <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">
          Your saved analyses
        </h1>

        <p className="mt-3 max-w-3xl leading-7 text-slate-600">
          View your previous fake news checks, including predictions,
          confidence scores, risk levels, and AI explanations.
        </p>

        {user?.email && (
          <p className="mt-3 text-sm text-slate-500">
            Logged in as <span className="font-semibold">{user.email}</span>
          </p>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-700">
          {error}
        </p>
      )}

      {deleteMessage && (
        <p className="mb-4 rounded-xl bg-green-50 p-4 text-sm leading-6 text-green-700">
          {deleteMessage}
        </p>
      )}

      {isLoadingChecks && (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-slate-700">Loading saved analyses...</p>
        </section>
      )}

      {!isLoadingChecks && checks.length === 0 && (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-xl font-bold text-slate-950">
            No saved analyses yet
          </h2>
          <p className="leading-7 text-slate-600">
            Once you analyse a headline or article, your saved results will
            appear here.
          </p>
        </section>
      )}

      {!isLoadingChecks && checks.length > 0 && (
        <section className="space-y-4">
          {checks.map((check) => (
            <article
              key={check.id}
              className="rounded-3xl bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-sm font-semibold capitalize ${getPredictionStyle(
                        check.prediction
                      )}`}
                    >
                      {check.prediction}
                    </span>

                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold capitalize text-slate-700">
                      {check.input_type}
                    </span>

                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-700">
                      Confidence: {check.confidence_percentage}
                    </span>

                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-700">
                      Risk: {check.risk_level}
                    </span>
                  </div>

                  <h2 className="mb-2 text-lg font-bold text-slate-950">
                    {check.input_text.length > 120
                      ? `${check.input_text.slice(0, 120)}...`
                      : check.input_text}
                  </h2>

                  <p className="text-sm text-slate-500">
                    Analysed on {formatDate(check.created_at)}
                  </p>
                </div>

                <button
                  onClick={() => handleDelete(check.id)}
                  className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>

              <details className="mt-5 rounded-2xl border border-slate-200 p-4">
                <summary className="cursor-pointer font-semibold text-slate-950">
                  View full result
                </summary>

                <div className="mt-4 space-y-4">
                  <div>
                    <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Submitted text
                    </p>
                    <p className="rounded-xl bg-slate-50 p-4 leading-7 text-slate-700">
                      {check.input_text}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                      AI explanation
                    </p>
                    <p className="rounded-xl bg-slate-50 p-4 leading-7 text-slate-700">
                      {check.explanation}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-sm text-slate-500">Prediction</p>
                      <p className="mt-1 text-xl font-bold capitalize text-slate-950">
                        {check.prediction}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-sm text-slate-500">Confidence</p>
                      <p className="mt-1 text-xl font-bold text-slate-950">
                        {check.confidence_percentage}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-sm text-slate-500">Risk level</p>
                      <p className="mt-1 text-xl font-bold text-slate-950">
                        {check.risk_level}
                      </p>
                    </div>
                  </div>
                </div>
              </details>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}