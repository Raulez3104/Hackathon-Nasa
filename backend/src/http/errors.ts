import type { NextFunction, Request, Response } from "express";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction): void {
  if (error instanceof ApiError) {
    response.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details ?? null,
      },
    });
    return;
  }

  const message = error instanceof Error ? error.message : "Error desconocido";
  console.error(`[INTERNAL_ERROR] ${message}`);
  response.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Ocurrió un error no controlado en el servidor.",
      details: null,
    },
  });
}

export function asyncHandler(handler: (request: Request, response: Response, next: NextFunction) => Promise<void>) {
  return (request: Request, response: Response, next: NextFunction): void => {
    handler(request, response, next).catch(next);
  };
}
