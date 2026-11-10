import { describe, expect, test, vi } from "vitest";
import { completeLogin } from "./oauthCallback";

const params = (query) => new URLSearchParams(query);
const user = { sub: "u1", first_name: "Ada" };
const forbidden = Object.assign(new Error("Request failed"), {
  response: { status: 403, data: { error: "Invalid state parameter - CSRF validation failed" } },
});

describe("completeLogin", () => {
  test("exchanges the code and returns the user", async () => {
    const api = { exchangeCode: vi.fn().mockResolvedValue(user), fetchCurrentUser: vi.fn() };

    await expect(completeLogin(params("code=c&state=s"), api)).resolves.toEqual(user);
    expect(api.exchangeCode).toHaveBeenCalledWith("c", "s");
    expect(api.fetchCurrentUser).not.toHaveBeenCalled();
  });

  test("an OAuth error from the provider is reported without calling the API", async () => {
    const api = { exchangeCode: vi.fn(), fetchCurrentUser: vi.fn() };

    await expect(
      completeLogin(params("error=access_denied&error_description=User%20cancelled"), api),
    ).rejects.toThrow("Login was not completed: User cancelled");
    expect(api.exchangeCode).not.toHaveBeenCalled();
  });

  test("missing code or state is rejected", async () => {
    const api = { exchangeCode: vi.fn(), fetchCurrentUser: vi.fn() };

    await expect(completeLogin(params("code=c"), api)).rejects.toThrow(/Missing authorization code/);
    await expect(completeLogin(params(""), api)).rejects.toThrow(/Missing authorization code/);
  });

  test("a repeated submission of the same callback does not show a false error when already logged in", async () => {
    const api = {
      exchangeCode: vi.fn().mockRejectedValue(forbidden), // state already consumed by the first submission
      fetchCurrentUser: vi.fn().mockResolvedValue(user),
    };

    await expect(completeLogin(params("code=c&state=s"), api)).resolves.toEqual(user);
  });

  test("a state failure without a session gets a clear message", async () => {
    const api = { exchangeCode: vi.fn().mockRejectedValue(forbidden), fetchCurrentUser: vi.fn().mockResolvedValue(null) };

    await expect(completeLogin(params("code=c&state=s"), api)).rejects.toThrow(
      "Your login session expired or was already used. Please try logging in again.",
    );
  });

  test("other failures surface the server's message", async () => {
    const failure = Object.assign(new Error("x"), {
      response: { status: 401, data: { error: "Authorization code expired or already used. Please restart login." } },
    });
    const api = { exchangeCode: vi.fn().mockRejectedValue(failure), fetchCurrentUser: vi.fn().mockResolvedValue(null) };

    await expect(completeLogin(params("code=c&state=s"), api)).rejects.toThrow(/restart login/);
  });
});
