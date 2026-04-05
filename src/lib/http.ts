import { env } from "../config/env";

export function getAllowedOrigins(): string[] {
  return [env.APP_URL, env.SALES_SYSTEM_URL, env.HELP_DESK_URL];
}

export function isAllowedOrigin(origin: string | undefined): boolean {
  return !origin || getAllowedOrigins().includes(origin);
}
