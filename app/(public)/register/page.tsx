"use client";

import Link from "next/link";
import { useState } from "react";
import { MdArrowForward, MdBusiness, MdEmail, MdPerson, MdPhone } from "react-icons/md";
import { Spinner } from "@/components/ui/loaders/spinner";
import { dismissToast, showError, showLoading, showSuccess } from "@/lib/toast";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ROUTES } from "@/lib/constants";

type FormState = {
  name: string;
  companyName: string;
  phone: string;
  email: string;
};

const defaultState: FormState = {
  name: "",
  companyName: "",
  phone: "",
  email: "",
};

export default function RegisterPage() {
  const [form, setForm] = useState<FormState>(defaultState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validate = () => {
    if (!form.name || !form.companyName || !form.phone || !form.email) {
      return "All fields are required.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      return "Enter a valid work email address.";
    }

    if (!/^\d{10}$/.test(form.phone)) {
      return "Phone number must be exactly 10 digits.";
    }

    return "";
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      showError(validationError);
      return;
    }

    setLoading(true);
    const toastId = showLoading("Creating your account...");
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        const message = data.message || "Unable to create account.";
        setError(message);
        dismissToast(toastId);
        showError(message);
        return;
      }

      const message = `Check your email! We've sent a password setup link to ${form.email}`;
      setSuccess(message);
      setForm(defaultState);
      dismissToast(toastId);
      showSuccess(message);
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
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_45%,#ffffff_100%)] dark:bg-[linear-gradient(180deg,#0f172a_0%,#1e293b_50%,#0f172a_100%)] px-6 py-10 text-slate-900 dark:text-slate-100">
      <header className="mx-auto flex max-w-7xl items-center justify-between pb-6">
        <Link href="/" className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
          WorkNest
        </Link>
        <ThemeToggle />
      </header>
      <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <section className="hidden overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-500 p-10 text-white shadow-2xl shadow-indigo-200 dark:shadow-indigo-900 lg:block">
          <p className="inline-flex rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-blue-50">
            WorkNest HRMS
          </p>
          <h1 className="mt-8 text-4xl font-semibold leading-tight">
            Create your HR admin workspace with a premium onboarding experience.
          </h1>
          <p className="mt-5 max-w-md text-base leading-8 text-blue-50/90">
            Register your organization, activate your account securely, and start managing people operations with a clean modern interface.
          </p>
          <div className="mt-12 space-y-4">
            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-blue-100">Fast setup</p>
              <p className="mt-2 text-xl font-semibold">Get started in minutes</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-blue-100">Built for scale</p>
              <p className="mt-2 text-xl font-semibold">Ready for branches, settings, and growth</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-xl shadow-slate-200 backdrop-blur dark:border-slate-700/50 dark:bg-slate-800/90 dark:shadow-indigo-900/20 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600 dark:text-indigo-400">Create Account</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Start your HR admin account</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400">
            Begin with your company and admin details. Your password setup link will be sent to the registered work email.
          </p>

          {success ? (
            <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-700 shadow-sm dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
              {success}
            </div>
          ) : (
            <form onSubmit={submitForm} className="mt-8 space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                      <MdPerson className="text-base" />
                    </span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
                      placeholder="Full Name"
                      value={form.name}
                      onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Company Name</span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                      <MdBusiness className="text-base" />
                    </span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
                      placeholder="Company Name"
                      value={form.companyName}
                      onChange={(event) => setForm((prev) => ({ ...prev, companyName: event.target.value }))}
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                      <MdPhone className="text-base" />
                    </span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
                      placeholder="Phone Number"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={form.phone}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, phone: event.target.value.replace(/\D/g, "") }))
                      }
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Work Email Address</span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                      <MdEmail className="text-base" />
                    </span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
                      placeholder="Work Email Address"
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                    />
                  </div>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? <Spinner className="text-white" label="Creating account" /> : <MdArrowForward className="text-base" />}
                {loading ? "Creating..." : "Create Account"}
              </button>

              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-400">
                  {error}
                </div>
              ) : null}
            </form>
          )}

          <p className="mt-8 text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{" "}
            <Link href={ROUTES.PUBLIC.LOGIN} className="font-semibold text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-400">
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
