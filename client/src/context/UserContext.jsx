import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const UserContext = createContext();

export const UserContextProvider = ({ children }) => {
  // User state with OAuth2 properties
  const [user, setUser] = useState({
    username: "",
    isLoggedIn: false,
    sub: null, // Quran Foundation user ID (unique identifier)
    email: null,
    name: null,
    given_name: null,
    family_name: null,
  });

  // Token state for OAuth2 tokens
  const [tokens, setTokens] = useState({
    accessToken: null,
    refreshToken: null,
    idToken: null,
  });

  const [loading, setLoading] = useState(true);

  // Initialize user session on app load
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Check if we have tokens in localStorage
        const storedAccessToken = localStorage.getItem("accessToken");
        const storedRefreshToken = localStorage.getItem("refreshToken");
        const storedIdToken = localStorage.getItem("idToken");
        const storedUser = localStorage.getItem("user");

        if (storedAccessToken) {
          // Set tokens from localStorage
          const parsedTokens = {
            accessToken: storedAccessToken,
            refreshToken: storedRefreshToken,
            idToken: storedIdToken,
          };
          setTokens(parsedTokens);

          // Try to get current user from backend
          try {
            const response = await axios.get(
              `${import.meta.env.VITE_API_URL}/api/auth/me`,
              { withCredentials: true },
            );

            if (response.data.user) {
              const userData = response.data.user;
              setUser({
                isLoggedIn: true,
                fullname:
                  userData.first_name + " " + userData.last_name || "User",
                sub: userData.sub,
                email: userData.email,
                name: userData.name,
                given_name: userData.given_name,
                family_name: userData.family_name,
              });
            }
          } catch (error) {
            console.warn(
              "Failed to fetch user from backend, using stored data",
            );
            // Fall back to localStorage user data
            if (storedUser) {
              const parsedUser = JSON.parse(storedUser);
              setUser({
                isLoggedIn: true,
                fullname:
                  parsedUser.first_name + " " + parsedUser.last_name || "User",
                ...parsedUser,
              });
            }
          }
        } else {
          // No tokens, user is not logged in
          setUser({ isLoggedIn: false });
        }
      } catch (error) {
        console.error("Error initializing session:", error);
        setUser({ isLoggedIn: false });
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, []);

  // Update localStorage whenever tokens change
  useEffect(() => {
    if (tokens) {
      if (tokens.accessToken)
        localStorage.setItem("accessToken", tokens.accessToken);
      if (tokens.refreshToken)
        localStorage.setItem("refreshToken", tokens.refreshToken);
      if (tokens.idToken) localStorage.setItem("idToken", tokens.idToken);
    } else {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("idToken");
    }
  }, [tokens]);

  // Update localStorage whenever user changes
  useEffect(() => {
    if (user.isLoggedIn) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  // Helper function to refresh access token
  const refreshAccessToken = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
        {},
        { withCredentials: true },
      );

      if (response.data.accessToken) {
        setTokens({
          ...tokens,
          accessToken: response.data.accessToken,
        });
        return response.data.accessToken;
      }
    } catch (error) {
      console.error("Failed to refresh token:", error);
      // Clear auth on refresh failure
      setTokens({ accessToken: null, refreshToken: null, idToken: null });
      setUser({ isLoggedIn: false });
      throw error;
    }
  };

  // Setup axios interceptor for automatic token refresh
  useEffect(() => {
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If we get 401 and haven't already retried, try to refresh
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          tokens.refreshToken
        ) {
          originalRequest._retry = true;

          try {
            const newAccessToken = await refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      },
    );

    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [tokens.refreshToken]);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        tokens,
        setTokens,
        loading,
        refreshAccessToken,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
