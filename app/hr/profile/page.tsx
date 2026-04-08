"use client";

import { useState, useEffect, Suspense } from "react";
import {
  MdBadge,
  MdWork,
  MdCalendarToday,
  MdEmail,
  MdPhone,
  MdSecurity,
} from "react-icons/md";

type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  employee: {
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    dateOfBirth: string | null;
    gender: string | null;
    maritalStatus: string | null;
    bloodGroup: string | null;
    dateOfJoining: string | null;
    employmentType: string;
    employmentStatus: string;
    department: string | null;
    designation: string | null;
    branch: string | null;
    reportingManager: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    panNumber: string | null;
    aadharNumber: string | null;
    bankAccountNumber: string | null;
    bankIfscCode: string | null;
    presentAddressLine1: string | null;
    presentCity: string | null;
    presentState: string | null;
    presentCountry: string | null;
    presentPincode: string | null;
  } | null;
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  HR_ADMIN: "HR Admin",
  PAYROLL_MANAGER: "Payroll Manager",
  DEPT_MANAGER: "Department Manager",
  EMPLOYEE: "Employee",
};

function ProfileContent() {
  const [user, setUser] = useState<{ name: string; email: string; role: string; phone?: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"personal" | "employment" | "bank" | "emergency">("personal");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userRes = await fetch("/api/auth/me");
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
        }

        const profileRes = await fetch("/api/employees/me");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
        }
      } catch {
        console.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, []);

  const fullName = profile?.employee
    ? `${profile.employee.firstName} ${profile.employee.lastName}`
    : user?.name || "User";

  const initials = profile?.employee
    ? `${profile.employee.firstName.charAt(0)}${profile.employee.lastName.charAt(0)}`
    : (user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U");

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "CONFIRMED": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "PROBATION": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "INACTIVE": return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400";
      default: return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    }
  };

  const InfoField = ({ label, value }: { label: string; value: string }) => (
    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
      <label className="text-xs text-slate-500 dark:text-slate-400">{label}</label>
      <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{value}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 text-center">
          <div className="relative inline-block">
            <div className="w-28 h-28 mx-auto rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-indigo-200 dark:shadow-indigo-900">
              {initials}
            </div>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">{fullName}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {roleLabels[user?.role || ""] || user?.role || "User"}
          </p>
          {profile?.employee && (
            <span className={`inline-flex mt-3 items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(profile.employee.employmentStatus)}`}>
              {profile.employee.employmentStatus || "Active"}
            </span>
          )}

          <div className="mt-6 space-y-3 text-left">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <MdBadge className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Employee ID</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{profile?.employee?.employeeCode || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <MdWork className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Department</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{profile?.employee?.department || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                <MdCalendarToday className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Joined</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{formatDate(profile?.employee?.dateOfJoining)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-700 px-6">
            <div className="flex gap-6 overflow-x-auto">
              {[
                { key: "personal", label: "Personal Info" },
                { key: "employment", label: "Employment" },
                { key: "bank", label: "Bank Details" },
                { key: "emergency", label: "Emergency Contact" },
              ].map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.key ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === "personal" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <InfoField label="Full Name" value={fullName} />
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><MdEmail className="text-xs" /> Email</label>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{user?.email || profile?.employee?.email || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><MdPhone className="text-xs" /> Phone</label>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{user?.phone || profile?.employee?.phone || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <label className="text-xs text-slate-500 dark:text-slate-400">Date of Birth</label>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{formatDate(profile?.employee?.dateOfBirth)}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <InfoField label="Gender" value={profile?.employee?.gender || "N/A"} />
                  <InfoField label="Marital Status" value={profile?.employee?.maritalStatus || "N/A"} />
                  <InfoField label="Blood Group" value={profile?.employee?.bloodGroup || "N/A"} />
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <label className="text-xs text-slate-500 dark:text-slate-400">Address</label>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                      {[profile?.employee?.presentAddressLine1, profile?.employee?.presentCity, profile?.employee?.presentState, profile?.employee?.presentCountry, profile?.employee?.presentPincode].filter(Boolean).join(", ") || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "employment" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <InfoField label="Designation" value={profile?.employee?.designation || "N/A"} />
                  <InfoField label="Department" value={profile?.employee?.department || "N/A"} />
                  <InfoField label="Branch" value={profile?.employee?.branch || "N/A"} />
                </div>
                <div className="space-y-4">
                  <InfoField label="Employment Type" value={profile?.employee?.employmentType || "N/A"} />
                  <InfoField label="Reporting Manager" value={profile?.employee?.reportingManager || "N/A"} />
                  <InfoField label="Date of Joining" value={formatDate(profile?.employee?.dateOfJoining)} />
                </div>
              </div>
            )}

            {activeTab === "bank" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><MdSecurity className="text-xs" /> PAN Number</label>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{profile?.employee?.panNumber || "N/A"}</p>
                  </div>
                  <InfoField label="Bank Account Number" value={profile?.employee?.bankAccountNumber || "N/A"} />
                </div>
                <div className="space-y-4">
                  <InfoField label="Aadhar Number" value={profile?.employee?.aadharNumber || "N/A"} />
                  <InfoField label="IFSC Code" value={profile?.employee?.bankIfscCode || "N/A"} />
                </div>
              </div>
            )}

            {activeTab === "emergency" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <InfoField label="Contact Name" value={profile?.employee?.emergencyContactName || "N/A"} />
                  <InfoField label="Contact Phone" value={profile?.employee?.emergencyContactPhone || "N/A"} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HRProfilePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">View your personal and employment information</p>
      </div>
      <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent"></div></div>}>
        <ProfileContent />
      </Suspense>
    </div>
  );
}
