import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { createCorsOptions } from "./config/cors.js";
import { openApiSpec } from "./docs/openApiSpec.js";
import { errorHandlerMiddleware } from "./middleware/errorHandlerMiddleware.js";
import { requestIdMiddleware } from "./middleware/requestIdMiddleware.js";
import validateAddressRouter from "./routes/validateAddressRoute.js";
import { runtimeConfig } from "./utils/env.js";

const app = express();

app.use(requestIdMiddleware);
app.use(cors(createCorsOptions(runtimeConfig.corsAllowlist)));
app.use(express.json());
app.use(validateAddressRouter);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/openapi.json", (_req, res) => {
  res.status(200).json(openApiSpec);
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.use(errorHandlerMiddleware);

export default app;
