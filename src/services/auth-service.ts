import { User, UserApplicationAccess, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

import {
  ApplicationKey,
  fromApplicationScope,
  getApplicationLabel,
  getApplicationUrl,
  toApplicationScope
} from "../constants/applications";
import { env } from "../config/env";
import { sendPasswordResetEmail } from "../lib/mailer";
import { prisma } from "../lib/prisma";
import {
  createSessionToken,
  getSessionExpiresAt,
  hashHandoffCode,
  hashPasswordResetToken,
  hashSessionToken
} from "../lib/session";
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

const AUTH_HANDOFF_DURATION_IN_MINUTES = 5;
const PASSWORD_RESET_DURATION_IN_MINUTES = 30;

type UserWithAccess = User & {
  appAccesses: UserApplicationAccess[];
};

function normalizeRole(role: UserRole): "admin" | "user" {
  return role === UserRole.ADMIN ? "admin" : "user";
}

function sanitizeUser(user: UserWithAccess) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: normalizeRole(user.role),
    createdAt: user.createdAt,
    applications: user.appAccesses.map((access: UserApplicationAccess) => ({
      key: fromApplicationScope(access.application),
      label: getApplicationLabel(fromApplicationScope(access.application))
    }))
  };
}

function sortApplications(appAccesses: UserApplicationAccess[]) {
  return [...appAccesses].sort((left, right) => left.application.localeCompare(right.application));
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

export async function createAuthHandoff(sessionToken: string, application: ApplicationKey) {
  const session = await getSessionProfile(sessionToken);

  const hasApplicationAccess = session.user.applications.some(
    (access) => access.key === application
  );

  if (!hasApplicationAccess) {
    throw new HttpError(403, "Usuário sem acesso ao aplicativo selecionado.");
  }

  const code = createSessionToken();
  const expiresAt = new Date(Date.now() + AUTH_HANDOFF_DURATION_IN_MINUTES * 60 * 1000);

  await prisma.authHandoff.create({
    data: {
      codeHash: hashHandoffCode(code),
      application: toApplicationScope(application),
      expiresAt,
      userId: session.user.id
    }
  });

  return {
    code,
    redirectUrl: getApplicationUrl(application)
  };
}

export async function exchangeAuthHandoff(code: string, application: ApplicationKey) {
  const handoff = await prisma.authHandoff.findUnique({
    where: {
      codeHash: hashHandoffCode(code)
    },
    include: {
      user: {
        include: {
          appAccesses: true
        }
      }
    }
  });

  if (!handoff || handoff.expiresAt <= new Date() || handoff.consumedAt) {
    throw new HttpError(401, "Código de acesso inválido ou expirado.");
  }

  if (handoff.application !== toApplicationScope(application)) {
    throw new HttpError(403, "Código incompatível com a aplicação.");
  }

  await prisma.authHandoff.update({
    where: { id: handoff.id },
    data: {
      consumedAt: new Date()
    }
  });

  return {
    application: {
      key: application,
      label: getApplicationLabel(application),
      url: getApplicationUrl(application)
    },
    user: sanitizeUser(handoff.user)
  };
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    return {
      message: "Se o e-mail existir, enviaremos as instruções de recuperação."
    };
  }

  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_DURATION_IN_MINUTES * 60 * 1000);
  const resetUrl = new URL("/", env.APP_URL);
  resetUrl.searchParams.set("mode", "reset-password");
  resetUrl.searchParams.set("token", token);

  await prisma.passwordResetToken.create({
    data: {
      tokenHash: hashPasswordResetToken(token),
      expiresAt,
      userId: user.id
    }
  });

  await sendPasswordResetEmail({
    email: user.email,
    name: user.name,
    resetUrl: resetUrl.toString()
  });

  return {
    message: "Enviamos as instruções de recuperação para o seu e-mail."
  };
}

export async function resetPassword(token: string, password: string) {
  const passwordResetToken = await prisma.passwordResetToken.findUnique({
    where: {
      tokenHash: hashPasswordResetToken(token)
    }
  });

  if (
    !passwordResetToken ||
    passwordResetToken.expiresAt <= new Date() ||
    passwordResetToken.consumedAt
  ) {
    throw new HttpError(400, "Token de redefinição inválido ou expirado.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: {
        id: passwordResetToken.userId
      },
      data: {
        passwordHash
      }
    }),
    prisma.passwordResetToken.update({
      where: {
        id: passwordResetToken.id
      },
      data: {
        consumedAt: new Date()
      }
    }),
    prisma.session.deleteMany({
      where: {
        userId: passwordResetToken.userId
      }
    })
  ]);

  return {
    message: "Senha redefinida com sucesso. Faça login com a nova senha."
  };
}

export async function listUsers() {
  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc"
    },
    include: {
      appAccesses: true
    }
  });

  return users.map((user) =>
    sanitizeUser({
      ...user,
      appAccesses: sortApplications(user.appAccesses)
    })
  );
}
