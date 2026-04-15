"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  MdPerson,
  MdLock,
  MdPhone,
  MdEdit,
  MdSave,
  MdVisibility,
  MdVisibilityOff,
  MdCheckCircle,
} from "react-icons/md";
import { EmployeeLayout } from "@/components/employee";

type ProfileData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  maritalStatus: string | null;
  bloodGroup: string | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
};

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-CA");
}

export default function ProfileManagementPage() {
  const [activeTab, setActiveTab] = useState<"personal" | "security" | "emergency">("personal");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedProfile, setEditedProfile] = useState<ProfileData | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/employees/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setProfile(data.employee);
          setEditedProfile(data.employee);
        }
      } catch {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    void loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    if (!editedProfile) return;
    setSaving(true);
    try {
      const res = await fetch("/api/employees/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          firstName: editedProfile.firstName,
          lastName: editedProfile.lastName,
          phone: editedProfile.phone,
          dateOfBirth: editedProfile.dateOfBirth,
          gender: editedProfile.gender,
          maritalStatus: editedProfile.maritalStatus,
          bloodGroup: editedProfile.bloodGroup,
          address: editedProfile.address,
        }),
      });
      if (res.ok) {
        toast.success("Profile updated successfully");
        setProfile(editedProfile);
        setEditMode(false);
      } else {
        toast.error("Failed to update profile");
      }
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmergency = async () => {
    if (!editedProfile) return;
    setSaving(true);
    try {
      const res = await fetch("/api/employees/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          emergencyContactName: editedProfile.emergencyContactName,
          emergencyContactPhone: editedProfile.emergencyContactPhone,
          emergencyContactRelation: editedProfile.emergencyContactRelation,
        }),
      });
      if (res.ok) {
        toast.success("Emergency contact updated successfully");
        setProfile(editedProfile);
        setEditMode(false);
      } else {
        toast.error("Failed to update emergency contact");
      }
    } catch {
      toast.error("Failed to update emergency contact");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      if (res.ok) {
        toast.success("Password changed successfully");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to change password");
      }
    } catch {
      toast.error("Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <EmployeeLayout title="Profile Management" subtitle="Manage your personal information and security settings">
        <div className="animate-pulse space-y-6">
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout title="Profile Management" subtitle="View and update your personal information, security settings, and emergency contacts">
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-700 px-6">
            <div className="flex gap-6">
              {[
                { key: "personal", label: "Personal Info", icon: MdPerson },
                { key: "security", label: "Security", icon: MdLock },
                { key: "emergency", label: "Emergency Contact", icon: MdPhone },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === tab.key
                      ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
                >
                  <tab.icon className="text-lg" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === "personal" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Personal Information</h3>
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors"
                  >
                    {editMode ? (
                      <>
                        <MdSave className="text-lg" /> Save
                      </>
                    ) : (
                      <>
                        <MdEdit className="text-lg" /> Edit
                      </>
                    )}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {editMode ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">First Name</label>
                        <input
                          type="text"
                          value={editedProfile?.firstName || ""}
                          onChange={(e) => setEditedProfile((prev) => prev ? { ...prev, firstName: e.target.value } : null)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Last Name</label>
                        <input
                          type="text"
                          value={editedProfile?.lastName || ""}
                          onChange={(e) => setEditedProfile((prev) => prev ? { ...prev, lastName: e.target.value } : null)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Email</label>
                        <input
                          type="email"
                          value={editedProfile?.email || ""}
                          disabled
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Phone</label>
                        <input
                          type="tel"
                          value={editedProfile?.phone || ""}
                          onChange={(e) => setEditedProfile((prev) => prev ? { ...prev, phone: e.target.value } : null)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Date of Birth</label>
                        <input
                          type="date"
                          value={formatDate(editedProfile?.dateOfBirth || null)}
                          onChange={(e) => setEditedProfile((prev) => prev ? { ...prev, dateOfBirth: e.target.value } : null)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Gender</label>
                        <select
                          value={editedProfile?.gender || ""}
                          onChange={(e) => setEditedProfile((prev) => prev ? { ...prev, gender: e.target.value } : null)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Select</option>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Marital Status</label>
                        <select
                          value={editedProfile?.maritalStatus || ""}
                          onChange={(e) => setEditedProfile((prev) => prev ? { ...prev, maritalStatus: e.target.value } : null)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Select</option>
                          <option value="SINGLE">Single</option>
                          <option value="MARRIED">Married</option>
                          <option value="DIVORCED">Divorced</option>
                          <option value="WIDOWED">Widowed</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Blood Group</label>
                        <select
                          value={editedProfile?.bloodGroup || ""}
                          onChange={(e) => setEditedProfile((prev) => prev ? { ...prev, bloodGroup: e.target.value } : null)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Select</option>
                          {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                            <option key={bg} value={bg}>{bg}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Address</label>
                        <textarea
                          value={editedProfile?.address || ""}
                          onChange={(e) => setEditedProfile((prev) => prev ? { ...prev, address: e.target.value } : null)}
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <label className="text-xs text-slate-500 dark:text-slate-400">First Name</label>
                        <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{profile?.firstName || "N/A"}</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <label className="text-xs text-slate-500 dark:text-slate-400">Last Name</label>
                        <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{profile?.lastName || "N/A"}</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <label className="text-xs text-slate-500 dark:text-slate-400">Email</label>
                        <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{profile?.email || "N/A"}</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <label className="text-xs text-slate-500 dark:text-slate-400">Phone</label>
                        <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{profile?.phone || "N/A"}</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <label className="text-xs text-slate-500 dark:text-slate-400">Date of Birth</label>
                        <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                          {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A"}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <label className="text-xs text-slate-500 dark:text-slate-400">Gender</label>
                        <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{profile?.gender || "N/A"}</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <label className="text-xs text-slate-500 dark:text-slate-400">Marital Status</label>
                        <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{profile?.maritalStatus || "N/A"}</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <label className="text-xs text-slate-500 dark:text-slate-400">Blood Group</label>
                        <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{profile?.bloodGroup || "N/A"}</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl md:col-span-2">
                        <label className="text-xs text-slate-500 dark:text-slate-400">Address</label>
                        <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{profile?.address || "N/A"}</p>
                      </div>
                    </>
                  )}
                </div>
                {editMode && (
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => {
                        setEditMode(false);
                        setEditedProfile(profile);
                      }}
                      className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "security" && (
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-6">Change Password</h3>
                <form onSubmit={handleChangePassword} className="max-w-lg space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                        required
                        className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showCurrentPassword ? <MdVisibilityOff /> : <MdVisibility />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                        required
                        minLength={8}
                        className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? <MdVisibilityOff /> : <MdVisibility />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50"
                  >
                    <MdLock />
                    {changingPassword ? "Changing Password..." : "Change Password"}
                  </button>
                </form>
              </div>
            )}

            {activeTab === "emergency" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Emergency Contact Details</h3>
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors"
                  >
                    {editMode ? (
                      <>
                        <MdSave className="text-lg" /> Save
                      </>
                    ) : (
                      <>
                        <MdEdit className="text-lg" /> Edit
                      </>
                    )}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {editMode ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Contact Name</label>
                        <input
                          type="text"
                          value={editedProfile?.emergencyContactName || ""}
                          onChange={(e) => setEditedProfile((prev) => prev ? { ...prev, emergencyContactName: e.target.value } : null)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Contact Phone</label>
                        <input
                          type="tel"
                          value={editedProfile?.emergencyContactPhone || ""}
                          onChange={(e) => setEditedProfile((prev) => prev ? { ...prev, emergencyContactPhone: e.target.value } : null)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Relationship</label>
                        <input
                          type="text"
                          value={editedProfile?.emergencyContactRelation || ""}
                          onChange={(e) => setEditedProfile((prev) => prev ? { ...prev, emergencyContactRelation: e.target.value } : null)}
                          placeholder="e.g., Spouse, Parent, Sibling"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <label className="text-xs text-slate-500 dark:text-slate-400">Contact Name</label>
                        <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{profile?.emergencyContactName || "N/A"}</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <label className="text-xs text-slate-500 dark:text-slate-400">Contact Phone</label>
                        <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{profile?.emergencyContactPhone || "N/A"}</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <label className="text-xs text-slate-500 dark:text-slate-400">Relationship</label>
                        <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{profile?.emergencyContactRelation || "N/A"}</p>
                      </div>
                    </>
                  )}
                </div>
                {editMode && (
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => {
                        setEditMode(false);
                        setEditedProfile(profile);
                      }}
                      className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEmergency}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
