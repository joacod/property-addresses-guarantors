import type { Request, Response } from "express";
import { buildErrorResponse } from "../utils/httpError.js";

export const validateAddressControllerPlaceholder = (
  req: Request,
  res: Response,
): void => {
  const requestIdHeader = req.headers["x-request-id"];
  const requestIdFromLocals =
    typeof res.locals.requestId === "string" && res.locals.requestId.length > 0
      ? res.locals.requestId
      : null;
  const requestId =
    requestIdFromLocals ??
    (typeof requestIdHeader === "string" && requestIdHeader.length > 0
      ? requestIdHeader
      : null);

  res
    .status(501)
    .json(
      buildErrorResponse(
        "NOT_IMPLEMENTED",
        "validate-address is defined but not implemented yet",
        null,
        requestId,
      ),
    );
};
