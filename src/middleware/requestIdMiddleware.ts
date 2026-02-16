import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";

const REQUEST_ID_HEADER = "x-request-id";

const resolveIncomingRequestId = (req: Request): string | null => {
  const incomingHeader = req.headers[REQUEST_ID_HEADER];

  if (typeof incomingHeader === "string") {
    const trimmed = incomingHeader.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (Array.isArray(incomingHeader) && incomingHeader.length > 0) {
    const firstValue = incomingHeader[0]?.trim();
    return firstValue && firstValue.length > 0 ? firstValue : null;
  }

  return null;
};

const logRequestStarted = (requestId: string, req: Request): void => {
  console.info(
    JSON.stringify({
      event: "request.started",
      request_id: requestId,
      method: req.method,
      path: req.originalUrl,
    }),
  );
};

const logRequestCompleted = (
  requestId: string,
  req: Request,
  res: Response,
  startedAt: bigint,
): void => {
  const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

  console.info(
    JSON.stringify({
      event: "request.completed",
      request_id: requestId,
      method: req.method,
      path: req.originalUrl,
      status_code: res.statusCode,
      duration_ms: Math.round(durationMs * 100) / 100,
    }),
  );
};

export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const requestId = resolveIncomingRequestId(req) ?? randomUUID();
  const startedAt = process.hrtime.bigint();

  res.locals.requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);

  logRequestStarted(requestId, req);

  res.on("finish", () => {
    logRequestCompleted(requestId, req, res, startedAt);
  });

  next();
};
