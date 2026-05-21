import React, { useContext, useEffect, useState } from "react";
import { Bookmark, BookMarkedIcon, Link, Plus } from "lucide-react";

import { UserContext } from "../context/UserContext";
import { Spinner } from "./ui/spinner";
import ConnectionGraph from "./ConnectionGraph";
import AddConnectionModal from "./AddConnectionModal";

function Verse({ verse }) {
  const { user, setUser, setTokens } = useContext(UserContext);
  const [sectionOpen, setSectionOpen] = useState(false);
  const [dataToFetch, setDataToFetch] = useState(false);
  const [noOfConnections, setNoOfConnections] = useState("");
  const [fetchedData, setFetchedData] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [isSubmittingConnection, setIsSubmittingConnection] = useState(false);
  const [bookmarkedDetails, setBookmarkedDetails] = useState({
    isBookmarked: false,
    id: null,
  });
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(true);
  const [bookmarkError, setBookmarkError] = useState(null);

  const { tokens } = useContext(UserContext);

  useEffect(() => {
    fetch(`/api/content/connections/${verse.verse_key}/count`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    })
      .then((res) => {
        if (res.status === 401) {
          setError("Unauthorized. Please log in again.");
          // Clear user context
          setUser({ isLoggedIn: false });
          setTokens({ accessToken: null, refreshToken: null, idToken: null });
          setNoOfConnections(0);
          return {};
        }
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setNoOfConnections(data.count);
        } else {
          setNoOfConnections(0);
        }
      })
      .catch((err) => {
        setNoOfConnections(0);
      });
  }, []);

  useEffect(() => {
    fetch(`/api/content/bookmarks/bookmark/${verse.verse_key}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    })
      .then((res) => {
        if (res.status === 401) {
          setError("Unauthorized. Please log in again.");
          // Clear user context
          setUser({ isLoggedIn: false });
          setTokens({ accessToken: null, refreshToken: null, idToken: null });
          setBookmarkedDetails({
            isBookmarked: false,
            id: null,
          });
          return {};
        }
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setBookmarkedDetails({
            isBookmarked: data.bookmark,
            id: data.bookmarkId,
          });
        } else {
          setBookmarkedDetails({
            isBookmarked: false,
            id: null,
          });
        }
      })
      .catch((err) => {
        setBookmarkedDetails({
          isBookmarked: false,
          id: null,
        });
      })
      .finally(() => {
        setIsBookmarkLoading(false);
      });
  }, []);

  const addConnectionHandler = () => {
    setShowAddModal(true);
    setModalError(null);
  };

  const sendConnectionRequest = async (data) => {
    setIsSubmittingConnection(true);
    setModalError(null);

    try {
      const response = await fetch("/api/content/connections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({
          fromVerse: data.fromVerse,
          toVerse: data.toVerse,
          note: data.note,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setModalError(
          result.message || "Failed to create connection. Please try again.",
        );
        setIsSubmittingConnection(false);
        return;
      }

      if (result.success) {
        // Close modal and refresh connections
        setShowAddModal(false);
        setModalError(null);
        // Trigger refetch of connections
        setSectionOpen(true);
        setDataToFetch(true);
        setIsLoading(true);
      } else {
        setModalError(result.message || "Failed to create connection.");
      }
    } catch (err) {
      setModalError(
        err.message || "An error occurred while creating the connection.",
      );
    } finally {
      setIsSubmittingConnection(false);
    }
  };

  useEffect(() => {
    if (dataToFetch) {
      setError(null);
      setIsLoading(true);
      fetch(`/api/content/connections/${verse.verse_key}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      })
        .then((res) => {
          if (res.status === 404) {
            setNoOfConnections(0);
          }
          if (res.status === 401) {
            setError("Unauthorized. Please log in again.");
            // Clear user context
            setUser({ isLoggedIn: false });
            setTokens({ accessToken: null, refreshToken: null, idToken: null });
            setNoOfConnections(0);
            return {};
          }
          return res.json();
        })
        .then((data) => {
          if (data.success) {
            setFetchedData(data.connections);
            setNoOfConnections(data.connections.length);
          } else {
            setError(data.message || "Failed to fetch connections.");
          }
        })
        .finally(() => {
          setDataToFetch(false);
          setIsLoading(false);
        });
    }
  }, [dataToFetch]);

  const displayConnections = () => {
    setSectionOpen((x) => !x);
    setError(null);
    setIsLoading((x) => !x);
    setDataToFetch((x) => !x);
  };

  const manageBookmark = () => {
    if (bookmarkedDetails.isBookmarked) {
      setIsBookmarkLoading(true);
      fetch(`/api/content/bookmarks/${bookmarkedDetails.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      })
        .then((res) => {
          if (res.status === 401) {
            setError("Unauthorized. Please log in again.");
            // Clear user context
            setUser({ isLoggedIn: false });
            setTokens({ accessToken: null, refreshToken: null, idToken: null });
            setBookmarkedDetails({
              isBookmarked: false,
              id: null,
            });
            return {};
          }
          return res.json();
        })
        .then((data) => {
          if (!data.success) {
            setBookmarkError(data.message || "Failed to remove bookmark.");
          } else if (data.success) {
            setBookmarkedDetails({
              isBookmarked: false,
              id: null,
            });
          }
        })
        .catch((err) => {
          setBookmarkError(err.message || "Failed to remove bookmark.");
        })
        .finally(() => {
          setIsBookmarkLoading(false);
        });
    } else {
      setIsBookmarkLoading(true);
      fetch("/api/content/bookmarks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({
          verseKey: verse.verse_key,
        }),
      })
        .then((res) => {
          if (res.status === 401) {
            setError("Unauthorized. Please log in again.");
            // Clear user context
            setUser({ isLoggedIn: false });
            setTokens({ accessToken: null, refreshToken: null, idToken: null });
            setBookmarkedDetails({
              isBookmarked: false,
              id: null,
            });
            return {};
          }
          return res.json();
        })
        .then((data) => {
          if (!data.success) {
            setBookmarkError(data.message || "Failed to add bookmark.");
          } else if (data.success) {
            setBookmarkedDetails({
              isBookmarked: true,
              id: data.bookmarkId,
            });
          }
        })
        .catch((err) => {
          setBookmarkError(err.message || "Failed to add bookmark.");
        })
        .finally(() => {
          setIsBookmarkLoading(false);
        });
    }
  };

  return (
    <>
      <hr className="mb-6 text-foreground-muted/50"></hr>
      <div className="flex flex-column gap-3 justify-between">
        <div className="basis-0.5/12 flex flex-col items-center gap-4">
          <div className="text-sm text-foreground-bg-muted">
            {verse.verse_key}
          </div>
          {user.isLoggedIn ? (
            <div>
              {isBookmarkLoading ? (
                <Spinner className="w-6 h-6" />
              ) : (
                <Bookmark
                  className={`w-6 h-6 text-foreground-bg-muted cursor-pointer ${!bookmarkedDetails.isBookmarked ? "hover:text-primary" : ""} transition-colors duration-200 ease-in-out `}
                  fill={bookmarkedDetails.isBookmarked ? "#abb3b3" : ""}
                  onClick={manageBookmark}
                />
              )}
              {bookmarkError && <p className="text-red-500">{bookmarkError}</p>}
            </div>
          ) : null}
        </div>
        <div
          className={`${user.isLoggedIn ? "basis-10/12" : "basis-11/12"} pr-2 flex flex-col gap-3 mb-6`}
        >
          <div className="text-xl text-right">{verse.text_uthmani}</div>
          <div className="translation">{verse?.translations[0]?.text}</div>
        </div>
        {user?.isLoggedIn && (
          <div className="basis-1/12 flex flex-col items-center gap-2">
            <span
              className="flex items-center gap-1 bg-foreground-bg border border-foreground-border/10 px-3 py-1 rounded-full cursor-pointer text-foreground-muted hover:text-foreground hover:bg-primary/20 transition-colors duration-200 ease-in-out"
              onClick={displayConnections}
            >
              {noOfConnections === "" ? (
                <Spinner className="w-4 h-4" />
              ) : (
                noOfConnections
              )}{" "}
              <Link className="w-4" />
            </span>
            <button
              className="text-sm text-foreground-bg-muted cursor-pointer hover:text-primary"
              onClick={addConnectionHandler}
            >
              <Plus className="w-5" />
            </button>
          </div>
        )}
      </div>
      {sectionOpen && (
        <div className="py-5 bg-foreground-bg transition duration-200 ease-in-out rounded-xl p-10">
          {isLoading ? (
            <div className="flex items-center justify-center w-full ">
              <Spinner className="w-4 h-4" />
            </div>
          ) : error ? (
            <p>{error}</p>
          ) : fetchedData && fetchedData.length > 0 ? (
            <ConnectionGraph
              connections={fetchedData}
              setDataToFetch={setDataToFetch}
            />
          ) : (
            <p>No data to display.</p>
          )}
        </div>
      )}
      {showAddModal && (
        <AddConnectionModal
          fromVerseKey={verse.verse_key}
          onClose={() => setShowAddModal(false)}
          onSubmit={sendConnectionRequest}
          isLoading={isSubmittingConnection}
          error={modalError}
        />
      )}
    </>
  );
}

export default Verse;
