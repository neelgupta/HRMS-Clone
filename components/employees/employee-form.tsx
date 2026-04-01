"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { MdArrowBack, MdSave, MdCloudUpload } from "react-icons/md";
import { Spinner } from "@/components/ui/loaders/spinner";
import { dismissToast, showError, showLoading, showSuccess } from "@/lib/toast";
import { createEmployee, updateEmployee, type EmployeeDetail } from "@/lib/client/employee";
import type { CreateEmployeeInput } from "@/lib/validations/employee";

const PREDEFINED_DEPARTMENTS = [
  "HR (Human Resources)",
  "IT / Development",
  "Sales & Marketing",
  "Finance / Accounts",
  "Operations",
  "Customer Support",
  "Admin",
  "Legal",
  "Research & Development",
  "Quality Assurance",
];

const PREDEFINED_DESIGNATIONS = [
  "Software Developer",
  "Senior Software Developer",
  "Team Lead",
  "Project Manager",
  "HR Executive",
  "HR Manager",
  "Sales Manager",
  "Sales Executive",
  "Accountant",
  "Senior Accountant",
  "Finance Manager",
  "Operations Manager",
  "Customer Support Executive",
  "Customer Support Manager",
  "Intern",
  "Trainee",
  "CEO",
  "CTO",
  "CFO",
  "Director",
  "Vice President",
];

type EmployeeFormProps = {
  employee?: EmployeeDetail | null;
  companyBranches?: Array<{ id: string; name: string }>;
  departments?: Array<{ id: string; name: string }>;
  designations?: Array<{ id: string; name: string }>;
  employees?: Array<{ id: string; firstName: string; lastName: string; department: string | null }>;
  onSuccess?: () => void;
};

const defaultValues: CreateEmployeeInput = {
  reportingManagerId: undefined,
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  photoUrl: undefined,
  branchId: undefined,
  dateOfBirth: undefined,
  gender: undefined,
  maritalStatus: undefined,
  bloodGroup: "",
  department: "",
  designation: "",
  dateOfJoining: undefined,
  employmentType: "FULL_TIME",
  employmentStatus: "PROBATION",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelation: "",
  presentAddressLine1: "",
  presentAddressLine2: "",
  presentCity: "",
  presentState: "",
  presentCountry: "India",
  presentPincode: "",
  permanentAddressLine1: "",
  permanentAddressLine2: "",
  permanentCity: "",
  permanentState: "",
  permanentCountry: "India",
  permanentPincode: "",
  bankAccountHolderName: "",
  bankAccountNumber: "",
  bankName: "",
  bankBranchName: "",
  bankIfscCode: "",
  panNumber: "",
  aadharNumber: "",
  pfNumber: "",
  pfUAN: "",
  esiNumber: "",
  education: [],
  workHistory: [],
};

