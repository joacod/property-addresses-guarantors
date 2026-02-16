import type { NextFunction, Request, Response } from "express";
import type { ValidateAddressRequestBody } from "../domain/addressContract.js";
import { addressValidationService } from "../services/addressValidationService.js";

export const validateAddressController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = req.body as ValidateAddressRequestBody;
    const validationResult = await addressValidationService.validate(body);

    res.status(200).json(validationResult);
  } catch (error) {
    next(error);
  }
};
