import { describe, expect, test } from "vitest";
import { getFullName } from "./user";

describe("getFullName", () => {
  test("joins first and last name", () => {
    expect(getFullName({ first_name: "Ada", last_name: "Lovelace" })).toBe("Ada Lovelace");
  });

  test("falls back to given/family name claims", () => {
    expect(getFullName({ given_name: "Ada", family_name: "Lovelace" })).toBe("Ada Lovelace");
  });

  test("never produces 'undefined' when a part is missing", () => {
    expect(getFullName({ first_name: "Ada" })).toBe("Ada");
    expect(getFullName({ last_name: "Lovelace" })).toBe("Lovelace");
  });

  test("uses the name claim, then a generic label", () => {
    expect(getFullName({ name: "Ada L." })).toBe("Ada L.");
    expect(getFullName({})).toBe("User");
    expect(getFullName(null)).toBe("User");
  });
});
