import {
  UNVERIFIABLE_REASONS,
  type NormalizedAddress,
  type UnverifiableReason,
} from "../domain/addressContract.js";
import { normalizeAddressText } from "../domain/addressNormalization.js";
import type { AddressProvider, ProviderValidationResult } from "./addressProvider.js";
import { LOCAL_PROVIDER_SOURCE } from "../utils/providerConstants.js";

const ZIP_CODE_REGEX = /^\d{5}(?:-\d{4})?$/;
const STREET_NUMBER_REGEX = /^\d+[a-zA-Z0-9-]*$/;
const NON_US_COUNTRY_REGEX = /\b(canada|mexico|uk|united kingdom|france|germany|spain)\b/i;

const STREET_SUFFIX_ALIASES: Record<string, string> = {
  avenue: "Ave",
  ave: "Ave",
  boulevard: "Blvd",
  blvd: "Blvd",
  circle: "Cir",
  cir: "Cir",
  court: "Ct",
  ct: "Ct",
  drive: "Dr",
  dr: "Dr",
  lane: "Ln",
  ln: "Ln",
  parkway: "Pkwy",
  pkwy: "Pkwy",
  place: "Pl",
  pl: "Pl",
  road: "Rd",
  rd: "Rd",
  square: "Sq",
  sq: "Sq",
  street: "St",
  st: "St",
  terrace: "Ter",
  ter: "Ter",
  trail: "Trl",
  trl: "Trl",
  way: "Way",
};

const DIRECTIONAL_ALIASES: Record<string, string> = {
  n: "N",
  s: "S",
  e: "E",
  w: "W",
  ne: "NE",
  nw: "NW",
  se: "SE",
  sw: "SW",
};

const STATE_NAMES_TO_CODE: Record<string, string> = {
  ALABAMA: "AL",
  ALASKA: "AK",
  ARIZONA: "AZ",
  ARKANSAS: "AR",
  CALIFORNIA: "CA",
  COLORADO: "CO",
  CONNECTICUT: "CT",
  DELAWARE: "DE",
  FLORIDA: "FL",
  GEORGIA: "GA",
  HAWAII: "HI",
  IDAHO: "ID",
  ILLINOIS: "IL",
  INDIANA: "IN",
  IOWA: "IA",
  KANSAS: "KS",
  KENTUCKY: "KY",
  LOUISIANA: "LA",
  MAINE: "ME",
  MARYLAND: "MD",
  MASSACHUSETTS: "MA",
  MICHIGAN: "MI",
  MINNESOTA: "MN",
  MISSISSIPPI: "MS",
  MISSOURI: "MO",
  MONTANA: "MT",
  NEBRASKA: "NE",
  NEVADA: "NV",
  "NEW HAMPSHIRE": "NH",
  "NEW JERSEY": "NJ",
  "NEW MEXICO": "NM",
  "NEW YORK": "NY",
  "NORTH CAROLINA": "NC",
  "NORTH DAKOTA": "ND",
  OHIO: "OH",
  OKLAHOMA: "OK",
  OREGON: "OR",
  PENNSYLVANIA: "PA",
  "RHODE ISLAND": "RI",
  "SOUTH CAROLINA": "SC",
  "SOUTH DAKOTA": "SD",
  TENNESSEE: "TN",
  TEXAS: "TX",
  UTAH: "UT",
  VERMONT: "VT",
  VIRGINIA: "VA",
  WASHINGTON: "WA",
  "WEST VIRGINIA": "WV",
  WISCONSIN: "WI",
  WYOMING: "WY",
  "DISTRICT OF COLUMBIA": "DC",
};

const STATE_CODES = new Set(Object.values(STATE_NAMES_TO_CODE));
const STREET_SUFFIX_WORDS = new Set(Object.keys(STREET_SUFFIX_ALIASES));

interface ResolvedState {
  code: string;
  fromFullName: boolean;
}

interface ParsedAddressParts {
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

const parseAddressParts = (rawAddress: string): ParsedAddressParts | null => {
  const normalizedInput = normalizeAddressText(rawAddress);
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

const buildCorrections = (parts: ParsedAddressParts): string[] => {
  const corrections: string[] = [];

  if (parts.state.fromFullName) {
    corrections.push("normalized state to USPS code");
  }

  if (parts.usedSuffixExpansion) {
    corrections.push("normalized street suffix");
  }

  return corrections;
};

const buildNormalizedAddress = (parts: ParsedAddressParts): NormalizedAddress => {
  return {
    street: parts.street,
    number: parts.number,
    city: parts.city,
    state: parts.state.code,
    zip_code: parts.zipCode,
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
