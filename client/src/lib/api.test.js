import { afterEach, describe, expect, test, vi } from "vitest";

// API_BASE_URL is read when the module loads, so reload it for each case.
const loadApiUrl = async () => {
  vi.resetModules();
  return (await import("./api")).apiUrl;
};

describe("apiUrl", () => {
  afterEach(() => vi.unstubAllEnvs());

  test("is a relative URL by default (proxied to the backend)", async () => {
    vi.stubEnv("VITE_API_URL", "");
    expect((await loadApiUrl())("/api/quran/surahs")).toBe("/api/quran/surahs");
  });

  test("prefixes VITE_API_URL when one is configured", async () => {
    vi.stubEnv("VITE_API_URL", "https://api.example.com");
    expect((await loadApiUrl())("/api/auth/me")).toBe("https://api.example.com/api/auth/me");
  });
});
