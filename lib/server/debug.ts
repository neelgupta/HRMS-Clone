import { prisma } from "@/lib/prisma";

export async function getDebugData() {
  const [companyCount, userCount, branchCount] = await Promise.all([
    prisma.company.count(),
    prisma.user.count(),
    prisma.branch.count(),
  ]);

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      company: { select: { name: true } },
    },
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
      status: true,
      setupCompleted: true,
      _count: { select: { users: true, branches: true } },
    },
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  return {
    counts: { companies: companyCount, users: userCount, branches: branchCount },
    recentUsers: users,
    recentCompanies: companies,
    timestamp: new Date().toISOString(),
  };
}
