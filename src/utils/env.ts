import dotenv from "dotenv";

dotenv.config({ quiet: true });

const DEFAULT_PORT = 3000;

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

export interface RuntimeConfig {
  port: number;
  corsAllowlist: string[];
}

export const runtimeConfig: RuntimeConfig = {
  port: parsePort(process.env.PORT),
  corsAllowlist: parseCorsAllowlist(process.env.CORS_ALLOWLIST),
};
