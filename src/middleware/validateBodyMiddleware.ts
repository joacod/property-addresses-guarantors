import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { HttpError } from "../utils/httpError.js";

const VALIDATION_ERROR_CODE = "INVALID_REQUEST";

export const validateBodyMiddleware = <T>(schema: ZodType<T>) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parseResult = schema.safeParse(req.body);

    if (!parseResult.success) {
      const details = parseResult.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));

      next(
        new HttpError(
          400,
          VALIDATION_ERROR_CODE,
          "Request validation failed",
          details,
        ),
      );
      return;
    }

    req.body = parseResult.data;
    next();
  };
};
