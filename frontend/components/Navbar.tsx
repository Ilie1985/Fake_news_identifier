"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            onClick={closeMenu}
            className="text-xl font-bold text-slate-950 sm:text-2xl"
          >
            FakeNews AI
          </Link>

          <button
            type="button"
            onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 sm:hidden"
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? "Close" : "Menu"}
          </button>

          <div className="hidden items-center gap-4 text-sm font-medium text-slate-700 sm:flex">
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
                  className="rounded-xl bg-slate-950 px-4 py-2 text-white hover:bg-slate-800"
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
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl bg-slate-950 px-4 py-2 text-white hover:bg-slate-800"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>

        {isMenuOpen && (
          <div className="mt-4 grid gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-700 shadow-sm sm:hidden">
            <Link
              href="/"
              onClick={closeMenu}
              className="rounded-xl px-3 py-2 hover:bg-slate-50"
            >
              Home
            </Link>

            <Link
              href="/analyse"
              onClick={closeMenu}
              className="rounded-xl px-3 py-2 hover:bg-slate-50"
            >
              Analyse News
            </Link>

            <Link
              href="/dashboard"
              onClick={closeMenu}
              className="rounded-xl px-3 py-2 hover:bg-slate-50"
            >
              Dashboard
            </Link>

            <Link
              href="/history"
              onClick={closeMenu}
              className="rounded-xl px-3 py-2 hover:bg-slate-50"
            >
              History
            </Link>

            <Link
              href="/ml-insights"
              onClick={closeMenu}
              className="rounded-xl px-3 py-2 hover:bg-slate-50"
            >
              ML Insights
            </Link>

            {!user && (
              <>
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="rounded-xl px-3 py-2 hover:bg-slate-50"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  onClick={closeMenu}
                  className="rounded-xl bg-slate-950 px-3 py-2 text-center text-white hover:bg-slate-800"
                >
                  Register
                </Link>
              </>
            )}

            {user && (
              <>
                <Link
                  href="/account"
                  onClick={closeMenu}
                  className="rounded-xl px-3 py-2 hover:bg-slate-50"
                >
                  Account
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl bg-slate-950 px-3 py-2 text-white hover:bg-slate-800"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}