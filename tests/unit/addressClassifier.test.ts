import { describe, expect, it } from "vitest";
import { classifyAddressResult } from "../../src/domain/addressClassifier.js";
import { UNVERIFIABLE_REASONS, type NormalizedAddress } from "../../src/domain/addressContract.js";

const baseNormalizedAddress: NormalizedAddress = {
  number: "123",
  street: "Main St",
  city: "Springfield",
  state: "IL",
  zip_code: "62704",
};

describe("classifyAddressResult", () => {
  it("returns valid for canonical match without corrections", () => {
    const result = classifyAddressResult({
      rawAddress: "123 Main St, Springfield, IL 62704",
      normalized: baseNormalizedAddress,
      corrections: [],
    });

    expect(result).toEqual({
      status: "valid",
      is_valid: true,
      corrections: [],
      reason: null,
    });
  });

  it("returns corrected when corrections are present", () => {
    const result = classifyAddressResult({
      rawAddress: "123 Main Street, Springfield, Illinois 62704",
      normalized: baseNormalizedAddress,
      corrections: ["normalized state to USPS code"],
    });

    expect(result.status).toBe("corrected");
    expect(result.is_valid).toBe(true);
    expect(result.corrections).toEqual(["normalized state to USPS code"]);
    expect(result.reason).toBeNull();
  });

  it("deduplicates and trims correction messages", () => {
    const result = classifyAddressResult({
      rawAddress: "123 Main Street, Springfield, Illinois 62704",
      normalized: baseNormalizedAddress,
      corrections: [
        " normalized street suffix ",
        "normalized street suffix",
        "",
        "normalized state to USPS code",
      ],
    });

    expect(result.status).toBe("corrected");
    expect(result.corrections).toEqual([
      "normalized street suffix",
      "normalized state to USPS code",
    ]);
  });

  it("returns unverifiable when provider reason is present", () => {
    const result = classifyAddressResult({
      rawAddress: "Main Street",
      normalized: baseNormalizedAddress,
      corrections: ["normalized street suffix"],
      unverifiableReason: UNVERIFIABLE_REASONS.INSUFFICIENT_INPUT,
    });

    expect(result).toEqual({
      status: "unverifiable",
      is_valid: false,
      corrections: [],
      reason: UNVERIFIABLE_REASONS.INSUFFICIENT_INPUT,
    });
  });

  it("returns unverifiable when normalized output is missing", () => {
    const result = classifyAddressResult({
      rawAddress: "Main Street",
      normalized: null,
    });

    expect(result).toEqual({
      status: "unverifiable",
      is_valid: false,
      corrections: [],
      reason: UNVERIFIABLE_REASONS.MISSING_NORMALIZED_ADDRESS,
    });
  });
});
