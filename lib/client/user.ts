export type UserWithEmployee = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  companyId: string;
  branchId: string | null;
  employeeId: string | null;
  branch: {
    id: string;
    name: string;
    city: string;
  } | null;
  company: {
    id: string;
    name: string;
    status: string;
    setupCompleted: boolean;
  };
  employee: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    designation: string | null;
    department: string | null;
    employmentType: string;
    employmentStatus: string;
    dateOfJoining: string | null;
    dateOfLeaving: string | null;
    branch: {
      id: string;
      name: string;
    } | null;
    department: {
      id: string;
      name: string;
    } | null;
    designation: {
      id: string;
      name: string;
    } | null;
    documents: Array<{
      id: string;
      type: string;
      name: string;
      expiryDate: string;
    }>;
    education: Array<{
      id: string;
      degree: string;
      institution: string;
      yearOfPassing: number | null;
    }>;
    workHistory: Array<{
      id: string;
      companyName: string;
      designation: string;
      startDate: string;
      endDate: string | null;
    }>;
  } | null;
};

type ApiResponse<T> = {
  data?: T;
  error?: string;
};

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export async function fetchCurrentUserWithEmployee(): Promise<ApiResponse<UserWithEmployee>> {
  try {
    const response = await fetch("/api/auth/me");

    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Unauthorized." };
    }

    const data = await parseJson<UserWithEmployee>(response);
    return { data };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function fetchUserById(id: string): Promise<ApiResponse<UserWithEmployee>> {
  try {
    const response = await fetch(`/api/users/${id}`);

    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to fetch user." };
    }

    const data = await parseJson<UserWithEmployee>(response);
    return { data };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function linkUserToEmployee(
  userId: string,
  employeeId: string,
): Promise<ApiResponse<UserWithEmployee>> {
  try {
    const response = await fetch(`/api/users/${userId}/link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId }),
    });

    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to link user." };
    }

    const data = await parseJson<UserWithEmployee>(response);
    return { data };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function fetchUnlinkedEmployees(): Promise<
  ApiResponse<
    Array<{
      id: string;
      employeeCode: string;
      firstName: string;
      lastName: string;
      email: string;
      designation: string | null;
      department: string | null;
    }>
  >
> {
  try {
    const response = await fetch("/api/users/unlinked-employees");

    if (!response.ok) {
      const data = await parseJson<{ message?: string }>(response);
      return { error: data.message || "Failed to fetch unlinked employees." };
    }

    const data = await parseJson<
      Array<{
        id: string;
        employeeCode: string;
        firstName: string;
        lastName: string;
        email: string;
        designation: string | null;
        department: string | null;
      }>
    >(response);
    return { data };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}
