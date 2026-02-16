import type { Request, Response } from "express";

export const validateAddressControllerPlaceholder = (
  _req: Request,
  res: Response,
): void => {
  res.status(501).json({
    code: "NOT_IMPLEMENTED",
    message: "validate-address is defined but not implemented yet",
  });
};
