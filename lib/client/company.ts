import type { CompanySetupInput } from "@/lib/validations/company";
export { getDefaultCompanySetupValues } from "@/lib/company-defaults";

export type CurrentUser = {
  userId: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
  companyName: string;
};

export type CompanySetupRecord = {
  id: string;
  setupCompleted: boolean;
  status: string;
  values: CompanySetupInput;
};

export type CompanyResponse = {
  company: CompanySetupRecord | null;
};

type ApiErrorResponse = {
  message?: string;
};

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export async function fetchCurrentUser() {
  const response = await fetch("/api/auth/me");

  if (!response.ok) {
    const data = await parseJson<ApiErrorResponse>(response).catch(() => ({}));
    throw new Error(data.message || "Unauthorized.");
  }

  return parseJson<CurrentUser>(response);
}

export async function fetchCompanySetup() {
  const response = await fetch("/api/company/me");

  if (!response.ok) {
    const data = await parseJson<ApiErrorResponse>(response).catch(() => ({}));
    throw new Error(data.message || "Could not load company setup.");
  }

  return parseJson<CompanyResponse>(response);
}

export async function saveCompanySetup(values: CompanySetupInput, companyExists: boolean) {
  const response = await fetch(companyExists ? "/api/company/update" : "/api/company/create", {
    method: companyExists ? "PUT" : "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(values),
  });

  const data = await parseJson<{ message?: string; company?: CompanySetupRecord }>(response);

  if (!response.ok || !data.company) {
    throw new Error(data.message || "Could not save company settings.");
  }

  return data;
}
