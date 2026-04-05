import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { UserRole } from "../models/user";

interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export function ensureAuthenticated(
  request: Request,
  response: Response,
  next: NextFunction
): void {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    response.status(401).json({ message: "Token não enviado." });
    return;
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;

    request.auth = {
      userId: payload.sub,
      email: payload.email,
      role: payload.role
    };

    next();
  } catch {
    response.status(401).json({ message: "Token inválido ou expirado." });
  }
}
