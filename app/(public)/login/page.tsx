"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as { message?: string; redirectTo?: string };

      if (!response.ok) {
        setError(data.message || "Unable to login.");
        return;
      }

      router.push(data.redirectTo || "/dashboard/hr");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-8">
        <h1 className="text-2xl font-semibold">Sign in to WorkNest</h1>
        <p className="mt-2 text-sm text-slate-300">Manage your HR operations from your dashboard.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none ring-cyan-400/80 focus:ring-2"
            type="email"
            placeholder="Work Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none ring-cyan-400/80 focus:ring-2"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        </form>

        <p className="mt-6 text-sm text-slate-300">
          Need an account?{" "}
          <Link href="/register" className="font-semibold text-cyan-300 hover:text-cyan-200">
            Register
          </Link>
        </p>
      </section>
    </main>
  );
}
