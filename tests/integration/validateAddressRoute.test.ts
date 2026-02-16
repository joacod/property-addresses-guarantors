import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { UNVERIFIABLE_REASONS } from "../../src/domain/addressContract.js";

interface TestApp {
  default: Parameters<typeof request>[0];
}

let app: Parameters<typeof request>[0];

beforeAll(async () => {
  process.env.AUTH_ENABLED = "false";
  const appModule = (await import("../../src/app.js")) as TestApp;
  app = appModule.default;
});

describe("POST /validate-address", () => {
  it("returns valid for an exact normalized address", async () => {
    const response = await request(app).post("/validate-address").send({
      address: "123 Main St, Springfield, IL 62704",
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: "valid",
      is_valid: true,
      confidence: 0.94,
      corrections: [],
      reason: null,
      source: "local-heuristic",
      normalized: {
        number: "123",
        street: "Main St",
        city: "Springfield",
        state: "IL",
        zip_code: "62704",
      },
    });
  });

  it("returns corrected when provider normalizes the input", async () => {
    const response = await request(app).post("/validate-address").send({
      address: "123 main street, springfield, illinois 62704",
    });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("corrected");
    expect(response.body.is_valid).toBe(true);
    expect(response.body.corrections).toEqual(
      expect.arrayContaining([
        "normalized state to USPS code",
        "normalized street suffix",
      ]),
    );
    expect(response.body.reason).toBeNull();
    expect(response.body.normalized).toEqual({
      number: "123",
      street: "Main St",
      city: "Springfield",
      state: "IL",
      zip_code: "62704",
    });
  });

  it("returns unverifiable for partial addresses", async () => {
    const response = await request(app).post("/validate-address").send({
      address: "Main St, Springfield",
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: "unverifiable",
      is_valid: false,
      normalized: null,
      corrections: [],
      reason: UNVERIFIABLE_REASONS.UNPARSEABLE_ADDRESS,
      source: "local-heuristic",
    });
  });

  it("returns unverifiable for non-US addresses", async () => {
    const response = await request(app).post("/validate-address").send({
      address: "10 Downing St, London, UK SW1A 2AA",
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: "unverifiable",
      is_valid: false,
      normalized: null,
      corrections: [],
      reason: UNVERIFIABLE_REASONS.NON_US_ADDRESS,
      source: "local-heuristic",
    });
  });

  it("returns 400 with consistent error shape for malformed payload", async () => {
    const response = await request(app).post("/validate-address").send({
      address: "   ",
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      code: "INVALID_REQUEST",
      message: "Request validation failed",
      details: [
        {
          path: "address",
          message: "address must not be empty",
        },
      ],
    });
    expect(typeof response.body.request_id).toBe("string");
    expect(response.body.request_id.length).toBeGreaterThan(0);
  });
});
