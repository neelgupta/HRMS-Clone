import { z } from "zod";

export const updateCredentialsSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

export type UpdateCredentialsInput = z.infer<typeof updateCredentialsSchema>;
