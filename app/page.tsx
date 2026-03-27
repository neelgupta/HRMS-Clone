import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 py-16 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_#1e293b,_transparent_55%)]" />
      <div className="pointer-events-none absolute -left-24 top-8 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />

      <section className="relative w-full max-w-3xl rounded-3xl border border-white/15 bg-slate-900/80 p-8 backdrop-blur md:p-12">
        <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-1 text-xs font-semibold tracking-[0.2em] text-cyan-100">
          HRMS SAAS PLATFORM
        </p>
        <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-5xl">
          Hire faster, manage smarter, and scale every team with confidence.
        </h1>
        <p className="mt-5 max-w-2xl text-base text-slate-300 md:text-lg">
          Start your multi-tenant HRMS workspace in minutes. Register your organization, activate your
          admin account securely, and launch your HR operations dashboard.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 font-semibold transition hover:border-white/40 hover:bg-white/5"
          >
            Sign In
          </Link>
        </div>
      </section>
    </main>
  );
}
