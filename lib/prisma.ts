import "server-only";

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  return new PrismaClient();
}

function isCompatibleClient(client: PrismaClient) {
  // In dev, Next.js HMR can keep an older PrismaClient instance in the global cache.
  // If the Prisma schema changes (new models), the old instance won't have the new model delegates.
  // Recreate the client in that case to avoid requiring a full dev-server restart.
  const test = client as unknown as Record<string, unknown>;
  return "payrollRun" in test && "payrollItem" in test && "ticket" in test && "ticketComment" in test;
}

export const prisma = globalForPrisma.prisma && isCompatibleClient(globalForPrisma.prisma)
  ? globalForPrisma.prisma
  : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
