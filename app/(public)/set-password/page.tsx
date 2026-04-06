"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MdArrowForward, MdLock, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { PageLoader } from "@/components/ui/loaders/page-loader";
import { Spinner } from "@/components/ui/loaders/spinner";
import { dismissToast, showError, showLoading, showSuccess } from "@/lib/toast";

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
      const message = "Invalid or missing link.";
      setError(message);
      showError(message);
      return;
    }

    if (password.length < 8) {
      const message = "Password must be at least 8 characters.";
      setError(message);
      showError(message);
      return;
    }

    if (password !== confirmPassword) {
      const message = "Passwords do not match.";
      setError(message);
      showError(message);
      return;
    }

    setLoading(true);
    const toastId = showLoading("Setting your password...");
    try {
      const response = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = (await response.json()) as { message?: string; redirectTo?: string };
      if (!response.ok) {
        if ((data.message || "").toLowerCase().includes("expired")) {
          const message = "This link has expired. Please contact support.";
          setError(message);
          dismissToast(toastId);
          showError(message);
        } else {
          const message = data.message || "Unable to set password.";
          setError(message);
          dismissToast(toastId);
          showError(message);
        }
        return;
      }

      const message = "Password set! Taking you to your dashboard...";
      setSuccess(message);
      dismissToast(toastId);
      showSuccess(message);
      setTimeout(() => {
        router.push(data.redirectTo || "/dashboard/hr");
      }, 900);
    } catch {
      const message = "Something went wrong. Please try again.";
      setError(message);
      dismissToast(toastId);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return <PageLoader label="Loading" message="Verifying your activation link..." />;
  }

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_45%,#ffffff_100%)] p-6 text-slate-900">
        <div className="w-full max-w-lg rounded-[2rem] border border-rose-200 bg-white p-8 shadow-xl shadow-slate-200">
          <h1 className="text-xl font-semibold text-slate-950">Invalid or missing link.</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            This password setup page needs a valid activation link from your email.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_45%,#ffffff_100%)] p-6 text-slate-900">
      <section className="w-full max-w-lg rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-xl shadow-slate-200 backdrop-blur md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600">Account Security</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Set your password</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">Create a secure password to activate your account and continue into your HR workspace.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <span className="mb-2 block text-sm font-medium text-slate-700">New Password</span>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <MdLock className="text-base" />
              </span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 transition hover:text-indigo-500"
            >
              {showPassword ? <MdVisibilityOff className="text-sm" /> : <MdVisibility className="text-sm" />}
              {showPassword ? "Hide" : "Show"} password
            </button>
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-slate-700">Confirm Password</span>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <MdLock className="text-base" />
              </span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 transition hover:text-indigo-500"
            >
              {showConfirmPassword ? <MdVisibilityOff className="text-sm" /> : <MdVisibility className="text-sm" />}
              {showConfirmPassword ? "Hide" : "Show"} password
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <Spinner className="text-white" label="Setting password" /> : <MdArrowForward className="text-base" />}
            {loading ? "Setting password..." : "Set Password & Continue"}
          </button>
        </form>

        {error ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}
      </section>
    </main>
  );
}
