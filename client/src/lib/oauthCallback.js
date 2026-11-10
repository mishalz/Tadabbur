/**
 * Complete a login from the OAuth redirect (/callback?code=...&state=...).
 *
 * The authorization code is single-use and the server clears the stored
 * `state` once an exchange succeeds, so submitting the same callback a second
 * time (page reload, remount, double submit) fails with "invalid state" even
 * though the user is already logged in. When the exchange fails we therefore
 * check whether a session already exists and, if so, carry on instead of
 * showing a false error.
 *
 * @param {URLSearchParams} params
 * @param {{ exchangeCode: Function, fetchCurrentUser: Function }} api
 * @returns {Promise<object>} the logged-in user
 */
export async function completeLogin(params, { exchangeCode, fetchCurrentUser }) {
  const oauthError = params.get("error");
  if (oauthError) {
    throw new Error(
      `Login was not completed: ${params.get("error_description") || oauthError}`,
    );
  }

  const code = params.get("code");
  const state = params.get("state");
  if (!code || !state) {
    throw new Error("Missing authorization code or state parameter");
  }

  try {
    return await exchangeCode(code, state);
  } catch (error) {
    const existingUser = await fetchCurrentUser();
    if (existingUser) return existingUser;

    if (error.response?.status === 403) {
      throw new Error(
        "Your login session expired or was already used. Please try logging in again.",
      );
    }
    throw new Error(
      error.response?.data?.error ||
        error.message ||
        "Failed to complete authentication. Please try again.",
    );
  }
}
