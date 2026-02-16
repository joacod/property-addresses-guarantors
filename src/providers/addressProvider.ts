import type { ValidateAddressResponse } from "../domain/addressContract.js";

export interface AddressProvider {
  validate(rawAddress: string): Promise<ValidateAddressResponse>;
}
