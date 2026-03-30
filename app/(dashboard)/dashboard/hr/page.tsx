"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MdArrowForward, MdBusiness, MdOutlineBadge, MdOutlineDomainVerification } from "react-icons/md";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Skeleton } from "@/components/ui/loaders/skeleton";

type CurrentUser = {
  userId: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
  companyName: string;
};

type CompanySettingsResponse = {
  company: {
    setupCompleted: boolean;
  } | null;
};

export default function HRDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [companySetupComplete, setCompanySetupComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const [userResponse, companyResponse] = await Promise.all([fetch("/api/auth/me"), fetch("/api/company/me")]);
        const data = (await userResponse.json()) as CurrentUser & { message?: string };

        if (!userResponse.ok) {
          router.push("/login");
          return;
        }

        setUser(data);

        if (companyResponse.ok) {
          const companyData = (await companyResponse.json()) as CompanySettingsResponse;
          setCompanySetupComplete(Boolean(companyData.company?.setupCompleted));
        }
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
    return (
      <div className="grid animate-[loaderFadeIn_220ms_ease-out] gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg shadow-slate-100">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-4 h-10 w-3/4" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-5/6" />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        </section>
        <aside className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg shadow-slate-100">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-4 h-8 w-3/4" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-4/5" />
          <Skeleton className="mt-8 h-48 w-full" />
        </aside>
      </div>
    );
  }

  if (!user) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">{error || "Unauthorized"}</div>;
  }

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="A clean overview of your company setup and HR workspace status."
      userName={user.name}
      userEmail={user.email}
      onLogout={handleLogout}
    >
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg shadow-slate-100">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600">Overview</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                Welcome, {user.name}! {companySetupComplete ? `${user.companyName} is configured.` : `Let's set up ${user.companyName}.`}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                {companySetupComplete
                  ? "Your company workspace is live. You can keep refining branches, settings, and employee fields anytime."
                  : "Your HR admin workspace is ready. Next, complete your company profile setup."}
              </p>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
              <p className="font-medium">Workspace status</p>
              <p className="mt-1">{companySetupComplete ? "Configured and ready" : "Configuration in progress"}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
                <MdBusiness className="text-base" />
                Company
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-950">{user.companyName}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
                <MdOutlineBadge className="text-base" />
                Role
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-950">{user.role.replace("_", " ")}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
                <MdOutlineDomainVerification className="text-base" />
                Company ID
              </p>
              <p className="mt-2 truncate text-xl font-semibold text-slate-950">{user.companyId}</p>
            </div>
          </div>
        </section>

        <aside className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg shadow-slate-100">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600">Action Center</p>
          <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
            {companySetupComplete ? "Manage company settings" : "Complete your company profile"}
          </h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            {companySetupComplete
              ? "Update branding, branches, banking, and HR configuration from one place."
              : "Add your organization details to unlock the full HRMS experience."}
          </p>

          <div className="mt-8 rounded-[1.75rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-500 p-6 text-white shadow-lg shadow-indigo-200">
            <p className="text-sm text-blue-100">Next recommended step</p>
            <p className="mt-2 text-xl font-semibold">
              {companySetupComplete ? "Refine your operating setup" : "Finish company onboarding"}
            </p>
            <Link
              href="/dashboard/hr/company-setup"
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-slate-100"
            >
              <MdArrowForward className="text-base" />
              {companySetupComplete ? "Open Company Settings" : "Add Company Details"}
            </Link>
          </div>
        </aside>
      </div>
    </DashboardLayout>
  );
}
