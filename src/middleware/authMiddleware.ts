import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/httpError.js";

const AUTH_HEADER_PREFIX = "Bearer ";

interface AuthMiddlewareOptions {
  enabled: boolean;
}

export const createAuthMiddleware = ({
  enabled,
}: AuthMiddlewareOptions) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!enabled) {
      next();
      return;
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith(AUTH_HEADER_PREFIX)) {
      next(
        new HttpError(401, "UNAUTHORIZED", "Missing or invalid Bearer token", {
          hint: "Set Authorization: Bearer <token>",
        }),
      );
      return;
    }

    const token = authHeader.slice(AUTH_HEADER_PREFIX.length).trim();

    if (token.length === 0) {
      next(
        new HttpError(401, "UNAUTHORIZED", "Missing or invalid Bearer token", {
          hint: "Set Authorization: Bearer <token>",
        }),
      );
      return;
    }

    // TODO: Replace this scaffold with real JWT verification.
    next();
  };
};
