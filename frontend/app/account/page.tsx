"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

export default function AccountPage() {
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

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p>Loading account...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-700">
          Account
        </p>

        <h1 className="mb-6 text-3xl font-bold text-slate-950">
          Your account
        </h1>

        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Email
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-950">
            {user?.email}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="mt-6 rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800"
        >
          Logout
        </button>
      </section>
    </main>
  );
}