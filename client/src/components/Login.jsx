import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../context/UserContext";
import axios from "axios";
import { Spinner } from "./ui/spinner";

function Login() {
  const { user, setUser, setTokens } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Initiate login by redirecting to Quran Foundation login screen
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      // Request authorization URL from backend
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/login`, { withCredentials: true });

      if (response.data.authUrl) {
        // Redirect to Quran Foundation hosted login
        window.location.href = response.data.authUrl;
      }
    } catch (err) {
      setError("Failed to initiate login. Please try again.");
      setLoading(false);
    }
  };

  /**
   * Handle logout
   */
  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      // Call backend logout endpoint
      await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/logout`, { withCredentials: true });

      // Clear user context
      setUser({ isLoggedIn: false });
      setTokens({ accessToken: null, refreshToken: null, idToken: null });

      setLoading(false);
    } catch (err) {
      
      // Still clear local data even if backend call fails
      setUser({ isLoggedIn: false });
      setTokens({ accessToken: null, refreshToken: null, idToken: null });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {error && !user.isLoggedIn && (
        <div className="text-red-400 text-sm bg-foreground-bg border border-foreground-bg px-3 py-2 rounded">
          {error}
        </div>
      )}

      {user?.isLoggedIn && !loading ? (
        <div className="profile-info flex items-center gap-3">
          <span className="username text-sm font-medium">{user.fullname}</span>
          <button
            className="cursor-pointer bg-red-500/50 border border-red-500/10 flex items-center gap-4 text-white px-4 py-2 rounded-full hover:bg-red-600/60 transition-colors duration-300 ease-in-out w-fit text-sm"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      ) : (
        <button
          className="bg-primary/40 border border-primary/10 px-4 py-2 rounded-full flex items-center gap-4 cursor-pointer text-foreground hover:text-foreground/80 hover:bg-primary/20 transition-colors duration-300 ease-in-out w-fit text-sm"
          onClick={handleLogin}
        >
          Login with Quran Foundation
        </button>
      )}
    </div>
  );
}

export default Login;
