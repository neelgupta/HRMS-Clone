"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MdSettings, MdSave, MdMoney, MdWarning, MdArrowBack } from "react-icons/md";

type PayrollSettings = {
  pfEnabled: boolean;
  pfRate: number;
  pfWageCeiling: number;
  esiEnabled: boolean;
  esiRate: number;
  esiEmployerRate: number;
  esiWageCeiling: number;
  tdsEnabled: boolean;
  professionalTax: number;
  defaultBasicPercent: number;
  defaultHraPercent: number;
};

export default function PayrollSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<PayrollSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/payroll/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSettings(data.settings);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/payroll/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Settings saved successfully!" });
      } else {
        setMessage({ type: "error", text: data.message || "Failed to save settings" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof PayrollSettings, value: boolean | number) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!settings) {
    return <div>Failed to load settings</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
        >
          <MdArrowBack className="text-xl" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Payroll Settings
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Configure PF, ESI, TDS, and salary components for your organization
          </p>
        </div>
      </div>

      {message && (
        <div className={`rounded-2xl p-4 flex items-center gap-3 ${
          message.type === "success"
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
            : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:border-red-800"
        }`}>
          {message.type === "success" ? (
            <MdSave className="text-xl" />
          ) : (
            <MdWarning className="text-xl" />
          )}
          {message.text}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <MdMoney className="text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">PF Configuration</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Provident Fund settings</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Enable PF
              </label>
              <button
                type="button"
                onClick={() => handleChange("pfEnabled", !settings.pfEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.pfEnabled ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.pfEnabled ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            </div>

            {settings.pfEnabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Employee Contribution (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.pfRate}
                    onChange={(e) => handleChange("pfRate", parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Wage Ceiling (₹)
                  </label>
                  <input
                    type="number"
                    value={settings.pfWageCeiling}
                    onChange={(e) => handleChange("pfWageCeiling", parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    PF is applicable up to this wage limit (default: ₹15,000)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <MdMoney className="text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">ESI Configuration</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Employee State Insurance</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Enable ESI
              </label>
              <button
                type="button"
                onClick={() => handleChange("esiEnabled", !settings.esiEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.esiEnabled ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.esiEnabled ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            </div>

            {settings.esiEnabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Employee Contribution (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.esiRate}
                    onChange={(e) => handleChange("esiRate", parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Employer Contribution (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.esiEmployerRate}
                    onChange={(e) => handleChange("esiEmployerRate", parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Wage Ceiling (₹)
                  </label>
                  <input
                    type="number"
                    value={settings.esiWageCeiling}
                    onChange={(e) => handleChange("esiWageCeiling", parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    ESI is applicable up to this wage limit (default: ₹21,000)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <MdSettings className="text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">TDS Configuration</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Tax Deduction at Source</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Enable TDS
              </label>
              <button
                type="button"
                onClick={() => handleChange("tdsEnabled", !settings.tdsEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.tdsEnabled ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.tdsEnabled ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Professional Tax (₹)
              </label>
              <input
                type="number"
                value={settings.professionalTax}
                onChange={(e) => handleChange("professionalTax", parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Monthly professional tax deduction (varies by state)
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <MdSettings className="text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Default Salary Structure</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Components breakdown for new employees</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Basic Salary (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.defaultBasicPercent}
                onChange={(e) => handleChange("defaultBasicPercent", parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Percentage of gross salary (default: 40%)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                HRA (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.defaultHraPercent}
                onChange={(e) => handleChange("defaultHraPercent", parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                House Rent Allowance (default: 10%)
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-300/50 disabled:opacity-50 dark:shadow-indigo-900/30"
        >
          <MdSave className="text-lg" />
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}