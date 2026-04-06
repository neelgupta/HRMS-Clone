"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Spinner } from "@/components/ui/loaders/spinner";
import { dismissToast, showError, showLoading, showSuccess } from "@/lib/toast";

type UploadFieldProps = {
  label: string;
  value: string;
  accept?: string;
  onUploaded: (url: string) => void;
};

export function UploadField({ label, value, accept = "image/*", onUploaded }: UploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);
    setError("");
    const toastId = showLoading("Uploading asset...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/company/upload", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as { message?: string; url?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.message || "Upload failed.");
      }

      onUploaded(data.url);
      dismissToast(toastId);
      showSuccess("Asset uploaded successfully.");
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Upload failed.";
      setError(message);
      dismissToast(toastId);
      showError(message);
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-700">{label}</p>
          <p className="mt-1 text-xs text-slate-500">{value ? "Uploaded and ready." : "Upload PNG, JPG, or SVG."}</p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold tracking-[0.2em] uppercase text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
        >
          {uploading ? <Spinner className="text-current" label="Uploading asset" /> : null}
          {uploading ? "Uploading..." : value ? "Replace" : "Upload"}
        </button>
      </div>

      {value ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={label} className="h-24 w-full rounded-xl object-contain bg-slate-50" />
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
    </div>
  );
}
