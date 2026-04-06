import { ApplicationScope, UserRole } from "@prisma/client";

import { prisma } from "../src/lib/prisma";

const targetEmail = (process.env.ADMIN_EMAIL ?? "contamecs.cwb@gmail.com").trim().toLowerCase();

async function main() {
  const user = await prisma.user.findUnique({
    where: {
      email: targetEmail
    }
  });

  if (!user) {
    throw new Error(`Usuário não encontrado: ${targetEmail}`);
  }

  await prisma.user.update({
    where: {
      id: user.id
    },
    data: {
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

  console.log(`Admin promovido com sucesso: ${targetEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
