import type {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  EmployeeSearchInput,
} from "@/lib/validations/employee";

export type EmployeeListItem = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  photoUrl: string | null;
  department: string | null;
  designation: string | null;
  employmentType: string;
  employmentStatus: string;
  dateOfJoining: string | null;
  branch: { id: string; name: string } | null;
};

export type EmployeeDetail = EmployeeListItem & {
  dateOfBirth: string | null;
  gender: string | null;
  maritalStatus: string | null;
  bloodGroup: string | null;
  dateOfLeaving: string | null;
  photoUrl: string | null;
  reportingManagerId: string | null;
  basicSalary: number | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  presentAddressLine1: string | null;
  presentAddressLine2: string | null;
  presentCity: string | null;
  presentState: string | null;
  presentCountry: string | null;
  presentPincode: string | null;
  permanentAddressLine1: string | null;
  permanentAddressLine2: string | null;
  permanentCity: string | null;
  permanentState: string | null;
  permanentCountry: string | null;
  permanentPincode: string | null;
  bankAccountHolderName: string | null;
  bankAccountNumber: string | null;
  bankName: string | null;
  bankBranchName: string | null;
  bankIfscCode: string | null;
  panNumber: string | null;
  aadharNumber: string | null;
  pfNumber: string | null;
  pfUAN: string | null;
  esiNumber: string | null;
  education: Array<{
    id: string;
    degree: string;
    institution: string;
    yearOfPassing: number | null;
    percentage: number | null;
  }>;
  workHistory: Array<{
    id: string;
    companyName: string;
    designation: string;
    startDate: string;
    endDate: string | null;
    isCurrent: boolean;
    reasonForLeaving: string | null;
  }>;
  documents: Array<{
    id: string;
    type: string;
    name: string;
    fileUrl: string;
    fileSize: number | null;
    expiryDate: string | null;
    version: number;
    isExpired: boolean;
    createdAt: string;
  }>;
  user: {
    id: string;
    email: string;
    status: string;
  } | null;
};

export type EmployeeStats = {
  total: number;
  byDepartment: Array<{ department: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
  byEmploymentType: Array<{ type: string; count: number }>;
  expiringDocuments: Array<{
    id: string;
    name: string;
    type: string;
    expiryDate: string;
    employee: { id: string; firstName: string; lastName: string };
  }>;
};

type ApiResponse<T> = {
  data?: T;
  error?: string;
};

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export async function fetchEmployees(params: EmployeeSearchInput): Promise<ApiResponse<{
  employees: EmployeeListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>> {
  try {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set("search", params.search);
    if (params.department) searchParams.set("department", params.department);
    if (params.designation) searchParams.set("designation", params.designation);
    if (params.employmentType) searchParams.set("employmentType", params.employmentType);
    if (params.employmentStatus) searchParams.set("employmentStatus", params.employmentStatus);
    if (params.branchId) searchParams.set("branchId", params.branchId);
    searchParams.set("page", String(params.page));
    searchParams.set("limit", String(params.limit));

    const response = await fetch(`/api/employees?${searchParams.toString()}`);

    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to fetch employees." };
    }

    const data = await parseJson<{
      employees: EmployeeListItem[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(response);

    return { data };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function fetchEmployeeById(id: string): Promise<ApiResponse<EmployeeDetail>> {
  try {
    const response = await fetch(`/api/employees/${id}`);

    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to fetch employee." };
    }

    const data = await parseJson<EmployeeDetail>(response);
    return { data };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export type LoginCredentials = {
  email: string;
  tempPassword: string;
  userId: string;
};

export type CreateEmployeeResponse = {
  employee: EmployeeDetail;
  loginCredentials?: LoginCredentials;
};

export async function createEmployee(values: CreateEmployeeInput): Promise<ApiResponse<CreateEmployeeResponse>> {
  try {
    const response = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to create employee." };
    }

    const data = await parseJson<CreateEmployeeResponse>(response);
    return { data };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function updateEmployee(values: UpdateEmployeeInput): Promise<ApiResponse<CreateEmployeeResponse>> {
  try {
    const response = await fetch(`/api/employees/${values.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to update employee." };
    }

    const data = await parseJson<CreateEmployeeResponse>(response);
    return { data };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function deleteEmployee(id: string): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`/api/employees/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to delete employee." };
    }

    return {};
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function uploadEmployeeDocument(
  formData: FormData,
): Promise<ApiResponse<{ document: unknown }>> {
  try {
    const response = await fetch("/api/employees/documents", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to upload document." };
    }

    const data = await parseJson<{ document: unknown }>(response);
    return { data };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function deleteEmployeeDocument(documentId: string): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`/api/employees/documents/${documentId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to delete document." };
    }

    return {};
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function fetchEmployeeStats(): Promise<ApiResponse<EmployeeStats>> {
  try {
    const response = await fetch("/api/employees/stats");

    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to fetch stats." };
    }

    const data = await parseJson<EmployeeStats>(response);
    return { data };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function exportEmployeesCSV(): Promise<ApiResponse<string>> {
  try {
    const response = await fetch("/api/employees/export");

    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to export employees." };
    }

    const csv = await response.text();
    return { data: csv };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export type UpdateCredentialsInput = {
  email?: string;
  password?: string;
};

export type UpdateCredentialsResponse = {
  email: string;
  message: string;
};

export async function updateEmployeeCredentials(
  employeeId: string,
  values: UpdateCredentialsInput,
): Promise<ApiResponse<UpdateCredentialsResponse>> {
  try {
    const response = await fetch(`/api/employees/${employeeId}/credentials`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to update credentials." };
    }

    const data = await parseJson<UpdateCredentialsResponse>(response);
    return { data };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}
