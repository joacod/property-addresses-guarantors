import type { CorsOptions } from "cors";
import { HttpError } from "../utils/httpError.js";

export const createCorsOptions = (allowlist: string[]): CorsOptions => {
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
