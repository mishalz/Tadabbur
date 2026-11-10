import { createContext, useState, useEffect } from "react";
import axios from "axios";
import { getFullName } from "../utils/user";

export const UserContext = createContext();

const LOGGED_OUT = { isLoggedIn: false };

// Keys written by older versions of the app, which kept OAuth tokens and the
// user in localStorage. Tokens now live only in the server-side session.
const LEGACY_STORAGE_KEYS = ["accessToken", "refreshToken", "idToken", "user"];

const clearLegacyStorage = () => {
  try {
    LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // storage unavailable (private mode etc.) - nothing to clean up
  }
};

export const UserContextProvider = ({ children }) => {
  const [user, setUser] = useState(LOGGED_OUT);
  const [loading, setLoading] = useState(true);

  // The session cookie is the only credential. Ask the server who we are;
  // nothing sensitive is kept in the browser.
  useEffect(() => {
    clearLegacyStorage();

    const initializeSession = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/auth/me`,
          { withCredentials: true },
        );

        if (response.data.user) {
          const userData = response.data.user;
          setUser({
            ...userData,
            isLoggedIn: true,
            fullname: getFullName(userData),
          });
        } else {
          setUser(LOGGED_OUT);
        }
      } catch (error) {
        // 401 = no session. Any other failure (server asleep/unreachable) also
        // leaves the user logged out rather than guessing from stale data.
        if (error.response?.status !== 401) {
          console.warn("Could not verify session:", error.message);
        }
        setUser(LOGGED_OUT);
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};
