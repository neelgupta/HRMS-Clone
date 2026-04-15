"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  MdDashboard,
  MdEventNote,
  MdBeachAccess,
  MdPeople,
  MdCalendarToday,
  MdTrendingUp,
  MdAccessTime,
  MdCheckCircle,
  MdInfo,
} from "react-icons/md";
import { EmployeeLayout } from "@/components/employee";

type LeaveBalance = {
  leaveType: string;
  entitled: number;
  used: number;
  pending: number;
  available: number;
};

type Holiday = {
  id: string;
  name: string;
  date: string;
  day: string;
};

type TeamMember = {
  id: string;
  name: string;
  designation: string;
  birthday: string | null;
  workAnniversary: string | null;
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getDayName(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { weekday: "long" });
}

function getUpcomingBirthdays(members: TeamMember[]): TeamMember[] {
  const today = new Date();
  return members
    .filter((m) => m.birthday)
    .map((m) => ({
      ...m,
      nextOccurrence: new Date(today.getFullYear(), new Date(m.birthday!).getMonth(), new Date(m.birthday!).getDate()),
    }))
    .filter((m) => {
      const thisYear = m.nextOccurrence;
      return thisYear >= today || (thisYear.getMonth() === today.getMonth() && thisYear.getDate() >= today.getDate());
    })
    .sort((a, b) => a.nextOccurrence.getTime() - b.nextOccurrence.getTime())
    .slice(0, 5);
}

function getUpcomingAnniversaries(members: TeamMember[]): TeamMember[] {
  const today = new Date();
  return members
    .filter((m) => m.workAnniversary)
    .map((m) => ({
      ...m,
      nextOccurrence: new Date(today.getFullYear(), new Date(m.workAnniversary!).getMonth(), new Date(m.workAnniversary!).getDate()),
    }))
    .filter((m) => {
      const thisYear = m.nextOccurrence;
      return thisYear >= today || (thisYear.getMonth() === today.getMonth() && thisYear.getDate() >= today.getDate());
    })
    .sort((a, b) => a.nextOccurrence.getTime() - b.nextOccurrence.getTime())
    .slice(0, 5);
}

export default function SelfServiceDashboard() {
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [profile, setProfile] = useState<{ employee: { firstName: string; lastName: string; employeeCode: string } | null }>({ employee: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileRes, leaveRes, holidaysRes, teamRes] = await Promise.all([
          fetch("/api/employees/me", { credentials: "include" }),
          fetch("/api/employee/leave/balances", { credentials: "include" }),
          fetch("/api/employee/holidays", { credentials: "include" }),
          fetch("/api/employees/company", { credentials: "include" }),
        ]);

        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfile(data);
        }
        if (leaveRes.ok) {
          const data = await leaveRes.json();
          setLeaveBalances(data.balances || []);
        }
        if (holidaysRes.ok) {
          const data = await holidaysRes.json();
          setHolidays(data.holidays || []);
        }
        if (teamRes.ok) {
          const data = await teamRes.json();
          setTeamMembers(
            (data.employees || []).map((e: any) => ({
              id: e.id,
              name: `${e.firstName} ${e.lastName}`,
              designation: e.designation || "Employee",
              birthday: e.dateOfBirth,
              workAnniversary: e.dateOfJoining,
            }))
          );
        }
      } catch {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, []);

  const fullName = profile?.employee ? `${profile.employee.firstName} ${profile.employee.lastName}` : "Employee";
  const initials = profile?.employee
    ? `${profile.employee.firstName.charAt(0)}${profile.employee.lastName.charAt(0)}`
    : "E";

  const upcomingHolidays = holidays
    .filter((h) => new Date(h.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const birthdays = getUpcomingBirthdays(teamMembers);
  const anniversaries = getUpcomingAnniversaries(teamMembers);

  return (
    <EmployeeLayout
      title="Self-Service Portal"
      subtitle="Your personalized dashboard with quick access to key functions"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
                  {initials}
                </div>
                <div>
                  <p className="text-sm text-indigo-200">Welcome back</p>
                  <p className="text-xl font-semibold">{fullName}</p>
                  <p className="text-sm text-indigo-200">{profile?.employee?.employeeCode || "Employee"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-8">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <MdTrendingUp className="text-indigo-600 dark:text-indigo-400 text-lg" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Quick Overview</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {leaveBalances.reduce((sum, lb) => sum + lb.available, 0)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total Leave Available</p>
                </div>
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {holidays.filter((h) => new Date(h.date) >= new Date()).length}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Upcoming Holidays</p>
                </div>
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{teamMembers.length}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Team Members</p>
                </div>
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {leaveBalances.reduce((sum, lb) => sum + lb.pending, 0)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pending Requests</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <MdEventNote className="text-emerald-600 dark:text-emerald-400 text-lg" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Leave Balance Summary</h3>
                </div>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-center gap-4">
                      <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : leaveBalances.length === 0 ? (
                <div className="text-center py-8">
                  <MdInfo className="mx-auto text-4xl text-slate-300 dark:text-slate-600" />
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No leave balances found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaveBalances.map((balance) => (
                    <div key={balance.leaveType} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                        <MdCheckCircle className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white">{balance.leaveType}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {balance.used} used / {balance.entitled} entitled
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{balance.available}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Available</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <MdBeachAccess className="text-purple-600 dark:text-purple-400 text-lg" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Upcoming Holidays</h3>
                </div>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-center gap-4">
                      <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : upcomingHolidays.length === 0 ? (
                <div className="text-center py-8">
                  <MdBeachAccess className="mx-auto text-4xl text-slate-300 dark:text-slate-600" />
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No upcoming holidays</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingHolidays.map((holiday) => (
                    <div key={holiday.id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                        <MdCalendarToday className="text-white text-sm" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white">{holiday.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{getDayName(holiday.date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                          {new Date(holiday.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                  <MdPeople className="text-rose-600 dark:text-rose-400 text-lg" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Upcoming Birthdays</h3>
              </div>
              {birthdays.length === 0 ? (
                <div className="text-center py-8">
                  <MdPeople className="mx-auto text-4xl text-slate-300 dark:text-slate-600" />
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No upcoming birthdays</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {birthdays.map((member) => (
                    <div key={member.id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white text-sm font-bold">
                        {member.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white">{member.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{member.designation}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
                          {new Date(member.birthday!).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <MdAccessTime className="text-amber-600 dark:text-amber-400 text-lg" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Work Anniversaries</h3>
              </div>
              {anniversaries.length === 0 ? (
                <div className="text-center py-8">
                  <MdAccessTime className="mx-auto text-4xl text-slate-300 dark:text-slate-600" />
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No upcoming anniversaries</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {anniversaries.map((member) => {
                    const years = Math.floor(
                      (new Date().getTime() - new Date(member.workAnniversary!).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
                    );
                    return (
                      <div key={member.id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-sm font-bold">
                          {member.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 dark:text-white">{member.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{member.designation}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-amber-600 dark:text-amber-400">{years + 1} years</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(member.workAnniversary!).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
