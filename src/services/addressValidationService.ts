import type {
  ValidateAddressRequestBody,
  ValidateAddressResponse,
} from "../domain/addressContract.js";

export interface AddressValidationService {
  validate(input: ValidateAddressRequestBody): Promise<ValidateAddressResponse>;
}
