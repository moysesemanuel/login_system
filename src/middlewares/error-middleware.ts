import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function errorHandler(
  error: Error,
  _request: Request,
  response: Response,
  _next: NextFunction
): void {
  if (error instanceof ZodError) {
    response.status(400).json({
      message: "Dados inválidos.",
      issues: error.flatten().fieldErrors
    });
    return;
  }

  response.status(400).json({
    message: error.message || "Erro interno no servidor."
  });
}
