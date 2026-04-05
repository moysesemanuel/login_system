import { createHash, randomBytes } from "crypto";

import { env } from "../config/env";

export const SESSION_COOKIE_NAME = "login_system_session";
const SESSION_DURATION_IN_DAYS = 7;

export function createSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashSessionToken(sessionToken: string): string {
  return createHash("sha256")
    .update(`${sessionToken}:${env.SESSION_SECRET}`)
    .digest("hex");
}

export function getSessionExpiresAt(): Date {
  return new Date(Date.now() + SESSION_DURATION_IN_DAYS * 24 * 60 * 60 * 1000);
}

export function buildSessionCookie(sessionToken: string, expiresAt: Date): string {
  const parts = [
    `${SESSION_COOKIE_NAME}=${sessionToken}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Expires=${expiresAt.toUTCString()}`
  ];

  if (env.NODE_ENV === "production") {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export function buildExpiredSessionCookie(): string {
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT"
  ];

  if (env.NODE_ENV === "production") {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export function readCookieValue(cookieHeader: string | undefined, key: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").map((item) => item.trim());
  const cookie = cookies.find((item) => item.startsWith(`${key}=`));

  return cookie ? decodeURIComponent(cookie.slice(key.length + 1)) : null;
}
