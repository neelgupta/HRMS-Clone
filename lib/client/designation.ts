export async function fetchDesignations() {
  const response = await fetch("/api/designations", { credentials: "include" });
  if (!response.ok) {
    throw new Error("Failed to fetch designations");
  }
  const data = await response.json();
  return data.designations || [];
}

export async function createDesignation(data: { name: string; code: string; description?: string; level?: number }) {
  const response = await fetch("/api/designations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to create designation");
  }
  return result.designation;
}
