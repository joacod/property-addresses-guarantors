import type { NormalizedAddress } from "../domain/addressContract.js";
import {
  DIRECTIONAL_ALIASES,
  LOCAL_PROVIDER_CORRECTIONS,
  STATE_CODES,
  STATE_NAMES_TO_CODE,
  STREET_NUMBER_REGEX,
  STREET_SUFFIX_ALIASES,
  STREET_SUFFIX_WORDS,
  ZIP_CODE_REGEX,
} from "./localHeuristic.constants.js";

interface ResolvedState {
  code: string;
  fromFullName: boolean;
}

export interface ParsedAddressParts {
  number: string;
  street: string;
  city: string;
  state: ResolvedState;
  zipCode: string;
  usedSuffixExpansion: boolean;
}

const toTitleCase = (token: string): string => {
  return token
    .toLowerCase()
    .split("-")
    .map((part) => {
      if (part.length === 0) {
        return part;
      }

      return part[0].toUpperCase() + part.slice(1);
    })
    .join("-");
};

const normalizeStreetWord = (
  word: string,
): {
  value: string;
  usedSuffixExpansion: boolean;
} => {
  const lowered = word.toLowerCase();
  const directional = DIRECTIONAL_ALIASES[lowered];

  if (directional) {
    return { value: directional, usedSuffixExpansion: false };
  }

  const suffix = STREET_SUFFIX_ALIASES[lowered];

  if (suffix) {
    return {
      value: suffix,
      usedSuffixExpansion: lowered !== suffix.toLowerCase(),
    };
  }

  return {
    value: toTitleCase(word),
    usedSuffixExpansion: false,
  };
};

const normalizeStreet = (
  rawStreet: string,
): {
  street: string;
  usedSuffixExpansion: boolean;
} => {
  const words = rawStreet.split(" ").filter((word) => word.length > 0);
  let usedSuffixExpansion = false;

  const normalizedWords = words.map((word) => {
    const normalized = normalizeStreetWord(word);

    if (normalized.usedSuffixExpansion) {
      usedSuffixExpansion = true;
    }

    return normalized.value;
  });

  return {
    street: normalizedWords.join(" "),
    usedSuffixExpansion,
  };
};

const normalizeCity = (rawCity: string): string => {
  return rawCity
    .split(" ")
    .filter((word) => word.length > 0)
    .map((word) => toTitleCase(word))
    .join(" ");
};

const resolveState = (rawState: string): ResolvedState | null => {
  const compact = rawState.trim();

  if (compact.length === 0) {
    return null;
  }

  const upper = compact.toUpperCase();

  if (STATE_CODES.has(upper)) {
    return {
      code: upper,
      fromFullName: false,
    };
  }

  const fromName = STATE_NAMES_TO_CODE[upper];

  if (!fromName) {
    return null;
  }

  return {
    code: fromName,
    fromFullName: true,
  };
};

const parseStreetNumber = (
  streetSegment: string,
): {
  number: string;
  street: string;
} | null => {
  const tokens = streetSegment.split(" ").filter((token) => token.length > 0);

  if (tokens.length < 2) {
    return null;
  }

  const number = tokens[0];

  if (!STREET_NUMBER_REGEX.test(number)) {
    return null;
  }

  return {
    number,
    street: tokens.slice(1).join(" "),
  };
};

const parseSingleSegmentAddress = (segment: string): ParsedAddressParts | null => {
  const tokens = segment.split(" ").filter((token) => token.length > 0);

  if (tokens.length < 5) {
    return null;
  }

  const zipCode = tokens[tokens.length - 1] ?? "";

  if (!ZIP_CODE_REGEX.test(zipCode)) {
    return null;
  }

  let stateStart = tokens.length - 2;
  let state = resolveState(tokens[stateStart] ?? "");

  if (!state && stateStart - 1 >= 0) {
    stateStart = tokens.length - 3;
    state = resolveState(`${tokens[stateStart] ?? ""} ${tokens[stateStart + 1] ?? ""}`);
  }

  if (!state || stateStart < 2) {
    return null;
  }

  const number = tokens[0] ?? "";

  if (!STREET_NUMBER_REGEX.test(number)) {
    return null;
  }

  const middleTokens = tokens.slice(1, stateStart);

  if (middleTokens.length < 2) {
    return null;
  }

  let splitIndex = middleTokens.length - 2;

  for (let index = 0; index < middleTokens.length; index += 1) {
    const word = (middleTokens[index] ?? "").toLowerCase();

    if (STREET_SUFFIX_WORDS.has(word)) {
      splitIndex = index + 1;
      break;
    }
  }

  const streetTokens = middleTokens.slice(0, splitIndex);
  const cityTokens = middleTokens.slice(splitIndex);

  if (streetTokens.length === 0 || cityTokens.length === 0) {
    return null;
  }

  const normalizedStreet = normalizeStreet(streetTokens.join(" "));

  return {
    number,
    street: normalizedStreet.street,
    city: normalizeCity(cityTokens.join(" ")),
    state,
    zipCode,
    usedSuffixExpansion: normalizedStreet.usedSuffixExpansion,
  };
};

const parseCommaSeparatedAddress = (segments: string[]): ParsedAddressParts | null => {
  if (segments.length < 2) {
    return null;
  }

  const streetPart = parseStreetNumber(segments[0] ?? "");

  if (!streetPart) {
    return null;
  }

  const stateZipSegment = segments[segments.length - 1] ?? "";
  const stateZipTokens = stateZipSegment.split(" ").filter((token) => token.length > 0);

  if (stateZipTokens.length < 2) {
    return null;
  }

  const zipCode = stateZipTokens[stateZipTokens.length - 1] ?? "";

  if (!ZIP_CODE_REGEX.test(zipCode)) {
    return null;
  }

  const state = resolveState(stateZipTokens.slice(0, -1).join(" "));

  if (!state) {
    return null;
  }

  const city = segments.slice(1, -1).join(" ").trim();

  if (city.length === 0) {
    return null;
  }

  const normalizedStreet = normalizeStreet(streetPart.street);

  return {
    number: streetPart.number,
    street: normalizedStreet.street,
    city: normalizeCity(city),
    state,
    zipCode,
    usedSuffixExpansion: normalizedStreet.usedSuffixExpansion,
  };
};

export const parseAddressParts = (normalizedInput: string): ParsedAddressParts | null => {
  const commaSegments = normalizedInput
    .split(",")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  const parsedFromComma = parseCommaSeparatedAddress(commaSegments);

  if (parsedFromComma) {
    return parsedFromComma;
  }

  return parseSingleSegmentAddress(normalizedInput);
};

export const buildCorrections = (parts: ParsedAddressParts): string[] => {
  const corrections: string[] = [];

  if (parts.state.fromFullName) {
    corrections.push(LOCAL_PROVIDER_CORRECTIONS.NORMALIZED_STATE_TO_USPS_CODE);
  }

  if (parts.usedSuffixExpansion) {
    corrections.push(LOCAL_PROVIDER_CORRECTIONS.NORMALIZED_STREET_SUFFIX);
  }

  return corrections;
};

export const buildNormalizedAddress = (parts: ParsedAddressParts): NormalizedAddress => {
  return {
    street: parts.street,
    number: parts.number,
    city: parts.city,
    state: parts.state.code,
    zip_code: parts.zipCode,
  };
};
