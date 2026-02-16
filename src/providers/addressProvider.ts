import type {
  AddressProviderSource,
  NormalizedAddress,
  UnverifiableReason,
} from "../domain/addressContract.js";

export interface ProviderValidationResult {
  normalized: NormalizedAddress | null;
  confidence: number;
  corrections: string[];
  reason: UnverifiableReason | null;
  source: AddressProviderSource;
}

export interface AddressProvider {
  validate(rawAddress: string): Promise<ProviderValidationResult>;
}
