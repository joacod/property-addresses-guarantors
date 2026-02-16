import { Router } from "express";
import { validateAddressControllerPlaceholder } from "../controllers/validateAddressController.js";
import { validateBodyMiddleware } from "../middleware/validateBodyMiddleware.js";
import { validateAddressRequestSchema } from "../schemas/validateAddressSchema.js";

const validateAddressRouter = Router();

validateAddressRouter.post(
  "/validate-address",
  validateBodyMiddleware(validateAddressRequestSchema),
  validateAddressControllerPlaceholder,
);

export default validateAddressRouter;
