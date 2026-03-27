"use client";

import Link from "next/link";
import { useState } from "react";

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
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        setError(data.message || "Unable to create account.");
        return;
      }

      setSuccess(`Check your email! We've sent a password setup link to ${form.email}`);
      setForm(defaultState);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto grid min-h-[90vh] max-w-5xl grid-cols-1 gap-8 md:grid-cols-2 md:items-center">
        <section className="hidden rounded-3xl border border-white/10 bg-slate-900/70 p-10 md:block">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">WorkNest HRMS</p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight">
            Build your people operations on one secure platform.
          </h1>
          <p className="mt-4 text-slate-300">
            Register your company, activate your admin account, and launch your HR dashboard in minutes.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900 p-7 shadow-xl">
          <h2 className="text-2xl font-semibold">Create Account</h2>
          <p className="mt-2 text-sm text-slate-300">Start by creating your HR admin account.</p>

          {success ? (
            <div className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-emerald-200">
              {success}
            </div>
          ) : (
            <form onSubmit={submitForm} className="mt-6 space-y-4">
              <input
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none ring-cyan-400/80 focus:ring-2"
                placeholder="Full Name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
              <input
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none ring-cyan-400/80 focus:ring-2"
                placeholder="Company Name"
                value={form.companyName}
                onChange={(event) => setForm((prev) => ({ ...prev, companyName: event.target.value }))}
              />
              <input
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none ring-cyan-400/80 focus:ring-2"
                placeholder="Phone Number"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={form.phone}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, phone: event.target.value.replace(/\D/g, "") }))
                }
              />
              <input
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none ring-cyan-400/80 focus:ring-2"
                placeholder="Work Email Address"
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Creating..." : "Create Account"}
              </button>

              {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            </form>
          )}

          <p className="mt-6 text-sm text-slate-300">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-cyan-300 hover:text-cyan-200">
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
