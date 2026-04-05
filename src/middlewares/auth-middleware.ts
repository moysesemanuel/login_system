import { NextFunction, Request, Response } from "express";

import { readCookieValue, SESSION_COOKIE_NAME } from "../lib/session";
import { getSessionProfile } from "../services/auth-service";

export async function ensureAuthenticated(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  const sessionToken = readCookieValue(request.headers.cookie, SESSION_COOKIE_NAME);

  if (!sessionToken) {
    response.status(401).json({ message: "Sessão não encontrada." });
    return;
  }

  try {
    const session = await getSessionProfile(sessionToken);

    request.auth = {
      sessionId: session.sessionId,
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
      application: session.application.key,
      redirectUrl: session.application.url
    };

    next();
  } catch {
    response.status(401).json({ message: "Token inválido ou expirado." });
  }
}
