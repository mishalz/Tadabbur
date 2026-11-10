import React, { useContext, useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Spinner } from "../components/ui/spinner";
import { UserContext } from "../context/UserContext";
import { getFullName } from "../utils/user";
import { exchangeCode, fetchCurrentUser } from "@/lib/authApi";
import { completeLogin } from "@/lib/oauthCallback";

/**
 * CallbackPage component handles OAuth2 redirect from Quran Foundation
 * This page is visited when the user returns from the OAuth2 provider login
 * URL format: /callback?code=CODE&state=STATE
 */
function CallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);
  const [error, setError] = useState(null);
  // The authorization code is single-use: make sure the exchange runs once per
  // visit even if this effect runs again.
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    completeLogin(searchParams, { exchangeCode, fetchCurrentUser })
      .then((userData) => {
        setUser({
          ...userData,
          isLoggedIn: true,
          fullname: getFullName(userData),
        });
        navigate("/", { replace: true });
      })
      .catch((err) => {
        console.error("Callback error:", err.message);
        setError(err.message);
      });
  }, [searchParams, setUser, navigate]);

  if (!error) {
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
