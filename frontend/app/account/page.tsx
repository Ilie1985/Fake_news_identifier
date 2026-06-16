"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type CheckRow = {
  prediction: string;
  confidence: number;
  created_at: string;
};

type ProfileStats = {
  totalChecks: number;
  fakePredictions: number;
  realPredictions: number;
  averageConfidence: string;
  lastAnalysisDate: string;
};

export default function AccountPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [stats, setStats] = useState<ProfileStats>({
    totalChecks: 0,
    fakePredictions: 0,
    realPredictions: 0,
    averageConfidence: "0.00%",
    lastAnalysisDate: "No analyses yet",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfileData() {
      try {
        setIsLoading(true);
        setError("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login");
          return;
        }

        setEmail(user.email ?? "");

        const { data, error: checksError } = await supabase
          .from("checks")
          .select("prediction, confidence, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (checksError) {
          setError(checksError.message);
          return;
        }

        const checks = (data ?? []) as CheckRow[];

        const totalChecks = checks.length;

        const fakePredictions = checks.filter(
          (check) => check.prediction.toLowerCase() === "fake"
        ).length;

        const realPredictions = checks.filter(
          (check) => check.prediction.toLowerCase() === "real"
        ).length;

        const averageConfidence =
          totalChecks > 0
            ? `${(
                (checks.reduce((sum, check) => sum + Number(check.confidence), 0) /
                  totalChecks) *
                100
              ).toFixed(2)}%`
            : "0.00%";

        const lastAnalysisDate =
          totalChecks > 0
            ? new Date(checks[0].created_at).toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "No analyses yet";

        setStats({
          totalChecks,
          fakePredictions,
          realPredictions,
          averageConfidence,
          lastAnalysisDate,
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadProfileData();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-slate-600">Loading profile...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-700">
          Profile
        </p>

        <h1 className="mb-4 text-4xl font-bold text-slate-950">
          Your profile
        </h1>

        <p className="mb-8 text-slate-600">
          View your account details, analysis activity, and session security
          information.
        </p>

        {error && (
          <p className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mb-8 rounded-2xl border border-slate-200 p-5">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Email
          </p>
          <p className="text-xl font-bold text-slate-950">{email}</p>
        </div>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-slate-950">
            Account activity summary
          </h2>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-2xl border border-slate-200 p-5">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Total checks
              </p>
              <p className="text-4xl font-bold text-slate-950">
                {stats.totalChecks}
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 p-5">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Fake predictions
              </p>
              <p className="text-4xl font-bold text-red-700">
                {stats.fakePredictions}
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 p-5">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Real predictions
              </p>
              <p className="text-4xl font-bold text-green-700">
                {stats.realPredictions}
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 p-5">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Average confidence
              </p>
              <p className="text-4xl font-bold text-slate-950">
                {stats.averageConfidence}
              </p>
            </article>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 p-5">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Last analysis
            </p>
            <p className="text-xl font-bold text-slate-950">
              {stats.lastAnalysisDate}
            </p>
          </div>
        </section>

        <section className="mb-8 rounded-2xl bg-amber-50 p-5 text-amber-900">
          <h2 className="mb-2 text-xl font-bold">Session security</h2>
          <p className="leading-7">
            For privacy and security, your session ends when the browser tab is
            closed. You will also be logged out automatically after 5 minutes of
            inactivity.
          </p>
        </section>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white hover:bg-slate-800"
        >
          Logout
        </button>
      </section>
    </main>
  );
}