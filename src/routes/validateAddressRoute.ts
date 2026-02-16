import { Router } from "express";
import { validateAddressControllerPlaceholder } from "../controllers/validateAddressController.js";

const validateAddressRouter = Router();

validateAddressRouter.post("/validate-address", validateAddressControllerPlaceholder);

export default validateAddressRouter;
