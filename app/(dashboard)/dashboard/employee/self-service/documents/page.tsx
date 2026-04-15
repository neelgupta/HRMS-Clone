"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  MdDescription,
  MdDownload,
  MdPictureAsPdf,
  MdInsertDriveFile,
  MdWork,
  MdReceipt,
  MdArticle,
  MdFileCopy,
} from "react-icons/md";
import { EmployeeLayout } from "@/components/employee";

type Document = {
  id: string;
  name: string;
  type: string;
  category: "OFFER_LETTER" | "APPOINTMENT_LETTER" | "CONTRACT" | "FORM_16" | "TAX_DOCUMENT" | "OTHER";
  url: string | null;
  createdAt: string;
};

const documentCategories = {
  OFFER_LETTER: { label: "Offer Letter", icon: MdWork, color: "indigo" },
  APPOINTMENT_LETTER: { label: "Appointment Letter", icon: MdWork, color: "purple" },
  CONTRACT: { label: "Contract", icon: MdDescription, color: "blue" },
  FORM_16: { label: "Form 16", icon: MdReceipt, color: "emerald" },
  TAX_DOCUMENT: { label: "Tax Documents", icon: MdArticle, color: "amber" },
  OTHER: { label: "Other Documents", icon: MdFileCopy, color: "slate" },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getFileExtension(url: string): string {
  const match = url.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : "";
}

function getFileIcon(extension: string) {
  switch (extension) {
    case "pdf":
      return <MdPictureAsPdf className="text-rose-500" />;
    case "doc":
    case "docx":
      return <MdDescription className="text-blue-500" />;
    case "xls":
    case "xlsx":
      return <MdInsertDriveFile className="text-emerald-500" />;
    default:
      return <MdInsertDriveFile className="text-slate-500" />;
  }
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const res = await fetch("/api/employees/documents", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setDocuments(data.documents || []);
        } else {
          setDocuments([]);
        }
      } catch {
        toast.error("Failed to load documents");
      } finally {
        setLoading(false);
      }
    };
    void loadDocuments();
  }, []);

  const handleDownload = (doc: Document) => {
    if (doc.url) {
      window.open(doc.url, "_blank");
      toast.success("Download started");
    } else {
      toast.error("Document not available for download");
    }
  };

  const filteredDocuments = filter === "all" ? documents : documents.filter((d) => d.category === filter);

  const groupedDocuments = filteredDocuments.reduce((acc, doc) => {
    const category = doc.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  const documentCounts = Object.entries(documentCategories).reduce((acc, [key]) => {
    acc[key] = documents.filter((d) => d.category === key).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <EmployeeLayout title="Document Access" subtitle="View and download your offer letter, contracts, and tax documents">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <button
            onClick={() => setFilter("all")}
            className={`p-4 rounded-2xl border transition-all ${
              filter === "all"
                ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800"
            }`}
          >
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{documents.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">All Documents</p>
          </button>
          {Object.entries(documentCategories).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`p-4 rounded-2xl border transition-all ${
                filter === key
                  ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl bg-${cat.color}-100 dark:bg-${cat.color}-900/30 flex items-center justify-center mx-auto mb-2`}>
                <cat.icon className={`text-${cat.color}-600 dark:text-${cat.color}-400`} />
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{documentCounts[key]}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{cat.label}</p>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading documents...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <MdDescription className="mx-auto text-5xl text-slate-300 dark:text-slate-600" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">No Documents Found</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {filter === "all"
                ? "Your documents will appear here once they are uploaded by HR."
                : `No ${documentCategories[filter as keyof typeof documentCategories]?.label || "documents"} found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedDocuments).map(([category, docs]) => {
              const catInfo = documentCategories[category as keyof typeof documentCategories];
              if (!catInfo) return null;
              const Icon = catInfo.icon;
              return (
                <div key={category} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-${catInfo.color}-100 dark:bg-${catInfo.color}-900/30 flex items-center justify-center`}>
                      <Icon className={`text-${catInfo.color}-600 dark:text-${catInfo.color}-400`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{catInfo.label}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{docs.length} document{docs.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {docs.map((doc) => {
                        const extension = doc.url ? getFileExtension(doc.url) : "";
                        return (
                          <div
                            key={doc.id}
                            className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors group"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                {doc.url ? getFileIcon(extension) : <MdInsertDriveFile className="text-slate-400" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-900 dark:text-white truncate">{doc.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  Uploaded: {formatDate(doc.createdAt)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-4">
                              {doc.url ? (
                                <>
                                  <button
                                    onClick={() => setPreviewDoc(doc)}
                                    className="flex-1 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg transition-colors"
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={() => handleDownload(doc)}
                                    className="flex-1 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg transition-colors"
                                  >
                                    <MdDownload className="inline mr-1" /> Download
                                  </button>
                                </>
                              ) : (
                                <span className="text-xs text-slate-400 dark:text-slate-500">Not available</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {previewDoc && previewDoc.url && (
          <div className="fixed inset-0 bg-black/70 dark:bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setPreviewDoc(null)}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white">{previewDoc.name}</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(previewDoc)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-xl transition-colors"
                  >
                    <MdDownload /> Download
                  </button>
                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
                <iframe src={previewDoc.url} className="w-full h-[600px] border-0" title={previewDoc.name} />
              </div>
            </div>
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
}
