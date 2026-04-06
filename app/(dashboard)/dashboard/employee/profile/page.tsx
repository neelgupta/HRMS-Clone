"use client";

import { useState, useEffect, Suspense } from "react";
import {
  MdBadge,
  MdWork,
  MdCalendarToday,
  MdCameraAlt,
} from "react-icons/md";
import { EmployeeLayout } from "@/components/employee";

type EmployeeProfile = {
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
    ifscCode: string | null;
    address: string | null;
  } | null;
};

function ProfileContent() {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"personal" | "employment" | "bank" | "emergency">("personal");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch("/api/employees/me");
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        }
      } catch {
        console.error("Failed to load profile");
      }
    };
    void loadProfile();
  }, []);

  const fullName = profile?.employee
    ? `${profile.employee.firstName} ${profile.employee.lastName}`
    : "Employee";

  const initials = profile?.employee
    ? `${profile.employee.firstName.charAt(0)}${profile.employee.lastName.charAt(0)}`
    : "E";

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE": return "bg-emerald-100 text-emerald-700";
      case "PROBATION": return "bg-amber-100 text-amber-700";
      case "INACTIVE": return "bg-slate-100 text-slate-700";
      default: return "bg-blue-100 text-blue-700";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Profile Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 text-center">
          <div className="relative inline-block">
            <div className="w-28 h-28 mx-auto rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-indigo-200 dark:shadow-indigo-900">
              {initials}
            </div>
            {/* <button className="absolute bottom-0 right-0 w-8 h-8 bg-slate-900 dark:bg-slate-600 rounded-xl flex items-center justify-center text-white hover:bg-slate-800 dark:hover:bg-slate-500 transition-colors">
              <MdCameraAlt className="text-sm" />
            </button> */}
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">{fullName}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{profile?.employee?.designation || "Employee"}</p>
          <span className={`inline-flex mt-3 items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(profile?.employee?.employmentStatus || "ACTIVE")}`}>
            {profile?.employee?.employmentStatus || "Active"}
          </span>

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

      {/* Details */}
      <div className="lg:col-span-2">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-700 px-6">
            <div className="flex gap-6">
              {[
                { key: "personal", label: "Personal Info" },
                { key: "employment", label: "Employment" },
                { key: "bank", label: "Bank Details" },
                { key: "emergency", label: "Emergency Contact" },
              ].map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`py-4 text-sm font-medium border-b-2 transition-colors ${
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
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <label className="text-xs text-slate-500 dark:text-slate-400">Full Name</label>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{fullName}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <label className="text-xs text-slate-500 dark:text-slate-400">Email</label>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{profile?.employee?.email || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <label className="text-xs text-slate-500 dark:text-slate-400">Phone</label>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{profile?.employee?.phone || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <label className="text-xs text-slate-500 dark:text-slate-400">Date of Birth</label>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{formatDate(profile?.employee?.dateOfBirth)}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <label className="text-xs text-slate-500 dark:text-slate-400">Gender</label>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{profile?.employee?.gender || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <label className="text-xs text-slate-500 dark:text-slate-400">Marital Status</label>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{profile?.employee?.maritalStatus || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <label className="text-xs text-slate-500 dark:text-slate-400">Blood Group</label>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{profile?.employee?.bloodGroup || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <label className="text-xs text-slate-500 dark:text-slate-400">Address</label>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{profile?.employee?.address || "N/A"}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "employment" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <label className="text-xs text-slate-500 dark:text-slate-400">Designation</label>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{profile?.employee?.designation || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <label className="text-xs text-slate-500 dark:text-slate-400">Department</label>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{profile?.employee?.department || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <label className="text-xs text-slate-500 dark:text-slate-400">Branch</label>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{profile?.employee?.branch || "N/A"}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <label className="text-xs text-slate-500 dark:text-slate-400">Employment Type</label>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{profile?.employee?.employmentType || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <label className="text-xs text-slate-500 dark:text-slate-400">Reporting Manager</label>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{profile?.employee?.reportingManager || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <label className="text-xs text-slate-500 dark:text-slate-400">Date of Joining</label>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{formatDate(profile?.employee?.dateOfJoining)}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "bank" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <label className="text-xs text-slate-500 dark:text-slate-400">Bank Account Number</label>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{profile?.employee?.bankAccountNumber || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <label className="text-xs text-slate-500 dark:text-slate-400">IFSC Code</label>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{profile?.employee?.ifscCode || "N/A"}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <label className="text-xs text-slate-500 dark:text-slate-400">PAN Number</label>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{profile?.employee?.panNumber || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <label className="text-xs text-slate-500 dark:text-slate-400">Aadhar Number</label>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{profile?.employee?.aadharNumber || "N/A"}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "emergency" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <label className="text-xs text-slate-500 dark:text-slate-400">Contact Name</label>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{profile?.employee?.emergencyContactName || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <label className="text-xs text-slate-500 dark:text-slate-400">Contact Phone</label>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{profile?.employee?.emergencyContactPhone || "N/A"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyProfilePage() {
  return (
    <EmployeeLayout title="My Profile" subtitle="View and manage your personal information">
      <Suspense fallback={<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>}>
        <ProfileContent />
      </Suspense>
    </EmployeeLayout>
  );
}
