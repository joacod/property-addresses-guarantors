import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { openApiSpec } from "./docs/openApiSpec.js";
import { errorHandlerMiddleware } from "./middleware/errorHandlerMiddleware.js";
import { requestIdMiddleware } from "./middleware/requestIdMiddleware.js";
import validateAddressRouter from "./routes/validateAddressRoute.js";
import { runtimeConfig } from "./utils/env.js";
import { HttpError } from "./utils/httpError.js";

const createCorsOptions = (allowlist: string[]) => {
  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowlist.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(
        new HttpError(
          403,
          "CORS_FORBIDDEN",
          "Origin is not allowed by CORS policy",
          { origin },
        ),
      );
    },
  };
};

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
