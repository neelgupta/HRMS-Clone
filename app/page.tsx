"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function HomePage() {
  const features = [
    {
      title: "Centralized Employee Records",
      description: "Keep employee profiles, onboarding data, and organizational structure aligned in one secure workspace.",
      icon: "◫",
    },
    {
      title: "Attendance & Leave Visibility",
      description: "Bring attendance tracking, leave workflows, and manager approvals into a single polished experience.",
      icon: "◎",
    },
    {
      title: "Configuration That Scales",
      description: "Set up branches, company settings, and HR foundations built for growing teams and multi-location operations.",
      icon: "△",
    },
  ];

  const steps = [
    "Register your company and create the HR admin account.",
    "Activate access securely using the password setup link.",
    "Launch your HR workspace and manage operations from one dashboard.",
  ];

  const plans = [
    {
      name: "Starter",
      price: "₹999",
      subtitle: "For lean teams getting HR processes online.",
      highlight: "",
    },
    {
      name: "Growth",
      price: "₹2,499",
      subtitle: "For scaling companies managing multiple workflows.",
      highlight: "ring-2 ring-indigo-100 border-indigo-300",
    },
    {
      name: "Enterprise",
      price: "Custom",
      subtitle: "For larger organizations needing tailored support.",
      highlight: "",
    },
  ];

  const testimonials = [
    {
      quote: "WorkNest gave us a cleaner setup experience than most HR tools we evaluated.",
      author: "Ananya Sharma",
      role: "HR Lead, NovaGrid",
    },
    {
      quote: "The product feels premium from the first screen and the company setup flow is genuinely easy to use.",
      author: "Rahul Mehta",
      role: "Operations Head, TalentBridge",
    },
  ];

  return (
    <main className="overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_38%,#eef4ff_100%)] dark:bg-[linear-gradient(180deg,#0f172a_0%,#1e293b_50%,#0f172a_100%)] text-slate-900 dark:text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.18),transparent_32%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.15),transparent_34%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.15),transparent_32%)]" />

      <header className="relative">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
          <Link href="/" className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
            WorkNest
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              Start Free
            </Link>
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-6 pb-24 pt-14 lg:px-8 lg:pb-28 lg:pt-20">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="inline-flex rounded-full border border-indigo-200 bg-white/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-indigo-700 shadow-sm dark:border-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
              Premium HRMS SaaS
            </p>
            <h1 className="mt-7 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-tight text-slate-950 dark:text-white md:text-6xl">
              Build a smarter people operations system for every team.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-400">
              Register your organization, activate your admin workspace, and run HR operations from a modern platform built for clarity, structure, and growth.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-500 px-7 py-4 text-base font-semibold text-white shadow-xl shadow-indigo-200 dark:shadow-indigo-900 transition hover:-translate-y-0.5 hover:shadow-2xl"
              >
                Create Your Workspace
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-7 py-4 text-base font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Sign In
              </Link>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-lg shadow-slate-100 dark:border-slate-700/50 dark:bg-slate-800/85 dark:shadow-none">
                <p className="text-2xl font-semibold text-slate-950 dark:text-white">10 min</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Average workspace setup</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-lg shadow-slate-100 dark:border-slate-700/50 dark:bg-slate-800/85 dark:shadow-none">
                <p className="text-2xl font-semibold text-slate-950 dark:text-white">Multi-branch</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ready for growing companies</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-lg shadow-slate-100 dark:border-slate-700/50 dark:bg-slate-800/85 dark:shadow-none">
                <p className="text-2xl font-semibold text-slate-950 dark:text-white">Secure</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Admin-first onboarding flow</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-blue-200/60 via-indigo-100/50 to-purple-200/50 blur-2xl dark:from-blue-900/40 dark:via-indigo-900/30 dark:to-purple-900/40" />
            <div className="relative rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-2xl shadow-slate-200 dark:border-slate-700/50 dark:bg-slate-800/90 dark:shadow-none">
              <div className="rounded-[1.75rem] bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-900 p-6 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-blue-100">WorkNest Command Center</p>
                    <h2 className="mt-2 text-2xl font-semibold">Everything organized from day one</h2>
                  </div>
                  <span className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium text-blue-50">Live</span>
                </div>

                <div className="mt-8 space-y-4">
                  <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
                    <p className="text-sm text-blue-100">Company Setu 2p</p>
                    <p className="mt-2 text-xl font-semibold">Branches, settings, and operations in one flow</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
                      <p className="text-sm text-blue-100">Attendance Ready</p>
                      <p className="mt-2 text-3xl font-semibold">98%</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
                      <p className="text-sm text-blue-100">Admin Setup</p>
                      <p className="mt-2 text-3xl font-semibold">Fast</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-700/50">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Attendance</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">Daily visibility across every team</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-700/50">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Company Config</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">Structured settings for payroll-ready ops</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-indigo-600 dark:text-indigo-400">Features</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white md:text-4xl">
            Designed for teams that want structure without complexity
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-400">
            Give HR teams one elegant system for onboarding, settings, attendance, and organizational control.
          </p>
        </div>
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg shadow-slate-100 transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800 dark:shadow-none dark:hover:border-slate-600"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-500 text-xl font-semibold text-white">
                {feature.icon}
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-950 dark:text-white">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white/70 dark:border-slate-700 dark:bg-slate-900/50">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-indigo-600 dark:text-indigo-400">How It Works</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white md:text-4xl">
              From signup to HR operations in three simple steps
            </h2>
          </div>
          <div className="space-y-5">
            {steps.map((step, index) => (
              <div key={step} className="flex gap-5 rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-semibold text-white">
                  0{index + 1}
                </div>
                <p className="pt-1 text-base leading-7 text-slate-700 dark:text-slate-300">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-indigo-600 dark:text-indigo-400">Pricing</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white md:text-4xl">
            Flexible plans for every stage of growth
          </h2>
        </div>
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg shadow-slate-100 ${plan.highlight} dark:border-slate-700 dark:bg-slate-800 dark:shadow-none`}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{plan.name}</p>
              <p className="mt-6 text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">{plan.price}</p>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">{plan.subtitle}</p>
              <button
                type="button"
                className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900 transition hover:opacity-95"
              >
                Choose Plan
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-950 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-200 dark:text-indigo-400">Testimonials</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Loved by teams building modern HR operations
            </h2>
          </div>
          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.author}
                className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl shadow-slate-950/30 backdrop-blur dark:border-white/10 dark:bg-white/5"
              >
                <p className="text-lg leading-8 text-slate-100">"{testimonial.quote}"</p>
                <div className="mt-8">
                  <p className="font-semibold text-white">{testimonial.author}</p>
                  <p className="mt-1 text-sm text-slate-300">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 text-sm text-slate-500 dark:text-slate-400 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>© 2026 WorkNest. Built for modern HR teams.</p>
          <div className="flex gap-5">
            <Link href="/register" className="transition hover:text-slate-900 dark:hover:text-white">
              Get Started
            </Link>
            <Link href="/login" className="transition hover:text-slate-900 dark:hover:text-white">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
