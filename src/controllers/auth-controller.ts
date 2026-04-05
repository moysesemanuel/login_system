import { Request, Response } from "express";

import { loginSchema, registerSchema } from "../schemas/auth-schema";
import { loginUser, registerUser } from "../services/auth-service";

export async function register(request: Request, response: Response): Promise<void> {
  const data = registerSchema.parse(request.body);
  const result = await registerUser(data);

  response.status(201).json({
    message: "Usuário criado com sucesso.",
    ...result
  });
}

export async function login(request: Request, response: Response): Promise<void> {
  const data = loginSchema.parse(request.body);
  const result = await loginUser(data);

  response.status(200).json({
    message: "Login realizado com sucesso.",
    ...result
  });
}

export async function profile(request: Request, response: Response): Promise<void> {
  response.status(200).json({
    message: "Perfil carregado com sucesso.",
    user: request.auth
  });
}
