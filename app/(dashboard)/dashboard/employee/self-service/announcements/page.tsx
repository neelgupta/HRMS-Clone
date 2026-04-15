"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  MdAnnouncement,
  MdCampaign,
  MdCake,
  MdCelebration,
  MdVisibility,
  MdAccessTime,
  MdNotifications,
} from "react-icons/md";
import { EmployeeLayout } from "@/components/employee";

type Announcement = {
  id: string;
  title: string;
  content: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  category: "GENERAL" | "HR_POLICY" | "EVENT" | "HOLIDAY" | "BENEFIT";
  isActive: boolean;
  startDate: string;
  endDate: string | null;
  createdBy: string;
  createdAt: string;
};

type Birthday = {
  id: string;
  name: string;
  designation: string;
  date: string;
};

type Anniversary = {
  id: string;
  name: string;
  designation: string;
  years: number;
  date: string;
};

const priorityConfig = {
  LOW: { label: "Low", color: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300" },
  MEDIUM: { label: "Medium", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  HIGH: { label: "High", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
};

const categoryConfig = {
  GENERAL: { label: "General", icon: MdAnnouncement, color: "indigo" },
  HR_POLICY: { label: "HR Policy", icon: MdCampaign, color: "blue" },
  EVENT: { label: "Event", icon: MdCelebration, color: "purple" },
  HOLIDAY: { label: "Holiday", icon: MdCake, color: "emerald" },
  BENEFIT: { label: "Benefit", icon: MdAnnouncement, color: "amber" },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [anniversaries, setAnniversaries] = useState<Anniversary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"announcements" | "celebrations">("announcements");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [annRes, teamRes] = await Promise.all([
          fetch("/api/announcements", { credentials: "include" }),
          fetch("/api/employees/company", { credentials: "include" }),
        ]);

        if (annRes.ok) {
          const data = await annRes.json();
          setAnnouncements(data.announcements || []);
        }

        if (teamRes.ok) {
          const data = await teamRes.json();
          const employees = data.employees || [];
          const today = new Date();

          const upcomingBirthdays: Birthday[] = employees
            .filter((e: any) => e.dateOfBirth)
            .map((e: any) => {
              const bday = new Date(today.getFullYear(), new Date(e.dateOfBirth).getMonth(), new Date(e.dateOfBirth).getDate());
              if (bday < today) bday.setFullYear(today.getFullYear() + 1);
              return {
                id: e.id,
                name: `${e.firstName} ${e.lastName}`,
                designation: e.designation || "Employee",
                date: bday.toISOString(),
              };
            })
            .filter((b: Birthday) => {
              const daysDiff = Math.ceil((new Date(b.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              return daysDiff <= 30;
            })
            .sort((a: Birthday, b: Birthday) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 10);

          const upcomingAnniversaries: Anniversary[] = employees
            .filter((e: any) => e.dateOfJoining)
            .map((e: any) => {
              const joinDate = new Date(e.dateOfJoining);
              const anni = new Date(today.getFullYear(), joinDate.getMonth(), joinDate.getDate());
              if (anni < today) anni.setFullYear(today.getFullYear() + 1);
              const years = today.getFullYear() - joinDate.getFullYear();
              return {
                id: e.id,
                name: `${e.firstName} ${e.lastName}`,
                designation: e.designation || "Employee",
                years: years + 1,
                date: anni.toISOString(),
              };
            })
            .filter((a: Anniversary) => {
              const daysDiff = Math.ceil((new Date(a.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              return daysDiff <= 30;
            })
            .sort((a: Anniversary, b: Anniversary) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 10);

          setBirthdays(upcomingBirthdays);
          setAnniversaries(upcomingAnniversaries);
        }
      } catch {
        toast.error("Failed to load announcements");
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, []);

  const today = new Date();
  const todayBirthdays = birthdays.filter((b) => {
    const bday = new Date(b.date);
    return bday.getMonth() === today.getMonth() && bday.getDate() === today.getDate();
  });

  const todayAnniversaries = anniversaries.filter((a) => {
    const anni = new Date(a.date);
    return anni.getMonth() === today.getMonth() && anni.getDate() === today.getDate();
  });

  return (
    <EmployeeLayout title="Announcements & Notifications" subtitle="Company-wide announcements and team celebrations">
      <div className="space-y-6">
        {(todayBirthdays.length > 0 || todayAnniversaries.length > 0) && (
          <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <MdCelebration className="text-3xl" />
              <div>
                <h3 className="text-lg font-semibold">Today&apos;s Celebrations</h3>
                <p className="text-sm text-white/80">Wishing them a very Happy Day!</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {todayBirthdays.length > 0 && (
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MdCake className="text-xl" />
                    <span className="font-semibold">Birthdays</span>
                  </div>
                  {todayBirthdays.map((b) => (
                    <p key={b.id} className="text-sm">
                      🎂 {b.name} - {b.designation}
                    </p>
                  ))}
                </div>
              )}
              {todayAnniversaries.length > 0 && (
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MdCelebration className="text-xl" />
                    <span className="font-semibold">Work Anniversaries</span>
                  </div>
                  {todayAnniversaries.map((a) => (
                    <p key={a.id} className="text-sm">
                      🎉 {a.name} - {a.years} years!
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-700 px-6">
            <div className="flex gap-6">
              <button
                onClick={() => setActiveTab("announcements")}
                className={`py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === "announcements"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                <MdAnnouncement className="text-lg" />
                Announcements
                {announcements.length > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full">
                    {announcements.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("celebrations")}
                className={`py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === "celebrations"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                <MdCelebration className="text-lg" />
                Celebrations
                {(birthdays.length + anniversaries.length) > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400 rounded-full">
                    {birthdays.length + anniversaries.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === "announcements" && (
              <>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading announcements...</p>
                  </div>
                ) : announcements.length === 0 ? (
                  <div className="text-center py-12">
                    <MdAnnouncement className="mx-auto text-5xl text-slate-300 dark:text-slate-600" />
                    <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">No Announcements</h3>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Company announcements will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {announcements
                      .filter((a) => a.isActive)
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((announcement) => {
                        const catInfo = categoryConfig[announcement.category];
                        const Icon = catInfo.icon;
                        const priorityInfo = priorityConfig[announcement.priority];
                        return (
                          <div
                            key={announcement.id}
                            className="p-5 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors cursor-pointer"
                            onClick={() => setSelectedAnnouncement(announcement)}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`w-12 h-12 rounded-xl bg-${catInfo.color}-100 dark:bg-${catInfo.color}-900/30 flex items-center justify-center flex-shrink-0`}>
                                <Icon className={`text-${catInfo.color}-600 dark:text-${catInfo.color}-400 text-xl`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-slate-900 dark:text-white truncate">{announcement.title}</h4>
                                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${priorityInfo.color}`}>
                                    {priorityInfo.label}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{announcement.content}</p>
                                <div className="flex items-center gap-4 mt-3">
                                  <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                    <MdAccessTime className="text-sm" />
                                    {formatDate(announcement.startDate)}
                                  </span>
                                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full bg-${catInfo.color}-100 text-${catInfo.color}-600 dark:bg-${catInfo.color}-900/30 dark:text-${catInfo.color}-400`}>
                                    {catInfo.label}
                                  </span>
                                </div>
                              </div>
                              <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
                                <MdVisibility className="text-lg" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </>
            )}

            {activeTab === "celebrations" && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                    <MdCake className="text-pink-500" /> Upcoming Birthdays
                  </h4>
                  {birthdays.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No upcoming birthdays in the next 30 days.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {birthdays.map((b) => (
                        <div key={b.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-pink-50/50 dark:bg-pink-900/10">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-bold text-lg">
                              {b.name.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">{b.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{b.designation}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-xs text-pink-600 dark:text-pink-400 flex items-center gap-1">
                              <MdCake className="text-sm" />
                              {formatDateShort(b.date)}
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              {Math.ceil((new Date(b.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} days
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                    <MdCelebration className="text-amber-500" /> Upcoming Work Anniversaries
                  </h4>
                  {anniversaries.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No upcoming anniversaries in the next 30 days.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {anniversaries.map((a) => (
                        <div key={a.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-amber-50/50 dark:bg-amber-900/10">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                              {a.name.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">{a.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{a.designation}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <MdCelebration className="text-sm" />
                              {a.years} years
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              {Math.ceil((new Date(a.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} days
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedAnnouncement && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedAnnouncement(null)}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-white">Announcement Details</h3>
                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  {(() => {
                    const catInfo = categoryConfig[selectedAnnouncement.category];
                    const Icon = catInfo.icon;
                    const priorityInfo = priorityConfig[selectedAnnouncement.priority];
                    return (
                      <>
                        <div className={`w-12 h-12 rounded-xl bg-${catInfo.color}-100 dark:bg-${catInfo.color}-900/30 flex items-center justify-center`}>
                          <Icon className={`text-${catInfo.color}-600 dark:text-${catInfo.color}-400 text-xl`} />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-slate-900 dark:text-white">{selectedAnnouncement.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${priorityInfo.color}`}>
                              {priorityInfo.label}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full bg-${catInfo.color}-100 text-${catInfo.color}-600 dark:bg-${catInfo.color}-900/30 dark:text-${catInfo.color}-400`}>
                              {catInfo.label}
                            </span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{selectedAnnouncement.content}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Posted on {formatDate(selectedAnnouncement.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
}
