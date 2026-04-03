import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl),
});

async function main() {
  const email = "manu@yopmail.com";
  const password = "Test@123";
  const hashedPassword = await bcrypt.hash(password, 10);

  let company = await prisma.company.findFirst({
    where: { name: "WorkNest Demo" },
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: "WorkNest Demo",
        status: "ACTIVE",
        setupCompleted: true,
        primaryEmail: email,
        primaryPhone: "+91 9876543210",
        industry: "Technology",
      },
    });
    console.log("Created company:", company.name);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });
    console.log(`Updated password for: ${email}`);
  } else {
    await prisma.user.create({
      data: {
        name: "Manu Demo",
        email,
        phone: "9876543210",
        password: hashedPassword,
        role: "HR_ADMIN",
        status: "ACTIVE",
        companyId: company.id,
      },
    });
    console.log(`Created user: ${email}`);
  }

  console.log("\nLogin credentials:");
  console.log("Email:", email);
  console.log("Password:", password);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
