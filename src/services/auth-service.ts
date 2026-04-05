import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { User, UserRole } from "../models/user";
import { createUser, findUserByEmail } from "../repositories/user-repository";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

interface LoginInput {
  email: string;
  password: string;
}

function sanitizeUser(user: User) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

function generateToken(user: User): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role
    },
    env.JWT_SECRET,
    { expiresIn: "1h" }
  );
}

export async function registerUser(input: RegisterInput) {
  const existingUser = await findUserByEmail(input.email);

  if (existingUser) {
    throw new Error("E-mail já cadastrado.");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user: User = {
    id: randomUUID(),
    name: input.name,
    email: input.email,
    passwordHash,
    role: input.role ?? "user",
    createdAt: new Date().toISOString()
  };

  const savedUser = await createUser(user);
  const token = generateToken(savedUser);

  return {
    token,
    user: sanitizeUser(savedUser)
  };
}

export async function loginUser(input: LoginInput) {
  const user = await findUserByEmail(input.email);

  if (!user) {
    throw new Error("Credenciais inválidas.");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new Error("Credenciais inválidas.");
  }

  return {
    token: generateToken(user),
    user: sanitizeUser(user)
  };
}
