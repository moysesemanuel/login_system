import { ApplicationScope } from "@prisma/client";

import { env } from "../config/env";

export const applicationKeys = ["erp", "help-desk"] as const;

export type ApplicationKey = (typeof applicationKeys)[number];

export function toApplicationScope(key: ApplicationKey): ApplicationScope {
  return key === "erp" ? ApplicationScope.ERP : ApplicationScope.HELP_DESK;
}

export function fromApplicationScope(scope: ApplicationScope): ApplicationKey {
  return scope === ApplicationScope.ERP ? "erp" : "help-desk";
}

export function getApplicationLabel(key: ApplicationKey): string {
  return key === "erp" ? "ERP" : "Help Desk";
}

export function getApplicationUrl(key: ApplicationKey): string {
  return key === "erp" ? env.SALES_SYSTEM_URL : env.HELP_DESK_URL;
}
