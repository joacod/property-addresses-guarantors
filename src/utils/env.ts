import dotenv from "dotenv";

dotenv.config({ quiet: true });

const DEFAULT_PORT = 3000;
const DEFAULT_AUTH_ENABLED = false;
const BOOLEAN_TRUE_VALUES = new Set(["1", "true", "yes", "on"]);
const BOOLEAN_FALSE_VALUES = new Set(["0", "false", "no", "off"]);

const parsePort = (rawPort: string | undefined): number => {
  if (!rawPort) {
    return DEFAULT_PORT;
  }

  const parsedPort = Number(rawPort);

  if (!Number.isInteger(parsedPort) || parsedPort <= 0 || parsedPort > 65535) {
    return DEFAULT_PORT;
  }

  return parsedPort;
};

const parseCorsAllowlist = (rawAllowlist: string | undefined): string[] => {
  if (!rawAllowlist) {
    return [];
  }

  return Array.from(
    new Set(
      rawAllowlist
        .split(",")
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0),
    ),
  );
};

const parseBoolean = (
  rawValue: string | undefined,
  defaultValue: boolean,
): boolean => {
  const normalizedValue = rawValue?.trim().toLowerCase();

  if (!normalizedValue) {
    return defaultValue;
  }

  if (BOOLEAN_TRUE_VALUES.has(normalizedValue)) {
    return true;
  }

  if (BOOLEAN_FALSE_VALUES.has(normalizedValue)) {
    return false;
  }

  return defaultValue;
};

export interface RuntimeConfig {
  port: number;
  corsAllowlist: string[];
  authEnabled: boolean;
}

export const runtimeConfig: RuntimeConfig = {
  port: parsePort(process.env.PORT),
  corsAllowlist: parseCorsAllowlist(process.env.CORS_ALLOWLIST),
  authEnabled: parseBoolean(process.env.AUTH_ENABLED, DEFAULT_AUTH_ENABLED),
};
