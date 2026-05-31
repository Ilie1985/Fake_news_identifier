"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

type ChartItem = {
  name: string;
  value: number;
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checks, setChecks] = useState<CheckRecord[]>([]);

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoadingChecks, setIsLoadingChecks] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkUserAndLoadDashboard() {
      setError("");

      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        window.location.href = "/login";
        return;
      }

      setUser(data.user);
      setIsCheckingAuth(false);

      await loadDashboardData();
    }

    checkUserAndLoadDashboard();
  }, []);

  async function loadDashboardData() {
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
        setError("Could not load dashboard data.");
      }
    } finally {
      setIsLoadingChecks(false);
    }
  }

  const totalChecks = checks.length;

  const fakeCount = checks.filter((check) => check.prediction === "fake").length;
  const realCount = checks.filter((check) => check.prediction === "real").length;

  const averageConfidence =
    totalChecks === 0
      ? 0
      : checks.reduce((sum, check) => sum + Number(check.confidence), 0) /
        totalChecks;

  const predictionDistribution: ChartItem[] = useMemo(() => {
    return [
      {
        name: "Fake",
        value: fakeCount,
      },
      {
        name: "Real",
        value: realCount,
      },
    ];
  }, [fakeCount, realCount]);

  const riskDistribution: ChartItem[] = useMemo(() => {
    const riskCounts = checks.reduce<Record<string, number>>((acc, check) => {
      const key = check.risk_level || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(riskCounts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [checks]);

  const inputTypeDistribution: ChartItem[] = useMemo(() => {
    const inputCounts = checks.reduce<Record<string, number>>((acc, check) => {
      const key = check.input_type || "unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(inputCounts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [checks]);

  const recentChecks = checks.slice(0, 5);

  function formatDate(dateValue: string) {
    return new Date(dateValue).toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
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
          Dashboard
        </p>

        <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">
          Your analysis dashboard
        </h1>

        <p className="mt-3 max-w-3xl leading-7 text-slate-600">
          View a summary of your fake news checks, prediction patterns,
          confidence levels, and recent analyses.
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

      {isLoadingChecks && (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-slate-700">Loading dashboard data...</p>
        </section>
      )}

      {!isLoadingChecks && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Total checks
              </p>
              <p className="mt-2 text-4xl font-bold text-slate-950">
                {totalChecks}
              </p>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Fake predictions
              </p>
              <p className="mt-2 text-4xl font-bold text-red-700">
                {fakeCount}
              </p>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Real predictions
              </p>
              <p className="mt-2 text-4xl font-bold text-green-700">
                {realCount}
              </p>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Average confidence
              </p>
              <p className="mt-2 text-4xl font-bold text-slate-950">
                {(averageConfidence * 100).toFixed(2)}%
              </p>
            </div>
          </section>

          {totalChecks === 0 && (
            <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="mb-2 text-xl font-bold text-slate-950">
                No dashboard data yet
              </h2>
              <p className="leading-7 text-slate-600">
                Analyse a headline or article first. Your results will then
                appear here as dashboard statistics and charts.
              </p>
            </section>
          )}

          {totalChecks > 0 && (
            <>
              <section className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="mb-4 text-xl font-bold text-slate-950">
                    Prediction distribution
                  </h2>

                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={predictionDistribution}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={110}
                          label
                        >
                          {predictionDistribution.map((entry) => (
                            <Cell key={entry.name} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    This chart shows how many of your saved analyses were
                    predicted as fake or real.
                  </p>
                </div>

                <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="mb-4 text-xl font-bold text-slate-950">
                    Risk level distribution
                  </h2>

                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={riskDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    This chart shows how often your saved analyses were marked
                    as low, medium, high, or uncertain risk.
                  </p>
                </div>
              </section>

              <section className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="mb-4 text-xl font-bold text-slate-950">
                    Input type distribution
                  </h2>

                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={inputTypeDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    This chart shows whether your saved checks were submitted as
                    headlines, articles, or URLs.
                  </p>
                </div>

                <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="mb-4 text-xl font-bold text-slate-950">
                    Recent analyses
                  </h2>

                  <div className="space-y-3">
                    {recentChecks.map((check) => (
                      <article
                        key={check.id}
                        className="rounded-2xl border border-slate-200 p-4"
                      >
                        <div className="mb-2 flex flex-wrap gap-2">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold capitalize text-slate-700">
                            {check.prediction}
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                            {check.confidence_percentage}
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                            {check.risk_level}
                          </span>
                        </div>

                        <p className="line-clamp-2 font-semibold text-slate-950">
                          {check.input_text}
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                          {formatDate(check.created_at)}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            </>
          )}
        </>
      )}
    </main>
  );
}