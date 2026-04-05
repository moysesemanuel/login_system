import bcrypt from "bcryptjs";
import { ApplicationScope, UserRole } from "@prisma/client";

import { prisma } from "../src/lib/prisma";

const adminName = process.env.ADMIN_NAME ?? "Administrador";
const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@dabitech.com").trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin1234";

async function main() {
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const user = await prisma.user.upsert({
    where: {
      email: adminEmail
    },
    update: {
      name: adminName,
      passwordHash,
      role: UserRole.ADMIN
    },
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: UserRole.ADMIN
    }
  });

  await prisma.userApplicationAccess.upsert({
    where: {
      userId_application: {
        userId: user.id,
        application: ApplicationScope.ERP
      }
    },
    update: {},
    create: {
      userId: user.id,
      application: ApplicationScope.ERP
    }
  });

  await prisma.userApplicationAccess.upsert({
    where: {
      userId_application: {
        userId: user.id,
        application: ApplicationScope.HELP_DESK
      }
    },
    update: {},
    create: {
      userId: user.id,
      application: ApplicationScope.HELP_DESK
    }
  });

  console.log("Admin account ready:");
  console.log(`name=${adminName}`);
  console.log(`email=${adminEmail}`);
  console.log(`password=${adminPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
