import express from "express";
import { errorHandlerMiddleware } from "./middleware/errorHandlerMiddleware.js";
import validateAddressRouter from "./routes/validateAddressRoute.js";

const app = express();

app.use(express.json());
app.use(validateAddressRouter);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use(errorHandlerMiddleware);

export default app;
