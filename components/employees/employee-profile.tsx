"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MdEdit, MdDelete, MdUpload, MdWarning, MdVisibility, MdKey, MdCheck, MdContentCopy, MdClose } from "react-icons/md";
import { dismissToast, showError, showLoading, showSuccess } from "@/lib/toast";
import { deleteEmployee, uploadEmployeeDocument, deleteEmployeeDocument, updateEmployeeCredentials, type EmployeeDetail } from "@/lib/client/employee";
import { ROUTES } from "@/lib/constants";

type EmployeeProfileProps = {
  employee: EmployeeDetail;
  onUpdate?: () => void;
};

export function EmployeeProfile({ employee, onUpdate }: EmployeeProfileProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [pendingUploads, setPendingUploads] = useState<Array<{ file: File; preview: string }>>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [credentialEmail, setCredentialEmail] = useState(employee.user?.email || "");
  const [credentialPassword, setCredentialPassword] = useState("");
  const [updatingCredentials, setUpdatingCredentials] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleDelete = async () => {
    setDeleting(true);
    const toastId = showLoading("Deleting employee...");

    try {
      const result = await deleteEmployee(employee.id);

      if (result.error) {
        dismissToast(toastId);
        showError(result.error);
        return;
      }

      dismissToast(toastId);
      showSuccess("Employee deleted successfully.");
      router.push(ROUTES.DASHBOARD.HR.EMPLOYEES.LIST);
    } catch {
      dismissToast(toastId);
      showError("Something went wrong. Please try again.");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const isImageFile = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext || "");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newPreviews = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setPendingUploads((prev) => [...prev, ...newPreviews]);
    e.target.value = "";
  };

  const handleUploadPendingFiles = async () => {
    if (pendingUploads.length === 0) return;

    setUploadingDoc(true);
    const toastId = showLoading(`Uploading ${pendingUploads.length} document(s)...`);

    try {
      for (const { file } of pendingUploads) {
        const formData = new FormData();
        formData.append("employeeId", employee.id);
        formData.append("type", "OTHER");
        formData.append("name", file.name);
        formData.append("file", file);

        const result = await uploadEmployeeDocument(formData);

        if (result.error) {
          dismissToast(toastId);
          showError(result.error);
          return;
        }
      }

      dismissToast(toastId);
      showSuccess("Documents uploaded successfully.");
      setPendingUploads([]);
      if (onUpdate) {
        onUpdate();
      }
    } catch {
      dismissToast(toastId);
      showError("Something went wrong. Please try again.");
    } finally {
      setUploadingDoc(false);
    }
  };

  const removePendingUpload = (index: number) => {
    setPendingUploads((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleDocumentDelete = async (documentId: string) => {
    const toastId = showLoading("Deleting document...");

    try {
      const result = await deleteEmployeeDocument(documentId);

      if (result.error) {
        dismissToast(toastId);
        showError(result.error);
        return;
      }

      dismissToast(toastId);
      showSuccess("Document deleted successfully.");

      if (onUpdate) {
        onUpdate();
      }
    } catch {
      dismissToast(toastId);
      showError("Something went wrong. Please try again.");
    }
  };

  const handleUpdateCredentials = async () => {
    if (!credentialEmail && !credentialPassword) {
      showError("Provide at least email or password to update.");
      return;
    }

    if (credentialEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentialEmail)) {
      showError("Invalid email address.");
      return;
    }

    if (credentialPassword && credentialPassword.length < 6) {
      showError("Password must be at least 6 characters.");
      return;
    }

    setUpdatingCredentials(true);
    const toastId = showLoading("Updating credentials...");

    try {
      const result = await updateEmployeeCredentials(employee.id, {
        email: credentialEmail || undefined,
        password: credentialPassword || undefined,
      });

      if (result.error) {
        dismissToast(toastId);
        showError(result.error);
        return;
      }

      dismissToast(toastId);
      showSuccess(result.data?.message || "Credentials updated successfully.");
      setCredentialPassword("");
      setShowCredentialsModal(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch {
      dismissToast(toastId);
      showError("Something went wrong. Please try again.");
    } finally {
      setUpdatingCredentials(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PROBATION: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      CONFIRMED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      TERMINATED: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
      RESIGNED: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
      RETIRED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    };
    return styles[status] || "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
  };

  const documentTypeLabels: Record<string, string> = {
    AADHAR_CARD: "Aadhar Card",
    PAN_CARD: "PAN Card",
    PASSPORT: "Passport",
    DRIVING_LICENSE: "Driving License",
    VOTER_ID: "Voter ID",
    BANK_PASSBOOK: "Bank Passbook",
    EDUCATION_CERTIFICATE: "Education Certificate",
    EXPERIENCE_LETTER: "Experience Letter",
    OFFER_LETTER: "Offer Letter",
    APPOINTMENT_LETTER: "Appointment Letter",
    SALARY_SLIP: "Salary Slip",
    FORM_16: "Form 16",
    PF_DOCUMENT: "PF Document",
    ESI_DOCUMENT: "ESI Document",
    PHOTO: "Photo",
    SIGNATURE: "Signature",
    OTHER: "Other",
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xl font-semibold text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50">
            {employee.photoUrl ? (
              <Image
                src={employee.photoUrl}
                alt={`${employee.firstName} ${employee.lastName}`}
                fill
                className="object-cover"
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center">
                {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                {employee.firstName} {employee.lastName}
              </h2>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(employee.employmentStatus)}`}>
                {employee.employmentStatus}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {employee.employeeCode} • {employee.designation || "No designation"} • {employee.department || "No department"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setCredentialEmail(employee.user?.email || "");
              setCredentialPassword("");
              setShowCredentialsModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50 dark:border-indigo-700 dark:bg-slate-800 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
          >
            <MdKey className="text-lg" />
            Credentials
          </button>

          <button
            type="button"
            onClick={() => router.push(ROUTES.DASHBOARD.HR.EMPLOYEES.EDIT(employee.id))}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <MdEdit className="text-lg" />
            Edit
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:border-rose-700 dark:bg-slate-800 dark:text-rose-400 dark:hover:bg-rose-900/20"
          >
            <MdDelete className="text-lg" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Personal Information</h3>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <InfoItem label="Email" value={employee.email} />
              <InfoItem label="Phone" value={employee.phone} />
              <InfoItem label="Date of Birth" value={formatDate(employee.dateOfBirth)} />
              <InfoItem label="Gender" value={employee.gender} />
              <InfoItem label="Marital Status" value={employee.maritalStatus} />
              <InfoItem label="Blood Group" value={employee.bloodGroup} />
              <InfoItem label="Branch" value={employee.branch?.name} />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Employment Details</h3>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <InfoItem label="Department" value={employee.department} />
              <InfoItem label="Designation" value={employee.designation} />
              <InfoItem label="Employment Type" value={employee.employmentType} />
              <InfoItem label="Date of Joining" value={formatDate(employee.dateOfJoining)} />
              <InfoItem label="Date of Leaving" value={formatDate(employee.dateOfLeaving)} />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Emergency Contact</h3>

            <div className="mt-6 grid gap-5 md:grid-cols-3">
              <InfoItem label="Name" value={employee.emergencyContactName} />
              <InfoItem label="Phone" value={employee.emergencyContactPhone} />
              <InfoItem label="Relation" value={employee.emergencyContactRelation} />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Bank Details</h3>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <InfoItem label="Account Holder" value={employee.bankAccountHolderName} />
              <InfoItem label="Account Number" value={employee.bankAccountNumber} />
              <InfoItem label="Bank Name" value={employee.bankName} />
              <InfoItem label="Branch" value={employee.bankBranchName} />
              <InfoItem label="IFSC Code" value={employee.bankIfscCode} />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Identity & Documents</h3>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <InfoItem label="PAN Number" value={employee.panNumber} />
              <InfoItem label="Aadhar Number" value={employee.aadharNumber} />
              <InfoItem label="PF Number" value={employee.pfNumber} />
              <InfoItem label="PF UAN" value={employee.pfUAN} />
              <InfoItem label="ESI Number" value={employee.esiNumber} />
            </div>

            <div className="mt-6 border-t border-slate-100 pt-6 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-slate-900 dark:text-white">Uploaded Documents</h4>
                <div className="flex items-center gap-2">
                  {pendingUploads.length > 0 && (
                    <button
                      type="button"
                      onClick={handleUploadPendingFiles}
                      disabled={uploadingDoc}
                      className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-indigo-500"
                    >
                      <MdUpload className="text-lg" />
                      {uploadingDoc ? "Uploading..." : `Upload ${pendingUploads.length} file(s)`}
                    </button>
                  )}
                  <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                    <MdUpload className="text-lg" />
                    Select Files
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.bmp"
                      onChange={handleFileSelect}
                      disabled={uploadingDoc}
                      multiple
                    />
                  </label>
                </div>
              </div>

              {pendingUploads.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">Pending Upload Preview</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {pendingUploads.map((upload, index) => (
                      <div key={index} className="group relative rounded-xl border border-slate-200 bg-slate-50 overflow-hidden dark:border-slate-600 dark:bg-slate-700">
                        {isImageFile(upload.file.name) ? (
                          <div className="aspect-square relative">
                            <Image
                              src={upload.preview}
                              alt={upload.file.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex aspect-square items-center justify-center">
                            <span className="text-4xl font-semibold uppercase text-slate-400 dark:text-slate-500">
                              {upload.file.name.split(".").pop()}
                            </span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removePendingUpload(index)}
                          className="absolute right-1 top-1 rounded-full bg-rose-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <MdDelete className="text-sm" />
                        </button>
                        <p className="truncate px-2 py-1 text-xs text-slate-600 dark:text-slate-300">{upload.file.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {employee.documents.length === 0 && pendingUploads.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No documents uploaded yet.</p>
              ) : (
                <div className="space-y-2">
                  {employee.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-700/50">
                      <div className="flex items-center gap-3">
                        {isImageFile(doc.name) && doc.fileUrl ? (
                          <button
                            type="button"
                            onClick={() => setLightboxImage(doc.fileUrl)}
                            className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-600"
                          >
                            <Image
                              src={doc.fileUrl}
                              alt={doc.name}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 opacity-0 transition-opacity hover:opacity-100">
                              <MdVisibility className="text-white text-lg" />
                            </div>
                          </button>
                        ) : (
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800">
                            <span className="text-sm font-semibold uppercase text-slate-400 dark:text-slate-500">
                              {doc.name.split(".").pop()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{doc.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {documentTypeLabels[doc.type] || doc.type} • {formatDate(doc.expiryDate)}
                            {doc.isExpired && <span className="ml-2 text-rose-500 dark:text-rose-400">Expired</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isImageFile(doc.name) && doc.fileUrl && (
                          <button
                            type="button"
                            onClick={() => setLightboxImage(doc.fileUrl)}
                            className="text-slate-500 hover:text-indigo-600 dark:text-slate-400"
                          >
                            <MdVisibility />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDocumentDelete(doc.id)}
                          className="text-sm text-rose-600 hover:text-rose-500 dark:text-rose-400"
                        >
                          <MdDelete />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Education</h3>

            {employee.education.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No education records.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {employee.education.map((edu) => (
                  <div key={edu.id} className="border-l-2 border-indigo-200 pl-4 dark:border-indigo-800">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{edu.degree}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{edu.institution}</p>
                    {edu.yearOfPassing && (
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Passed: {edu.yearOfPassing}</p>
                    )}
                    {edu.percentage && (
                      <p className="text-xs text-slate-400 dark:text-slate-500">Percentage: {edu.percentage}%</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Work History</h3>

            {employee.workHistory.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No work history records.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {employee.workHistory.map((wh) => (
                  <div key={wh.id} className="border-l-2 border-indigo-200 pl-4 dark:border-indigo-800">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{wh.designation}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{wh.companyName}</p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      {formatDate(wh.startDate)} - {wh.isCurrent ? "Present" : formatDate(wh.endDate)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm dark:bg-slate-950/70">
          <div className="mx-4 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <MdWarning className="text-2xl" />
              <h3 className="text-lg font-semibold dark:text-white">Confirm Delete</h3>
            </div>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
              Are you sure you want to delete <strong className="dark:text-white">{employee.firstName} {employee.lastName}</strong>? The employee will be deactivated and will no longer be able to access the system.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              >
                No
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-rose-500"
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
          >
            <MdClose className="text-xl" />
          </button>
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={lightboxImage}
              alt="Document preview"
              width={1200}
              height={800}
              className="max-h-[90vh] w-auto rounded-2xl object-contain"
            />
          </div>
        </div>
      )}

      {showCredentialsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm dark:bg-slate-950/70">
          <div className="mx-4 w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
                <MdKey className="text-2xl" />
                <h3 className="text-lg font-semibold dark:text-white">User Credentials</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCredentialsModal(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
              >
                <MdClose className="text-xl" />
              </button>
            </div>

            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Update the login credentials for <strong className="dark:text-white">{employee.firstName} {employee.lastName}</strong>. Leave password blank to keep the current one.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  User Email
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="email"
                    value={credentialEmail}
                    onChange={(e) => setCredentialEmail(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-blue-400 dark:focus:bg-slate-700 dark:focus:ring-blue-900"
                    placeholder="employee@company.com"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(credentialEmail);
                      setCopiedField("email");
                      setTimeout(() => setCopiedField(null), 2000);
                    }}
                    className="flex-shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-600 dark:text-slate-300 dark:hover:bg-slate-500"
                  >
                    {copiedField === "email" ? <MdCheck className="text-green-600" /> : <MdContentCopy />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  New Password
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={credentialPassword}
                    onChange={(e) => setCredentialPassword(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-blue-400 dark:focus:bg-slate-700 dark:focus:ring-blue-900"
                    placeholder="Leave blank to keep current"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="flex-shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-600 dark:text-slate-300 dark:hover:bg-slate-500"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                  {credentialPassword && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(credentialPassword);
                        setCopiedField("password");
                        setTimeout(() => setCopiedField(null), 2000);
                      }}
                      className="flex-shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-600 dark:text-slate-300 dark:hover:bg-slate-500"
                    >
                      {copiedField === "password" ? <MdCheck className="text-green-600" /> : <MdContentCopy />}
                    </button>
                  )}
                </div>
              </div>

              {employee.user && (
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Current Status: <span className="font-medium text-slate-700 dark:text-slate-300">{employee.user.status}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCredentialsModal(false)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateCredentials}
                disabled={updatingCredentials}
                className="rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-indigo-500"
              >
                {updatingCredentials ? "Updating..." : "Update Credentials"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-900 dark:text-white">{value || "—"}</p>
    </div>
  );
}
