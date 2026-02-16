import {
  UNVERIFIABLE_REASONS,
  type NormalizedAddress,
  type ValidationStatus,
} from "./addressContract.js";
import { compareCanonicalForms } from "./addressNormalization.js";

export interface AddressClassificationInput {
  rawAddress: string;
  normalized: NormalizedAddress | null;
  corrections?: string[];
  unverifiableReason?: string | null;
}

export interface AddressClassificationOutput {
  status: ValidationStatus;
  is_valid: boolean;
  corrections: string[];
  reason: string | null;
}

const sanitizeCorrections = (corrections: string[] | undefined): string[] => {
  if (!corrections) {
    return [];
  }

  const deduped = new Set<string>();

  for (const correction of corrections) {
    const normalizedCorrection = correction.trim();

    if (normalizedCorrection.length > 0) {
      deduped.add(normalizedCorrection);
    }
  }

  return [...deduped];
};

const buildUnverifiableResult = (reason: string): AddressClassificationOutput => {
  return {
    status: "unverifiable",
    is_valid: false,
    corrections: [],
    reason,
  };
};

export const classifyAddressResult = (
  input: AddressClassificationInput,
): AddressClassificationOutput => {
  if (!input.normalized) {
    return buildUnverifiableResult(UNVERIFIABLE_REASONS.MISSING_NORMALIZED_ADDRESS);
  }

  if (typeof input.unverifiableReason === "string" && input.unverifiableReason.trim().length > 0) {
    return buildUnverifiableResult(input.unverifiableReason.trim());
  }

  const corrections = sanitizeCorrections(input.corrections);
  const canonicalMatch = compareCanonicalForms(input.rawAddress, input.normalized);
  const status: ValidationStatus = canonicalMatch && corrections.length === 0 ? "valid" : "corrected";

  return {
    status,
    is_valid: true,
    corrections,
    reason: null,
  };
};
