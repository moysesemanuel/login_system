import { env } from "../config/env";

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/$/, "");
}

export function getAllowedOrigins(): string[] {
  return [env.APP_URL, env.SALES_SYSTEM_URL, env.HELP_DESK_URL].map(normalizeOrigin);
}

export function isAllowedOrigin(origin: string | undefined): boolean {
  return !origin || getAllowedOrigins().includes(normalizeOrigin(origin));
}
