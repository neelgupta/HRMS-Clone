import "server-only";

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

prisma.$use(async (params, next) => {
  if (params.model === "User" && (params.action === "findFirst" || params.action === "findUnique" || params.action === "findMany")) {
    if (!params.args) {
      params.args = { where: { isDeleted: false } };
    } else if (!params.args.where) {
      params.args.where = { isDeleted: false };
    } else if (!params.args.where.isDeleted) {
      params.args.where.isDeleted = false;
    }
  }
  return next(params);
});
