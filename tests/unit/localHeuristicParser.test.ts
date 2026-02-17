import { describe, expect, it } from "vitest";
import { parseAddressParts } from "../../src/providers/localHeuristicParser.js";

describe("parseAddressParts", () => {
  it("parses comma-separated addresses with directional and full state name", () => {
    const parsed = parseAddressParts("123 w broadway avenue, new york, new york 10001");

    expect(parsed).toEqual({
      number: "123",
      street: "W Broadway Ave",
      city: "New York",
      state: {
        code: "NY",
        fromFullName: true,
      },
      zipCode: "10001",
      usedSuffixExpansion: true,
    });
  });

  it("parses single-segment addresses with multi-word city/state", () => {
    const parsed = parseAddressParts("456 elm rd los angeles california 90001");

    expect(parsed).toEqual({
      number: "456",
      street: "Elm Rd",
      city: "Los Angeles",
      state: {
        code: "CA",
        fromFullName: true,
      },
      zipCode: "90001",
      usedSuffixExpansion: false,
    });
  });

  it("supports alphanumeric street numbers and ZIP+4", () => {
    const parsed = parseAddressParts("12B Main St, Springfield, IL 62704-1234");

    expect(parsed).toEqual({
      number: "12B",
      street: "Main St",
      city: "Springfield",
      state: {
        code: "IL",
        fromFullName: false,
      },
      zipCode: "62704-1234",
      usedSuffixExpansion: false,
    });
  });

  it("returns null for invalid zip code", () => {
    const parsed = parseAddressParts("123 Main St, Springfield, IL 6270");
    expect(parsed).toBeNull();
  });

  it("returns null when city cannot be resolved", () => {
    const parsed = parseAddressParts("123 Main St IL 62704");
    expect(parsed).toBeNull();
  });
});
