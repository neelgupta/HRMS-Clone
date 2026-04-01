export async function fetchDepartments() {
  const response = await fetch("/api/departments", { credentials: "include" });
  if (!response.ok) {
    throw new Error("Failed to fetch departments");
  }
  const data = await response.json();
  return data.departments || [];
}

export async function createDepartment(data: { name: string; code: string; description?: string }) {
  const response = await fetch("/api/departments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to create department");
  }
  return result.department;
}
