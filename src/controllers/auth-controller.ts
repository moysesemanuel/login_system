import { Request, Response } from "express";
import { z } from "zod";

import {
  buildExpiredSessionCookie,
  buildSessionCookie,
  readCookieValue,
  SESSION_COOKIE_NAME
} from "../lib/session";
import { applicationKeys, getApplicationLabel, getApplicationUrl } from "../constants/applications";
import { loginSchema, registerSchema } from "../schemas/auth-schema";
import {
  createAuthHandoff,
  exchangeAuthHandoff,
  getSessionProfile,
  loginUser,
  logoutUser,
  registerUser
} from "../services/auth-service";

function getRequestContext(request: Request) {
  return {
    userAgent: request.headers["user-agent"],
    ipAddress: request.ip
  };
}

export async function register(request: Request, response: Response): Promise<void> {
  const data = registerSchema.parse(request.body);
  const result = await registerUser(data, getRequestContext(request));

  response.setHeader("Set-Cookie", buildSessionCookie(result.session.sessionToken, result.session.expiresAt));

  response.status(201).json({
    message: "Usuário criado com sucesso.",
    application: result.application,
    redirectUrl: result.redirectUrl,
    user: result.user
  });
}

export async function login(request: Request, response: Response): Promise<void> {
  const data = loginSchema.parse(request.body);
  const result = await loginUser(data, getRequestContext(request));

  response.setHeader("Set-Cookie", buildSessionCookie(result.session.sessionToken, result.session.expiresAt));

  response.status(200).json({
    message: "Login realizado com sucesso.",
    application: result.application,
    redirectUrl: result.redirectUrl,
    user: result.user
  });
}

export async function profile(request: Request, response: Response): Promise<void> {
  const sessionToken = readCookieValue(request.headers.cookie, SESSION_COOKIE_NAME);
  const session = await getSessionProfile(sessionToken ?? "");

  response.status(200).json({
    message: "Perfil carregado com sucesso.",
    ...session
  });
}

export async function logout(request: Request, response: Response): Promise<void> {
  const sessionToken = readCookieValue(request.headers.cookie, SESSION_COOKIE_NAME);

  if (sessionToken) {
    await logoutUser(sessionToken);
  }

  response.setHeader("Set-Cookie", buildExpiredSessionCookie());

  response.status(200).json({
    message: "Sessão encerrada com sucesso."
  });
}

export async function applications(_request: Request, response: Response): Promise<void> {
  response.status(200).json({
    applications: applicationKeys.map((key) => ({
      key,
      label: getApplicationLabel(key),
      url: getApplicationUrl(key)
    }))
  });
}

const authorizeSchema = z.object({
  application: z.enum(applicationKeys)
});

const exchangeSchema = z.object({
  code: z.string().min(1, "Código de acesso é obrigatório."),
  application: z.enum(applicationKeys)
});

export async function authorize(request: Request, response: Response): Promise<void> {
  const data = authorizeSchema.parse(request.query);
  const sessionToken = readCookieValue(request.headers.cookie, SESSION_COOKIE_NAME);

  if (!sessionToken) {
    response.redirect(`/?application=${data.application}`);
    return;
  }

  const handoff = await createAuthHandoff(sessionToken, data.application);
  const redirectUrl = new URL("/auth/callback", handoff.redirectUrl);
  redirectUrl.searchParams.set("code", handoff.code);

  response.redirect(redirectUrl.toString());
}

export async function exchange(request: Request, response: Response): Promise<void> {
  const data = exchangeSchema.parse(request.body);
  const result = await exchangeAuthHandoff(data.code, data.application);

  response.status(200).json(result);
}
