export type ValidationStatus = "valid" | "corrected" | "unverifiable";

export type AddressProviderSource = "local-heuristic";

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
