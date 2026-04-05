import { z } from "zod";

import { applicationKeys } from "../constants/applications";

export const registerSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres.").trim(),
  email: z.string().email("E-mail inválido.").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "Senha deve ter pelo menos 8 caracteres.")
    .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula.")
    .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula.")
    .regex(/\d/, "Senha deve conter pelo menos um número."),
  application: z.enum(applicationKeys, {
    message: "Selecione uma aplicação válida."
  })
});

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido.").trim().toLowerCase(),
  password: z.string().min(1, "Senha é obrigatória."),
  application: z.enum(applicationKeys, {
    message: "Selecione uma aplicação válida."
  })
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido.").trim().toLowerCase()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token é obrigatório."),
  password: z
    .string()
    .min(8, "Senha deve ter pelo menos 8 caracteres.")
    .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula.")
    .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula.")
    .regex(/\d/, "Senha deve conter pelo menos um número.")
});
