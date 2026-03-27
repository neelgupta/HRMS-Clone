"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type CurrentUser = {
  userId: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
  companyName: string;
};

const navItems = ["Dashboard", "Employees", "Attendance", "Leaves", "Payroll", "Settings"];

export default function HRDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = (await response.json()) as CurrentUser & { message?: string };

        if (!response.ok) {
          router.push("/login");
          return;
        }

        setUser(data);
      } catch {
        setError("Could not load profile.");
      } finally {
        setLoading(false);
      }
    };

    void loadUser();
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">Loading dashboard...</main>;
  }

  if (!user) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-950 text-rose-300">{error || "Unauthorized"}</main>;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-[250px_1fr]">
        <aside className="border-r border-white/10 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">WorkNest</h2>
          <nav className="mt-8 space-y-2">
            {navItems.map((item) => (
              <button
                key={item}
                type="button"
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                {item}
              </button>
            ))}
          </nav>
        </aside>

        <section className="p-6 md:p-8">
          <header className="mb-8 flex items-center justify-between rounded-xl border border-white/10 bg-slate-900 px-5 py-4">
            <div>
              <p className="text-sm text-slate-300">Logged in as</p>
              <p className="font-semibold">{user.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/5"
            >
              Logout
            </button>
          </header>

          <div className="rounded-2xl border border-white/10 bg-slate-900 p-7">
            <h1 className="text-3xl font-semibold">Welcome, {user.name}! Let&apos;s set up {user.companyName}.</h1>
            <p className="mt-2 text-slate-300">Your HR admin workspace is ready. Next, complete your company profile setup.</p>

            <div className="mt-7 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-6">
              <h2 className="text-xl font-semibold">Complete your company profile</h2>
              <p className="mt-2 text-slate-300">Add your organization details to unlock the full HRMS experience.</p>
              <Link
                href="/dashboard/hr/company-setup"
                className="mt-5 inline-flex rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Add Company Details →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
