"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    }

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="text-xl font-bold text-slate-950">
          FakeNews AI
        </Link>

        <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-700">
          <Link href="/" className="hover:text-slate-950">
            Home
          </Link>

          <Link href="/analyse" className="hover:text-slate-950">
            Analyse News
          </Link>

          <Link href="/dashboard" className="hover:text-slate-950">
            Dashboard
          </Link>

          <Link href="/history" className="hover:text-slate-950">
            History
          </Link>

          <Link href="/ml-insights" className="hover:text-slate-950">
            ML Insights
          </Link>

          {!user && (
            <>
              <Link href="/login" className="hover:text-slate-950">
                Login
              </Link>

              <Link
                href="/register"
                className="rounded-lg bg-slate-950 px-3 py-2 text-white hover:bg-slate-800"
              >
                Register
              </Link>
            </>
          )}

          {user && (
            <>
              <Link href="/account" className="hover:text-slate-950">
                Account
              </Link>

              <button
                onClick={handleLogout}
                className="rounded-lg bg-slate-950 px-3 py-2 text-white hover:bg-slate-800"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}