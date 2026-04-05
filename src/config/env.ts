import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória."),
  DIRECT_URL: z.string().optional(),
  SESSION_SECRET: z.string().min(16, "SESSION_SECRET precisa ter pelo menos 16 caracteres."),
  APP_URL: z.string().url("APP_URL precisa ser uma URL válida."),
  SALES_SYSTEM_URL: z.string().url("SALES_SYSTEM_URL precisa ser uma URL válida."),
  HELP_DESK_URL: z.string().url("HELP_DESK_URL precisa ser uma URL válida."),
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY é obrigatória."),
  EMAIL_FROM: z.string().min(1, "EMAIL_FROM é obrigatória.")
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const formattedIssues = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
    .join("\n");

  throw new Error(
    `Variáveis de ambiente inválidas.\n${formattedIssues}\n\nCrie o arquivo .env com base no .env.example antes de iniciar o servidor.`
  );
}

export const env = parsedEnv.data;
