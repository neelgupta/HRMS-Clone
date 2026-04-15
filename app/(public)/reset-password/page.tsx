"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MdArrowForward, MdLock, MdVisibility, MdVisibilityOff, MdEmail } from "react-icons/md";
import { Spinner } from "@/components/ui/loaders/spinner";
import { dismissToast, showError, showLoading, showSuccess } from "@/lib/toast";
import { API_ENDPOINTS } from "@/lib/constants";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "password">("email");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.AUTH.RESET_PASSWORD_INIT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to initiate password reset.");
        showError(data.message || "Failed to initiate password reset.");
        return;
      }

      if (data.needsPasswordSetup === false) {
        setError(data.message || "Account is already active. Please use login page.");
        showError(data.message || "Account is already active. Please use login page.");
        setLoading(false);
        return;
      }

      setToken(data.token || "");
      setStep("password");
      showSuccess("Account found! Please set your new password.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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
      const response = await fetch(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        dismissToast(toastId);
        setError(data.message || "Failed to set password.");
        showError(data.message || "Failed to set password.");
        return;
      }

      dismissToast(toastId);
      showSuccess("Password set successfully! You can now login.");
      router.push("/login");
    } catch {
      dismissToast(toastId);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_45%,#ffffff_100%)] px-6 py-10 text-slate-900">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-500 p-10 text-white shadow-2xl shadow-indigo-200 lg:block">
          <p className="inline-flex rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-blue-50">
            Password Reset
          </p>
          <h1 className="mt-8 text-4xl font-semibold leading-tight">
            Set up your account password to access the HRMS system.
          </h1>
          <p className="mt-5 max-w-md text-base leading-8 text-blue-50/90">
            Enter your work email to receive instructions for setting up your password. Contact HR if you need assistance.
          </p>
        </section>

        <section className="w-full rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-xl shadow-slate-200 backdrop-blur md:p-10">
          <div className="mx-auto max-w-md">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600">
              {step === "email" ? "Reset Password" : "New Password"}
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              {step === "email" ? "Enter your email" : "Set your password"}
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {step === "email"
                ? "Enter your registered work email to reset your password."
                : "Create a strong password for your account."}
            </p>

            {step === "email" ? (
              <form onSubmit={handleEmailSubmit} className="mt-8 space-y-5">
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
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? <Spinner className="text-white" label="Sending" /> : <MdArrowForward className="text-base" />}
                  {loading ? "Sending..." : "Continue"}
                </button>

                {error && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                )}
              </form>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="mt-8 space-y-5">
                <p className="text-sm text-slate-600">
                  Setting password for: <strong>{email}</strong>
                </p>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">New Password</span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <MdLock className="text-base" />
                    </span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 py-3.5 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <MdVisibilityOff className="text-base" /> : <MdVisibility className="text-base" />}
                    </button>
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Confirm Password</span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <MdLock className="text-base" />
                    </span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? <Spinner className="text-white" label="Setting" /> : <MdArrowForward className="text-base" />}
                  {loading ? "Setting..." : "Set Password"}
                </button>

                {error && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                )}
              </form>
            )}

            <p className="mt-8 text-sm text-slate-600">
              Remember your password?{" "}
              <a href="/login" className="font-semibold text-indigo-600 transition hover:text-indigo-500">
                Sign in
              </a>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
