import axios from "axios";
import { apiUrl } from "@/lib/api";

/** Exchange the OAuth authorization code for a server-side session. Resolves with the public user. */
export const exchangeCode = async (code, state) => {
  const { data } = await axios.post(
    apiUrl("/api/auth/qf/exchange"),
    { code, state },
    { withCredentials: true },
  );
  if (!data.success) throw new Error(data.error || "Token exchange failed");
  return data.user;
};

/** The logged-in user according to the server session, or null. */
export const fetchCurrentUser = async () => {
  try {
    const { data } = await axios.get(apiUrl("/api/auth/me"), {
      withCredentials: true,
    });
    return data.user ?? null;
  } catch {
    return null;
  }
};
