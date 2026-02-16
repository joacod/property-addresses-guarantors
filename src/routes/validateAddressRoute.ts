import { Router } from "express";
import { validateAddressController } from "../controllers/validateAddressController.js";
import { createAuthMiddleware } from "../middleware/authMiddleware.js";
import { validateBodyMiddleware } from "../middleware/validateBodyMiddleware.js";
import { validateAddressRequestSchema } from "../schemas/validateAddressSchema.js";
import { runtimeConfig } from "../utils/env.js";

const validateAddressRouter = Router();
const authMiddleware = createAuthMiddleware({ enabled: runtimeConfig.authEnabled });

validateAddressRouter.post(
  "/validate-address",
  authMiddleware,
  validateBodyMiddleware(validateAddressRequestSchema),
  validateAddressController,
);

export default validateAddressRouter;
