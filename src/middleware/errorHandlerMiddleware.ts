import type { NextFunction, Request, Response } from "express";
import { buildErrorResponse, HttpError } from "../utils/httpError.js";

const resolveRequestId = (req: Request): string | null => {
  const requestId = req.headers["x-request-id"];

  if (typeof requestId === "string" && requestId.length > 0) {
    return requestId;
  }

  return null;
};

export const errorHandlerMiddleware = (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  void _next;

  const requestId = resolveRequestId(req);

  if (error instanceof HttpError) {
    res
      .status(error.status)
      .json(
        buildErrorResponse(
          error.code,
          error.message,
          error.details,
          requestId,
        ),
      );
    return;
  }

  res
    .status(500)
    .json(
      buildErrorResponse(
        "INTERNAL_SERVER_ERROR",
        "Unexpected server error",
        null,
        requestId,
      ),
    );
};
