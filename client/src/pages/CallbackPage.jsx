import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Spinner } from "../components/ui/spinner";
import axios from "axios";
import { useContext } from "react";
import { UserContext } from "../context/UserContext";

/**
 * CallbackPage component handles OAuth2 redirect from Quran Foundation
 * This page is visited when the user returns from the OAuth2 provider login
 * URL format: /callback?code=CODE&state=STATE
 */
function CallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser, setTokens } = useContext(UserContext);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const errorParam = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        // Check for OAuth error response
        if (errorParam) {
          throw new Error(`OAuth Error: ${errorDescription || errorParam}`);
        }

        // Check for required parameters
        if (!code || !state) {
          throw new Error("Missing authorization code or state parameter");
        }

        // Exchange authorization code for tokens
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/qf/exchange`, {
          code,
          state,
        });

        if (!response.data.success) {
          throw new Error(response.data.error || "Token exchange failed");
        }

        const {
          accessToken,
          refreshToken,
          idToken,
          user: userData,
        } = response.data;

        // Store tokens in context
        setTokens({
          accessToken,
          refreshToken,
          idToken,
        });

        // Store user info in context
        setUser({
          ...userData,
          isLoggedIn: true,
          fullname: userData?.first_name + " " + userData?.last_name || "User",
        });

        // Wait a moment before redirect to allow context to update
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 500);
      } catch (err) {
        console.error("Callback error:", err);
        setError(
          err.response?.data?.error ||
            err.message ||
            "Failed to complete authentication. Please try again.",
        );
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, setUser, setTokens, navigate]);

  if (loading && !error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Spinner />
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h1 className="text-red-700 font-semibold mb-2">
            Authentication Failed
          </h1>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default CallbackPage;
