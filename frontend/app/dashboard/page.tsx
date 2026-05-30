"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        window.location.href = "/login";
        return;
      }

      setUser(data.user);
      setIsLoading(false);
    }

    loadUser();
  }, []);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p>Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-700">
          Dashboard
        </p>

        <h1 className="mb-4 text-3xl font-bold text-slate-950">
          Welcome to your dashboard
        </h1>

        <p className="leading-7 text-slate-700">
          You are logged in as{" "}
          <span className="font-semibold">{user?.email}</span>.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Total checks</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">0</p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Fake predictions</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">0</p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Real predictions</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">0</p>
          </div>
        </div>
      </section>
    </main>
  );
}