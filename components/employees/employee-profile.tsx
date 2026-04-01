"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MdEdit, MdDelete, MdUpload, MdWarning } from "react-icons/md";
import { dismissToast, showError, showLoading, showSuccess } from "@/lib/toast";
import { deleteEmployee, uploadEmployeeDocument, deleteEmployeeDocument, type EmployeeDetail } from "@/lib/client/employee";

type EmployeeProfileProps = {
  employee: EmployeeDetail;
  onUpdate?: () => void;
};

export function EmployeeProfile({ employee, onUpdate }: EmployeeProfileProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

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
      router.push("/dashboard/hr/employees");
    } catch {
      dismissToast(toastId);
      showError("Something went wrong. Please try again.");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    const toastId = showLoading("Uploading document...");

    try {
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

      dismissToast(toastId);
      showSuccess("Document uploaded successfully.");

      if (onUpdate) {
        onUpdate();
      }
    } catch {
      dismissToast(toastId);
      showError("Something went wrong. Please try again.");
    } finally {
      setUploadingDoc(false);
      e.target.value = "";
    }
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

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PROBATION: "bg-amber-100 text-amber-700",
      CONFIRMED: "bg-emerald-100 text-emerald-700",
      TERMINATED: "bg-rose-100 text-rose-700",
      RESIGNED: "bg-slate-100 text-slate-700",
      RETIRED: "bg-blue-100 text-blue-700",
    };
    return styles[status] || "bg-slate-100 text-slate-700";
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
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xl font-semibold text-white shadow-lg shadow-indigo-200">
            {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold text-slate-900">
                {employee.firstName} {employee.lastName}
              </h2>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(employee.employmentStatus)}`}>
                {employee.employmentStatus}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {employee.employeeCode} • {employee.designation || "No designation"} • {employee.department || "No department"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/hr/employees/${employee.id}/edit`)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <MdEdit className="text-lg" />
            Edit
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
          >
            <MdDelete className="text-lg" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Personal Information</h3>

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

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Employment Details</h3>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <InfoItem label="Department" value={employee.department} />
              <InfoItem label="Designation" value={employee.designation} />
              <InfoItem label="Employment Type" value={employee.employmentType} />
              <InfoItem label="Date of Joining" value={formatDate(employee.dateOfJoining)} />
              <InfoItem label="Date of Leaving" value={formatDate(employee.dateOfLeaving)} />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Emergency Contact</h3>

            <div className="mt-6 grid gap-5 md:grid-cols-3">
              <InfoItem label="Name" value={employee.emergencyContactName} />
              <InfoItem label="Phone" value={employee.emergencyContactPhone} />
              <InfoItem label="Relation" value={employee.emergencyContactRelation} />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Bank Details</h3>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <InfoItem label="Account Holder" value={employee.bankAccountHolderName} />
              <InfoItem label="Account Number" value={employee.bankAccountNumber} />
              <InfoItem label="Bank Name" value={employee.bankName} />
              <InfoItem label="Branch" value={employee.bankBranchName} />
              <InfoItem label="IFSC Code" value={employee.bankIfscCode} />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Identity & Documents</h3>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <InfoItem label="PAN Number" value={employee.panNumber} />
              <InfoItem label="Aadhar Number" value={employee.aadharNumber} />
              <InfoItem label="PF Number" value={employee.pfNumber} />
              <InfoItem label="PF UAN" value={employee.pfUAN} />
              <InfoItem label="ESI Number" value={employee.esiNumber} />
            </div>

            <div className="mt-6 border-t border-slate-100 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-slate-900">Uploaded Documents</h4>
                <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 cursor-pointer">
                  <MdUpload className="text-lg" />
                  {uploadingDoc ? "Uploading..." : "Upload"}
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleDocumentUpload}
                    disabled={uploadingDoc}
                  />
                </label>
              </div>

              {employee.documents.length === 0 ? (
                <p className="text-sm text-slate-500">No documents uploaded yet.</p>
              ) : (
                <div className="space-y-2">
                  {employee.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                        <p className="text-xs text-slate-500">
                          {documentTypeLabels[doc.type] || doc.type} • {formatDate(doc.expiryDate)}
                          {doc.isExpired && <span className="ml-2 text-rose-500">Expired</span>}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDocumentDelete(doc.id)}
                        className="text-sm text-rose-600 hover:text-rose-500"
                      >
                        <MdDelete />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Education</h3>

            {employee.education.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No education records.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {employee.education.map((edu) => (
                  <div key={edu.id} className="border-l-2 border-indigo-200 pl-4">
                    <p className="text-sm font-medium text-slate-900">{edu.degree}</p>
                    <p className="text-xs text-slate-500">{edu.institution}</p>
                    {edu.yearOfPassing && (
                      <p className="mt-1 text-xs text-slate-400">Passed: {edu.yearOfPassing}</p>
                    )}
                    {edu.percentage && (
                      <p className="text-xs text-slate-400">Percentage: {edu.percentage}%</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Work History</h3>

            {employee.workHistory.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No work history records.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {employee.workHistory.map((wh) => (
                  <div key={wh.id} className="border-l-2 border-indigo-200 pl-4">
                    <p className="text-sm font-medium text-slate-900">{wh.designation}</p>
                    <p className="text-xs text-slate-500">{wh.companyName}</p>
                    <p className="mt-1 text-xs text-slate-400">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 text-rose-600">
              <MdWarning className="text-2xl" />
              <h3 className="text-lg font-semibold">Delete Employee</h3>
            </div>
            <p className="mt-4 text-sm text-slate-600">
              Are you sure you want to delete <strong>{employee.firstName} {employee.lastName}</strong>? This action cannot be undone and will permanently remove all employee data.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
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
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-slate-900">{value || "—"}</p>
    </div>
  );
}
