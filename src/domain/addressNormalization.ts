import type { NormalizedAddress } from "./addressContract.js";

const WHITESPACE_REGEX = /\s+/g;
const COMMA_SPACING_REGEX = /\s*,\s*/g;
const NON_ALPHANUMERIC_REGEX = /[^a-z0-9]/g;

export const normalizeAddressText = (input: string): string => {
  return input.trim().replace(COMMA_SPACING_REGEX, ", ").replace(WHITESPACE_REGEX, " ");
};

export const toCanonicalComparisonForm = (input: string): string => {
  return normalizeAddressText(input)
    .toLowerCase()
    .replace(NON_ALPHANUMERIC_REGEX, " ")
    .replace(WHITESPACE_REGEX, " ")
    .trim();
};

export const buildCanonicalFromNormalizedAddress = (
  normalized: NormalizedAddress,
): string => {
  return toCanonicalComparisonForm(
    `${normalized.number} ${normalized.street} ${normalized.city} ${normalized.state} ${normalized.zip_code}`,
  );
};

export const compareCanonicalForms = (
  rawAddress: string,
  normalized: NormalizedAddress,
): boolean => {
  return toCanonicalComparisonForm(rawAddress) === buildCanonicalFromNormalizedAddress(normalized);
};
