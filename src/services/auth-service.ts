import { User, UserApplicationAccess, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

import {
  ApplicationKey,
  fromApplicationScope,
  getApplicationLabel,
  getApplicationUrl,
  toApplicationScope
} from "../constants/applications";
import { prisma } from "../lib/prisma";
import { createSessionToken, getSessionExpiresAt, hashSessionToken } from "../lib/session";
import { HttpError } from "../types/error";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  application: ApplicationKey;
  role?: UserRole;
}

interface LoginInput {
  email: string;
  password: string;
  application: ApplicationKey;
}

interface SessionContextInput {
  userAgent?: string;
  ipAddress?: string;
}

type UserWithAccess = User & {
  appAccesses: UserApplicationAccess[];
};

function sanitizeUser(user: UserWithAccess) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.toLowerCase(),
    createdAt: user.createdAt,
    applications: user.appAccesses.map((access: UserApplicationAccess) => ({
      key: fromApplicationScope(access.application),
      label: getApplicationLabel(fromApplicationScope(access.application))
    }))
  };
}

async function createSessionForUser(
  userId: string,
  application: RegisterInput["application"],
  context: SessionContextInput
) {
  const sessionToken = createSessionToken();
  const expiresAt = getSessionExpiresAt();

  await prisma.session.create({
    data: {
      sessionTokenHash: hashSessionToken(sessionToken),
      application: toApplicationScope(application),
      expiresAt,
      userId,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress
    }
  });

  return {
    sessionToken,
    expiresAt
  };
}

export async function registerUser(input: RegisterInput, context: SessionContextInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email }
  });

  if (existingUser) {
    throw new HttpError(409, "E-mail já cadastrado.");
  }

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, 10),
      role: input.role ?? UserRole.USER,
      appAccesses: {
        create: {
          application: toApplicationScope(input.application)
        }
      }
    },
    include: {
      appAccesses: true
    }
  });

  const session = await createSessionForUser(user.id, input.application, context);

  return {
    session,
    application: {
      key: input.application,
      label: getApplicationLabel(input.application)
    },
    redirectUrl: getApplicationUrl(input.application),
    user: sanitizeUser(user)
  };
}

export async function loginUser(input: LoginInput, context: SessionContextInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: {
      appAccesses: true
    }
  });

  if (!user) {
    throw new HttpError(401, "Credenciais inválidas.");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new HttpError(401, "Credenciais inválidas.");
  }

  const applicationScope = toApplicationScope(input.application);
  const hasAccess = user.appAccesses.some(
    (access: UserApplicationAccess) => access.application === applicationScope
  );

  if (!hasAccess) {
    throw new HttpError(403, "Usuário sem acesso ao aplicativo selecionado.");
  }

  const session = await createSessionForUser(user.id, input.application, context);

  return {
    session,
    application: {
      key: input.application,
      label: getApplicationLabel(input.application)
    },
    redirectUrl: getApplicationUrl(input.application),
    user: sanitizeUser(user)
  };
}

export async function getSessionProfile(sessionToken: string) {
  const session = await prisma.session.findUnique({
    where: {
      sessionTokenHash: hashSessionToken(sessionToken)
    },
    include: {
      user: {
        include: {
          appAccesses: true
        }
      }
    }
  });

  if (!session || session.expiresAt <= new Date()) {
    throw new HttpError(401, "Sessão inválida ou expirada.");
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() }
  });

  return {
    sessionId: session.id,
    application: {
      key: fromApplicationScope(session.application),
      label: getApplicationLabel(fromApplicationScope(session.application)),
      url: getApplicationUrl(fromApplicationScope(session.application))
    },
    user: sanitizeUser(session.user)
  };
}

export async function logoutUser(sessionToken: string): Promise<void> {
  await prisma.session.deleteMany({
    where: {
      sessionTokenHash: hashSessionToken(sessionToken)
    }
  });
}
