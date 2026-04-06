"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/loaders/skeleton";

type CurrentUser = {
  userId: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
};

export default function AttendanceReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userResponse = await fetch("/api/auth/me");

        if (!userResponse.ok) {
          router.push("/login");
          return;
        }

        const data = await userResponse.json();
        setUser(data);

        if (data.role !== "HR_ADMIN" && data.role !== "SUPER_ADMIN" && data.role !== "PAYROLL_MANAGER") {
          router.push("/dashboard/hr");
          return;
        }
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    void loadUser();
  }, [router]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-8">
      <h1 className="text-2xl font-semibold text-slate-950 dark:text-white mb-4">Attendance Reports</h1>
      <p className="text-slate-600 dark:text-slate-400">Reports feature coming soon.</p>
    </div>
  );
}
