import { z } from "zod";

export const validateAddressRequestSchema = z.object({
  address: z
    .string({
      error: "address must be a string",
    })
    .trim()
    .min(1, "address must not be empty"),
});

export type ValidateAddressRequestShape = z.infer<
  typeof validateAddressRequestSchema
>;
