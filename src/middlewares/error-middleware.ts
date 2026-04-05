import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { HttpError } from "../types/error";

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

  if (error instanceof HttpError) {
    response.status(error.statusCode).json({
      message: error.message
    });
    return;
  }

  response.status(500).json({
    message: error.message || "Erro interno no servidor."
  });
}