export function EmployeeForm({ employee, companyBranches, departments, designations, employees, onSuccess }: EmployeeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateEmployeeInput>(
    employee
      ? {
          branchId: employee.branch?.id,
          reportingManagerId: employee.reportingManagerId || undefined,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.phone || "",
          photoUrl: employee.photoUrl || undefined,
          dateOfBirth: employee.dateOfBirth,
          gender: employee.gender as CreateEmployeeInput["gender"],
          maritalStatus: employee.maritalStatus as CreateEmployeeInput["maritalStatus"],
          bloodGroup: employee.bloodGroup || "",
          department: employee.department || "",
          designation: employee.designation || "",
          dateOfJoining: employee.dateOfJoining,
          employmentType: employee.employmentType as CreateEmployeeInput["employmentType"],
          employmentStatus: employee.employmentStatus as CreateEmployeeInput["employmentStatus"],
          emergencyContactName: employee.emergencyContactName || "",
          emergencyContactPhone: employee.emergencyContactPhone || "",
          emergencyContactRelation: employee.emergencyContactRelation || "",
          presentAddressLine1: employee.presentAddressLine1 || "",
          presentAddressLine2: employee.presentAddressLine2 || "",
          presentCity: employee.presentCity || "",
          presentState: employee.presentState || "",
          presentCountry: employee.presentCountry || "India",
          presentPincode: employee.presentPincode || "",
          permanentAddressLine1: employee.permanentAddressLine1 || "",
          permanentAddressLine2: employee.permanentAddressLine2 || "",
          permanentCity: employee.permanentCity || "",
          permanentState: employee.permanentState || "",
          permanentCountry: employee.permanentCountry || "India",
          permanentPincode: employee.permanentPincode || "",
          bankAccountHolderName: employee.bankAccountHolderName || "",
          bankAccountNumber: employee.bankAccountNumber || "",
          bankName: employee.bankName || "",
          bankBranchName: employee.bankBranchName || "",
          bankIfscCode: employee.bankIfscCode || "",
          panNumber: employee.panNumber || "",
          aadharNumber: employee.aadharNumber || "",
          pfNumber: employee.pfNumber || "",
          pfUAN: employee.pfUAN || "",
          esiNumber: employee.esiNumber || "",
          education: employee.education?.map((e) => ({
            id: e.id,
            degree: e.degree,
            institution: e.institution,
            yearOfPassing: e.yearOfPassing || undefined,
            percentage: e.percentage || undefined,
          })) || [],
          workHistory: employee.workHistory?.map((w) => ({
            id: w.id,
            companyName: w.companyName,
            designation: w.designation,
            startDate: w.startDate,
            endDate: w.endDate || undefined,
            isCurrent: w.isCurrent,
            reasonForLeaving: w.reasonForLeaving || undefined,
          })) || [],
        }
      : defaultValues
  );

  const updateField = useCallback((field: keyof CreateEmployeeInput, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.email) {
      showError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    const toastId = showLoading(employee ? "Updating employee..." : "Creating employee...");

    try {
      const result = employee
        ? await updateEmployee({ ...formData, id: employee.id } as Parameters<typeof updateEmployee>[0])
        : await createEmployee(formData);

      if (result.error) {
        dismissToast(toastId);
        showError(result.error);
        return;
      }

      dismissToast(toastId);
      showSuccess(employee ? "Employee updated successfully." : "Employee created successfully.");

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/dashboard/hr/employees/${result.data?.employee.id}`);
      }
    } catch {
      dismissToast(toastId);
      showError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError("Image size must be less than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateField("photoUrl", reader.result as string);
    };
    reader.readAsDataURL(file);
  }, [updateField]);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Personal Information</h3>
        <p className="mt-1 text-sm text-slate-500">Basic details about the employee.</p>

        <div className="mt-6 flex items-center gap-6">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-slate-50">
            {formData.photoUrl ? (
              <img src={formData.photoUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-400">
                <MdCloudUpload className="text-3xl" />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">Profile Photo</p>
            <p className="text-xs text-slate-500">Upload a photo (max 5MB)</p>
            {formData.photoUrl && (
              <button
                type="button"
                onClick={() => updateField("photoUrl", undefined)}
                className="mt-1 text-xs text-rose-500 hover:text-rose-600"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              First Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="First name"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Last Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="Last name"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="work@company.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Phone</label>
            <input
              type="tel"
              value={formData.phone || ""}
              onChange={(e) => updateField("phone", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="Phone number"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Date of Birth</label>
            <input
              type="date"
              value={formData.dateOfBirth || ""}
              onChange={(e) => updateField("dateOfBirth", e.target.value || undefined)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Gender</label>
            <select
              value={formData.gender || ""}
              onChange={(e) => updateField("gender", e.target.value || undefined)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="">Select gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Marital Status</label>
            <select
              value={formData.maritalStatus || ""}
              onChange={(e) => updateField("maritalStatus", e.target.value || undefined)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="">Select status</option>
              <option value="SINGLE">Single</option>
              <option value="MARRIED">Married</option>
              <option value="DIVORCED">Divorced</option>
              <option value="WIDOWED">Widowed</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Blood Group</label>
            <select
              value={formData.bloodGroup || ""}
              onChange={(e) => updateField("bloodGroup", e.target.value || undefined)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="">Select blood group</option>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Branch</label>
            <select
              value={formData.branchId || ""}
              onChange={(e) => updateField("branchId", e.target.value || undefined)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="">Select branch</option>
              {companyBranches?.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Employment Details</h3>
        <p className="mt-1 text-sm text-slate-500">Job role and employment information.</p>

        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Department</label>
            <select
              value={formData.department || ""}
              onChange={(e) => updateField("department", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="">Select department</option>
              {PREDEFINED_DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
              {departments
                ?.filter((dept) => !PREDEFINED_DEPARTMENTS.some((p) => p.toLowerCase() === dept.name.toLowerCase()))
                .map((dept) => dept.name)
                .filter((name, index, self) => self.indexOf(name) === index)
                .map((name, idx) => (
                  <option key={`custom-${name}-${idx}`} value={name}>{name}</option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Designation</label>
            <select
              value={formData.designation || ""}
              onChange={(e) => updateField("designation", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="">Select designation</option>
              {PREDEFINED_DESIGNATIONS.map((desig) => (
                <option key={desig} value={desig}>{desig}</option>
              ))}
              {designations
                ?.filter((desig) => !PREDEFINED_DESIGNATIONS.some((p) => p.toLowerCase() === desig.name.toLowerCase()))
                .map((desig) => desig.name)
                .filter((name, index, self) => self.indexOf(name) === index)
                .map((name, idx) => (
                  <option key={`custom-${name}-${idx}`} value={name}>{name}</option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Reporting Manager</label>
            <select
              value={formData.reportingManagerId || ""}
              onChange={(e) => updateField("reportingManagerId", e.target.value || undefined)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="">Select manager</option>
              {employees
                ?.filter((e) => e.id !== employee?.id)
                .map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} {emp.department ? `(${emp.department})` : ""}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Date of Joining</label>
            <input
              type="date"
              value={formData.dateOfJoining || ""}
              onChange={(e) => updateField("dateOfJoining", e.target.value || undefined)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Employment Type</label>
            <select
              value={formData.employmentType}
              onChange={(e) => updateField("employmentType", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="FULL_TIME">Full Time</option>
              <option value="PART_TIME">Part Time</option>
              <option value="CONTRACT">Contract</option>
              <option value="INTERNSHIP">Internship</option>
              <option value="PROBATION">Probation</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Employment Status</label>
            <select
              value={formData.employmentStatus}
              onChange={(e) => updateField("employmentStatus", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="PROBATION">Probation</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="TERMINATED">Terminated</option>
              <option value="RESIGNED">Resigned</option>
              <option value="RETIRED">Retired</option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Emergency Contact</h3>
        <p className="mt-1 text-sm text-slate-500">Contact person in case of emergency.</p>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Contact Name</label>
            <input
              type="text"
              value={formData.emergencyContactName || ""}
              onChange={(e) => updateField("emergencyContactName", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="Contact name"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Phone</label>
            <input
              type="tel"
              value={formData.emergencyContactPhone || ""}
              onChange={(e) => updateField("emergencyContactPhone", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="Phone number"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Relation</label>
            <input
              type="text"
              value={formData.emergencyContactRelation || ""}
              onChange={(e) => updateField("emergencyContactRelation", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="e.g., Spouse, Parent"
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Present Address</h3>
        <p className="mt-1 text-sm text-slate-500">Current residential address.</p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Address Line 1</label>
            <input
              type="text"
              value={formData.presentAddressLine1 || ""}
              onChange={(e) => updateField("presentAddressLine1", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="Street address"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Address Line 2</label>
            <input
              type="text"
              value={formData.presentAddressLine2 || ""}
              onChange={(e) => updateField("presentAddressLine2", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="Apartment, suite, etc."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">City</label>
            <input
              type="text"
              value={formData.presentCity || ""}
              onChange={(e) => updateField("presentCity", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="City"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">State</label>
            <input
              type="text"
              value={formData.presentState || ""}
              onChange={(e) => updateField("presentState", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="State"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Country</label>
            <input
              type="text"
              value={formData.presentCountry || "India"}
              onChange={(e) => updateField("presentCountry", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="Country"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Pincode</label>
            <input
              type="text"
              value={formData.presentPincode || ""}
              onChange={(e) => updateField("presentPincode", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="Pincode"
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Permanent Address</h3>
        <p className="mt-1 text-sm text-slate-500">Permanent residential address.</p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Address Line 1</label>
            <input
              type="text"
              value={formData.permanentAddressLine1 || ""}
              onChange={(e) => updateField("permanentAddressLine1", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="Street address"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Address Line 2</label>
            <input
              type="text"
              value={formData.permanentAddressLine2 || ""}
              onChange={(e) => updateField("permanentAddressLine2", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="Apartment, suite, etc."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">City</label>
            <input
              type="text"
              value={formData.permanentCity || ""}
              onChange={(e) => updateField("permanentCity", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="City"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">State</label>
            <input
              type="text"
              value={formData.permanentState || ""}
              onChange={(e) => updateField("permanentState", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="State"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Country</label>
            <input
              type="text"
              value={formData.permanentCountry || "India"}
              onChange={(e) => updateField("permanentCountry", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="Country"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Pincode</label>
            <input
              type="text"
              value={formData.permanentPincode || ""}
              onChange={(e) => updateField("permanentPincode", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="Pincode"
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Bank Details</h3>
        <p className="mt-1 text-sm text-slate-500">Employee bank account information for salary.</p>

        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Account Holder Name</label>
            <input
              type="text"
              value={formData.bankAccountHolderName || ""}
              onChange={(e) => updateField("bankAccountHolderName", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="Account holder name"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Account Number</label>
            <input
              type="text"
              value={formData.bankAccountNumber || ""}
              onChange={(e) => updateField("bankAccountNumber", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="Account number"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Bank Name</label>
            <input
              type="text"
              value={formData.bankName || ""}
              onChange={(e) => updateField("bankName", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="Bank name"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Branch Name</label>
            <input
              type="text"
              value={formData.bankBranchName || ""}
              onChange={(e) => updateField("bankBranchName", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="Branch name"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">IFSC Code</label>
            <input
              type="text"
              value={formData.bankIfscCode || ""}
              onChange={(e) => updateField("bankIfscCode", e.target.value.toUpperCase())}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="IFSC code"
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Identity Documents</h3>
        <p className="mt-1 text-sm text-slate-500">PAN, Aadhar, PF, and ESI details.</p>

        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">PAN Number</label>
            <input
              type="text"
              value={formData.panNumber || ""}
              onChange={(e) => updateField("panNumber", e.target.value.toUpperCase())}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="ABCDE1234F"
              maxLength={10}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Aadhar Number</label>
            <input
              type="text"
              value={formData.aadharNumber || ""}
              onChange={(e) => updateField("aadharNumber", e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="1234 5678 9012"
              maxLength={14}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">PF Number</label>
            <input
              type="text"
              value={formData.pfNumber || ""}
              onChange={(e) => updateField("pfNumber", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="PF number"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">PF UAN</label>
            <input
              type="text"
              value={formData.pfUAN || ""}
              onChange={(e) => updateField("pfUAN", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="UAN number"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">ESI Number</label>
            <input
              type="text"
              value={formData.esiNumber || ""}
              onChange={(e) => updateField("esiNumber", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="ESI number"
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Education</h3>
            <p className="mt-1 text-sm text-slate-500">Educational qualifications.</p>
          </div>
          <button
            type="button"
            onClick={() =>
              updateField("education", [
                ...(formData.education || []),
                { degree: "", institution: "", yearOfPassing: undefined, percentage: undefined },
              ])
            }
            className="rounded-xl bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-100"
          >
            + Add
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {formData.education?.map((edu, index) => (
            <div key={index} className="flex items-start gap-4 rounded-2xl border border-slate-200 p-4">
              <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Degree</label>
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => {
                      const updated = [...(formData.education || [])];
                      updated[index] = { ...updated[index], degree: e.target.value };
                      updateField("education", updated);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:bg-white"
                    placeholder="Degree"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Institution</label>
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) => {
                      const updated = [...(formData.education || [])];
                      updated[index] = { ...updated[index], institution: e.target.value };
                      updateField("education", updated);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:bg-white"
                    placeholder="Institution"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Year</label>
                  <input
                    type="number"
                    value={edu.yearOfPassing || ""}
                    onChange={(e) => {
                      const updated = [...(formData.education || [])];
                      updated[index] = { ...updated[index], yearOfPassing: parseInt(e.target.value) || undefined };
                      updateField("education", updated);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:bg-white"
                    placeholder="2020"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Percentage</label>
                  <input
                    type="number"
                    step="0.01"
                    value={edu.percentage || ""}
                    onChange={(e) => {
                      const updated = [...(formData.education || [])];
                      updated[index] = { ...updated[index], percentage: parseFloat(e.target.value) || undefined };
                      updateField("education", updated);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:bg-white"
                    placeholder="85%"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const updated = [...(formData.education || [])];
                  updated.splice(index, 1);
                  updateField("education", updated);
                }}
                className="mt-6 text-rose-500 hover:text-rose-600"
              >
                ×
              </button>
            </div>
          ))}
          {(!formData.education || formData.education.length === 0) && (
            <p className="text-center text-sm text-slate-400">No education added yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Work Experience</h3>
            <p className="mt-1 text-sm text-slate-500">Previous employment history.</p>
          </div>
          <button
            type="button"
            onClick={() =>
              updateField("workHistory", [
                ...(formData.workHistory || []),
                { companyName: "", designation: "", startDate: "", endDate: undefined, isCurrent: false, reasonForLeaving: undefined },
              ])
            }
            className="rounded-xl bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-100"
          >
            + Add
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {formData.workHistory?.map((work, index) => (
            <div key={index} className="flex items-start gap-4 rounded-2xl border border-slate-200 p-4">
              <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Company</label>
                  <input
                    type="text"
                    value={work.companyName}
                    onChange={(e) => {
                      const updated = [...(formData.workHistory || [])];
                      updated[index] = { ...updated[index], companyName: e.target.value };
                      updateField("workHistory", updated);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:bg-white"
                    placeholder="Company name"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Designation</label>
                  <input
                    type="text"
                    value={work.designation}
                    onChange={(e) => {
                      const updated = [...(formData.workHistory || [])];
                      updated[index] = { ...updated[index], designation: e.target.value };
                      updateField("workHistory", updated);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:bg-white"
                    placeholder="Designation"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Start Date</label>
                  <input
                    type="date"
                    value={work.startDate}
                    onChange={(e) => {
                      const updated = [...(formData.workHistory || [])];
                      updated[index] = { ...updated[index], startDate: e.target.value };
                      updateField("workHistory", updated);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">End Date</label>
                  <input
                    type="date"
                    value={work.endDate || ""}
                    disabled={work.isCurrent}
                    onChange={(e) => {
                      const updated = [...(formData.workHistory || [])];
                      updated[index] = { ...updated[index], endDate: e.target.value || undefined };
                      updateField("workHistory", updated);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:bg-white disabled:opacity-50"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={work.isCurrent}
                    onChange={(e) => {
                      const updated = [...(formData.workHistory || [])];
                      updated[index] = { ...updated[index], isCurrent: e.target.checked, endDate: e.target.checked ? undefined : updated[index].endDate };
                      updateField("workHistory", updated);
                    }}
                    className="mr-2 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    id={`current-${index}`}
                  />
                  <label htmlFor={`current-${index}`} className="text-sm text-slate-700">Currently working here</label>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const updated = [...(formData.workHistory || [])];
                  updated.splice(index, 1);
                  updateField("workHistory", updated);
                }}
                className="mt-6 text-rose-500 hover:text-rose-600"
              >
                ×
              </button>
            </div>
          ))}
          {(!formData.workHistory || formData.workHistory.length === 0) && (
            <p className="text-center text-sm text-slate-400">No work history added yet.</p>
          )}
        </div>
      </section>

      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <MdArrowBack className="text-lg" />
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? <Spinner className="text-white" label="Saving" /> : <MdSave className="text-lg" />}
          {loading ? "Saving..." : employee ? "Update Employee" : "Create Employee"}
        </button>
      </div>
    </form>
  );
}
