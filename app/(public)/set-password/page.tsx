"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function SetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Invalid or missing link.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = (await response.json()) as { message?: string; redirectTo?: string };
      if (!response.ok) {
        if ((data.message || "").toLowerCase().includes("expired")) {
          setError("This link has expired. Please contact support.");
        } else {
          setError(data.message || "Unable to set password.");
        }
        return;
      }

      setSuccess("Password set! Taking you to your dashboard...");
      setTimeout(() => {
        router.push(data.redirectTo || "/dashboard/hr");
      }, 900);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-8">
          <h1 className="text-xl font-semibold">Loading...</h1>
        </div>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-8">
          <h1 className="text-xl font-semibold">Invalid or missing link.</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-8">
        <h1 className="text-2xl font-semibold">Set your password</h1>
        <p className="mt-2 text-sm text-slate-300">Create a secure password to activate your account.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <input
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none ring-cyan-400/80 focus:ring-2"
              type={showPassword ? "text" : "password"}
              placeholder="New Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="mt-2 text-xs text-cyan-300"
            >
              {showPassword ? "Hide" : "Show"} password
            </button>
          </div>

          <div>
            <input
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none ring-cyan-400/80 focus:ring-2"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="mt-2 text-xs text-cyan-300"
            >
              {showConfirmPassword ? "Hide" : "Show"} password
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Setting password..." : "Set Password & Continue"}
          </button>
        </form>

        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
        {success ? <p className="mt-4 text-sm text-emerald-300">{success}</p> : null}
      </section>
    </main>
  );
}
