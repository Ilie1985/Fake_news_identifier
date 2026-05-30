"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }

    try {
      setIsLoading(true);

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      setMessage(
        "Account created. Please check your email to confirm your account, then log in."
      );
      setEmail("");
      setPassword("");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-700">
          Create account
        </p>

        <h1 className="mb-6 text-3xl font-bold text-slate-950">
          Register
        </h1>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="mb-2 block font-semibold text-slate-900">
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-slate-950"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-2 block font-semibold text-slate-900">
              Password
            </label>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-slate-950"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 6 characters"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {message && (
            <p className="rounded-xl bg-green-50 p-3 text-sm text-green-700">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {isLoading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-blue-700">
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}