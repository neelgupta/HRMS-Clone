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
  console.log("Starting seed...");

  let company = await prisma.company.findFirst({
    where: { setupCompleted: true },
  });

  if (!company) {
    console.log("Creating test company...");
    company = await prisma.company.create({
      data: {
        name: "TechCorp Solutions Pvt Ltd",
        status: "ACTIVE",
        setupCompleted: true,
        primaryEmail: "admin@techcorp.com",
        primaryPhone: "+91 9876543210",
        industry: "Technology",
      },
    });

    const hashedPassword = await bcrypt.hash("password123", 10);
    await prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@techcorp.com",
        phone: "9876543210",
        password: hashedPassword,
        role: "HR_ADMIN",
        status: "ACTIVE",
        companyId: company.id,
      },
    });

    console.log(`Created company: ${company.name}`);
  }

  const branch = await prisma.branch.findFirst({
    where: { companyId: company.id },
  });

  const newBranch = branch || await prisma.branch.create({
    data: {
      companyId: company.id,
      name: "Head Office",
      addressLine1: "123 Tech Park, Whitefield",
      city: "Bangalore",
      state: "Karnataka",
      country: "India",
      pincode: "560048",
    },
  });

  console.log(`Branch: ${newBranch.name}`);

  const departments = [
    { name: "Engineering", code: "ENG", description: "Software development and technology" },
    { name: "Human Resources", code: "HR", description: "People operations and recruitment" },
    { name: "Marketing", code: "MKT", description: "Brand, communications and growth" },
    { name: "Finance", code: "FIN", description: "Accounting, compliance and planning" },
    { name: "Operations", code: "OPS", description: "Business operations and logistics" },
    { name: "Product", code: "PRD", description: "Product development and strategy" },
  ];

  const createdDepts = await Promise.all(
    departments.map(async (dept) => {
      const existing = await prisma.department.findFirst({
        where: { companyId: company.id, code: dept.code },
      });
      if (existing) return existing;
      return prisma.department.create({
        data: { companyId: company.id, ...dept },
      });
    })
  );

  const deptMap = Object.fromEntries(createdDepts.map((d) => [d.code, d]));

  const designations = [
    { name: "CEO", code: "CEO", level: 10 },
    { name: "CTO", code: "CTO", level: 9 },
    { name: "VP Engineering", code: "VP-ENG", level: 8 },
    { name: "Director", code: "DIR", level: 7 },
    { name: "Senior Manager", code: "SR-MGR", level: 6 },
    { name: "Manager", code: "MGR", level: 5 },
    { name: "Senior Engineer", code: "SR-ENG", level: 4 },
    { name: "Software Engineer", code: "SDE", level: 3 },
    { name: "Junior Engineer", code: "JR-ENG", level: 2 },
    { name: "Intern", code: "INTERN", level: 1 },
  ];

  const createdDesgs = await Promise.all(
    designations.map(async (desg) => {
      const existing = await prisma.designation.findFirst({
        where: { companyId: company.id, code: desg.code },
      });
      if (existing) return existing;
      return prisma.designation.create({
        data: { companyId: company.id, ...desg },
      });
    })
  );

  const desgMap = Object.fromEntries(createdDesgs.map((d) => [d.code, d]));

  const employees = [
    {
      firstName: "Rajesh",
      lastName: "Kumar",
      email: "rajesh.kumar@techcorp.com",
      phone: "9876543201",
      department: "Engineering",
      designation: "CTO",
      employmentType: "FULL_TIME" as const,
      employmentStatus: "CONFIRMED" as const,
      dateOfJoining: new Date("2020-01-15"),
    },
    {
      firstName: "Priya",
      lastName: "Sharma",
      email: "priya.sharma@techcorp.com",
      phone: "9876543202",
      department: "Human Resources",
      designation: "Director",
      employmentType: "FULL_TIME" as const,
      employmentStatus: "CONFIRMED" as const,
      dateOfJoining: new Date("2020-03-01"),
    },
    {
      firstName: "Amit",
      lastName: "Singh",
      email: "amit.singh@techcorp.com",
      phone: "9876543203",
      department: "Engineering",
      designation: "VP Engineering",
      employmentType: "FULL_TIME" as const,
      employmentStatus: "CONFIRMED" as const,
      dateOfJoining: new Date("2020-06-15"),
    },
    {
      firstName: "Sneha",
      lastName: "Reddy",
      email: "sneha.reddy@techcorp.com",
      phone: "9876543204",
      department: "Product",
      designation: "Senior Manager",
      employmentType: "FULL_TIME" as const,
      employmentStatus: "CONFIRMED" as const,
      dateOfJoining: new Date("2021-02-01"),
    },
    {
      firstName: "Vikram",
      lastName: "Patel",
      email: "vikram.patel@techcorp.com",
      phone: "9876543205",
      department: "Engineering",
      designation: "Senior Engineer",
      employmentType: "FULL_TIME" as const,
      employmentStatus: "CONFIRMED" as const,
      dateOfJoining: new Date("2021-08-20"),
    },
    {
      firstName: "Ananya",
      lastName: "Gupta",
      email: "ananya.gupta@techcorp.com",
      phone: "9876543206",
      department: "Marketing",
      designation: "Manager",
      employmentType: "FULL_TIME" as const,
      employmentStatus: "CONFIRMED" as const,
      dateOfJoining: new Date("2022-01-10"),
    },
    {
      firstName: "Rahul",
      lastName: "Mehta",
      email: "rahul.mehta@techcorp.com",
      phone: "9876543207",
      department: "Finance",
      designation: "Manager",
      employmentType: "FULL_TIME" as const,
      employmentStatus: "CONFIRMED" as const,
      dateOfJoining: new Date("2022-04-05"),
    },
    {
      firstName: "Kavitha",
      lastName: "Nair",
      email: "kavitha.nair@techcorp.com",
      phone: "9876543208",
      department: "Engineering",
      designation: "Software Engineer",
      employmentType: "FULL_TIME" as const,
      employmentStatus: "PROBATION" as const,
      dateOfJoining: new Date("2024-01-15"),
    },
    {
      firstName: "Arjun",
      lastName: "Verma",
      email: "arjun.verma@techcorp.com",
      phone: "9876543209",
      department: "Operations",
      designation: "Senior Engineer",
      employmentType: "FULL_TIME" as const,
      employmentStatus: "CONFIRMED" as const,
      dateOfJoining: new Date("2022-09-01"),
    },
    {
      firstName: "Meera",
      lastName: "Joshi",
      email: "meera.joshi@techcorp.com",
      phone: "9876543210",
      department: "Engineering",
      designation: "Software Engineer",
      employmentType: "CONTRACT" as const,
      employmentStatus: "CONFIRMED" as const,
      dateOfJoining: new Date("2023-03-15"),
    },
    {
      firstName: "Siddharth",
      lastName: "Iyer",
      email: "siddharth.iyer@techcorp.com",
      phone: "9876543211",
      department: "Engineering",
      designation: "Junior Engineer",
      employmentType: "INTERNSHIP" as const,
      employmentStatus: "PROBATION" as const,
      dateOfJoining: new Date("2024-02-01"),
    },
    {
      firstName: "Deepika",
      lastName: "Kapoor",
      email: "deepika.kapoor@techcorp.com",
      phone: "9876543212",
      department: "Marketing",
      designation: "Senior Engineer",
      employmentType: "FULL_TIME" as const,
      employmentStatus: "CONFIRMED" as const,
      dateOfJoining: new Date("2021-11-20"),
    },
  ];

  const createdEmployees: Array<{ id: string; firstName: string; lastName: string; designation: string }> = [];

  for (const emp of employees) {
    const existing = await prisma.employee.findFirst({
      where: { email: emp.email, companyId: company.id },
    });

    if (existing) {
      createdEmployees.push({ ...existing, designation: emp.designation });
      console.log(`Employee exists: ${emp.firstName} ${emp.lastName}`);
      continue;
    }

    const employee = await prisma.employee.create({
      data: {
        companyId: company.id,
        branchId: newBranch.id,
        departmentId: deptMap[emp.department]?.id,
        designationId: desgMap[emp.designation]?.id,
        employeeCode: `EMP-${String(createdEmployees.length + 1).padStart(5, "0")}`,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        phone: emp.phone,
        employmentType: emp.employmentType,
        employmentStatus: emp.employmentStatus,
        dateOfJoining: emp.dateOfJoining,
        bloodGroup: ["A+", "B+", "AB+", "O+"][Math.floor(Math.random() * 4)],
        gender: "MALE",
        presentAddressLine1: `${Math.floor(Math.random() * 999) + 1} Main Street`,
        presentCity: "Bangalore",
        presentState: "Karnataka",
        presentCountry: "India",
        presentPincode: "560001",
        emergencyContactName: `${emp.firstName}'s Family`,
        emergencyContactPhone: emp.phone,
        emergencyContactRelation: "Family",
        panNumber: `ABCDE${1234 + createdEmployees.length}F`,
        aadharNumber: `${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      },
    });

    createdEmployees.push({ ...employee, designation: emp.designation });
    console.log(`Created: ${emp.firstName} ${emp.lastName} (${emp.designation})`);
  }

  const cto = createdEmployees.find((e) => e.designation === "CTO");
  const vpEng = createdEmployees.find((e) => e.designation === "VP Engineering");
  const directorHR = createdEmployees.find((e) => e.designation === "Director");

  if (vpEng && cto) {
    await prisma.employee.update({
      where: { id: vpEng.id },
      data: { reportingManagerId: cto.id },
    });
    console.log(`Assigned ${vpEng.firstName} reports to ${cto.firstName}`);
  }

  if (directorHR && cto) {
    await prisma.employee.update({
      where: { id: directorHR.id },
      data: { reportingManagerId: cto.id },
    });
    console.log(`Assigned ${directorHR.firstName} reports to ${cto.firstName}`);
  }

  console.log("\nSeed completed!");
  console.log(`Company: ${company.name}`);
  console.log(`Employees: ${createdEmployees.length}`);
  console.log(`Departments: ${createdDepts.length}`);
  console.log(`Designations: ${createdDesgs.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
