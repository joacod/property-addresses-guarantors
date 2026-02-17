import type {
  ValidateAddressRequestBody,
  ValidateAddressResponse,
} from "../domain/addressContract.js";
import { classifyAddressResult } from "../domain/addressClassifier.js";
import type { ProviderValidationResult } from "../providers/addressProvider.js";
import { LocalHeuristicProvider } from "../providers/localHeuristic/provider.js";
import type { AddressProvider } from "../providers/addressProvider.js";

export interface AddressValidationService {
  validate(input: ValidateAddressRequestBody): Promise<ValidateAddressResponse>;
}

class DefaultAddressValidationService implements AddressValidationService {
  constructor(private readonly provider: AddressProvider) {}

  private mapToResponse(
    input: ValidateAddressRequestBody,
    providerResult: ProviderValidationResult,
  ): ValidateAddressResponse {
    const classification = classifyAddressResult({
      rawAddress: input.address,
      normalized: providerResult.normalized,
      corrections: providerResult.corrections,
      unverifiableReason: providerResult.reason,
    });

    return {
      status: classification.status,
      is_valid: classification.is_valid,
      normalized: providerResult.normalized,
      confidence: providerResult.confidence,
      corrections: classification.corrections,
      reason: classification.reason,
      source: providerResult.source,
    };
  }

  public async validate(
    input: ValidateAddressRequestBody,
  ): Promise<ValidateAddressResponse> {
    const providerResult = await this.provider.validate(input.address);
    return this.mapToResponse(input, providerResult);
  }
}

export const addressValidationService: AddressValidationService =
  new DefaultAddressValidationService(new LocalHeuristicProvider());
