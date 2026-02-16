import type { NextFunction, Request, Response } from "express";
import { buildErrorResponse, HttpError } from "../utils/httpError.js";

const resolveRequestId = (req: Request, res: Response): string | null => {
  if (typeof res.locals.requestId === "string" && res.locals.requestId.length > 0) {
    return res.locals.requestId;
  }

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

  const requestId = resolveRequestId(req, res);

  if (error instanceof HttpError) {
    console.warn(
      JSON.stringify({
        event: "request.failed",
        request_id: requestId,
        status_code: error.status,
        code: error.code,
        message: error.message,
      }),
    );

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

  console.error(
    JSON.stringify({
      event: "request.failed",
      request_id: requestId,
      status_code: 500,
      code: "INTERNAL_SERVER_ERROR",
      message: "Unexpected server error",
    }),
  );

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
