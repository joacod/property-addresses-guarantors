import type { ValidateAddressRequestBody } from "../domain/addressContract.js";

export const validateAddressRequestSchemaPlaceholder = {
  address: "string (non-empty)",
} as const;

export type ValidateAddressRequestShape = ValidateAddressRequestBody;
