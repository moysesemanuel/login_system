import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  JWT_SECRET: z.string().min(10, "JWT_SECRET precisa ter pelo menos 10 caracteres.")
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
