import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@trustee.dev";
  const password = process.env.ADMIN_PASSWORD ?? "AdminPassword123!";
  const name = process.env.ADMIN_NAME ?? "Trustee Admin";

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role === "ADMIN") {
      console.log(`${email} is already an admin — nothing to do.`);
      return;
    }
    await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });
    console.log(`Promoted existing user ${email} to ADMIN.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { name, email, passwordHash, role: "ADMIN" },
  });
  console.log(`Created admin user ${email} (password: ${password}) — log in at /login.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
