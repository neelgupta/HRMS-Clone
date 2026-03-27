import crypto from "node:crypto";

export function generateTempPassword(): string {
  return crypto.randomBytes(8).toString("hex");
}
