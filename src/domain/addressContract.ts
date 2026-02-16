export type ValidationStatus = "valid" | "corrected" | "unverifiable";

export type AddressProviderSource = "local-heuristic";

export const UNVERIFIABLE_REASONS = {
  MISSING_NORMALIZED_ADDRESS: "missing_normalized_address",
  INSUFFICIENT_INPUT: "insufficient_input",
  NON_US_ADDRESS: "non_us_address",
  UNPARSEABLE_ADDRESS: "unparseable_address",
} as const;

export type UnverifiableReason =
  (typeof UNVERIFIABLE_REASONS)[keyof typeof UNVERIFIABLE_REASONS];

export interface ValidateAddressRequestBody {
  address: string;
}

export interface NormalizedAddress {
  street: string;
  number: string;
  city: string;
  state: string;
  zip_code: string;
}

export interface ValidateAddressResponse {
  status: ValidationStatus;
  is_valid: boolean;
  normalized: NormalizedAddress | null;
  confidence: number;
  corrections: string[];
  reason: string | null;
  source: AddressProviderSource;
}
