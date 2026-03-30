"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MdArrowForward, MdEmail, MdLock } from "react-icons/md";
import { Spinner } from "@/components/ui/loaders/spinner";
import { dismissToast, showError, showLoading, showSuccess } from "@/lib/toast";

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
    const toastId = showLoading("Signing you in...");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as { message?: string; redirectTo?: string };

      if (!response.ok) {
        const message = data.message || "Unable to login.";
        setError(message);
        dismissToast(toastId);
        showError(message);
        return;
      }

      dismissToast(toastId);
      showSuccess("Signed in successfully.");
      router.push(data.redirectTo || "/dashboard/hr");
    } catch {
      const message = "Something went wrong. Please try again.";
      setError(message);
      dismissToast(toastId);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_45%,#ffffff_100%)] px-6 py-10 text-slate-900">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-500 p-10 text-white shadow-2xl shadow-indigo-200 lg:block">
          <p className="inline-flex rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-blue-50">
            Welcome Back
          </p>
          <h1 className="mt-8 text-4xl font-semibold leading-tight">
            Manage people operations from one polished control center.
          </h1>
          <p className="mt-5 max-w-md text-base leading-8 text-blue-50/90">
            Sign in to access attendance, company settings, and HR workflows from a premium workspace designed for modern teams.
          </p>
          <div className="mt-12 grid gap-4">
            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-blue-100">HR Workspace</p>
              <p className="mt-2 text-xl font-semibold">Structured dashboards and company-ready workflows</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
                <p className="text-sm text-blue-100">Secure</p>
                <p className="mt-2 text-2xl font-semibold">Access</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
                <p className="text-sm text-blue-100">Fast</p>
                <p className="mt-2 text-2xl font-semibold">Setup</p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-xl shadow-slate-200 backdrop-blur md:p-10">
          <div className="mx-auto max-w-md">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600">Sign In</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Sign in to WorkNest</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">Manage your HR operations from a clean dashboard built for day-to-day execution.</p>

            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Work Email</span>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <MdEmail className="text-base" />
                  </span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <MdLock className="text-base" />
                  </span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
              </label>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Secure access for your HR admin workspace</span>
                <span className="font-medium text-indigo-600">Password help via setup link</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? <Spinner className="text-white" label="Signing in" /> : <MdArrowForward className="text-base" />}
                {loading ? "Signing in..." : "Sign In"}
              </button>

              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}
            </form>

            <p className="mt-8 text-sm text-slate-600">
              Need an account?{" "}
              <Link href="/register" className="font-semibold text-indigo-600 transition hover:text-indigo-500">
                Register
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
