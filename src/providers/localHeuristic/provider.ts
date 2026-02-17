import {
  UNVERIFIABLE_REASONS,
  type UnverifiableReason,
} from "../../domain/addressContract.js";
import { normalizeAddressText } from "../../domain/addressNormalization.js";
import type { AddressProvider, ProviderValidationResult } from "../addressProvider.js";
import {
  NON_US_COUNTRY_REGEX,
} from "./constants.js";
import {
  buildCorrections,
  buildNormalizedAddress,
  parseAddressParts,
} from "./parser.js";
import { LOCAL_PROVIDER_SOURCE } from "../../utils/providerConstants.js";

const buildUnverifiableResult = (
  reason: UnverifiableReason,
  confidence = 0,
): ProviderValidationResult => {
  return {
    normalized: null,
    confidence,
    corrections: [],
    reason,
    source: LOCAL_PROVIDER_SOURCE,
  };
};

export class LocalHeuristicProvider implements AddressProvider {
  public async validate(rawAddress: string): Promise<ProviderValidationResult> {
    const normalizedInput = normalizeAddressText(rawAddress);

    if (normalizedInput.length === 0) {
      return buildUnverifiableResult(UNVERIFIABLE_REASONS.INSUFFICIENT_INPUT);
    }

    if (NON_US_COUNTRY_REGEX.test(normalizedInput)) {
      return buildUnverifiableResult(UNVERIFIABLE_REASONS.NON_US_ADDRESS, 0.1);
    }

    const parsed = parseAddressParts(normalizedInput);

    if (!parsed) {
      return buildUnverifiableResult(UNVERIFIABLE_REASONS.UNPARSEABLE_ADDRESS, 0.2);
    }

    const normalized = buildNormalizedAddress(parsed);

    return {
      normalized,
      confidence: 0.94,
      corrections: buildCorrections(parsed),
      reason: null,
      source: LOCAL_PROVIDER_SOURCE,
    };
  }
}
