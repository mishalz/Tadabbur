import React, { useEffect, useState, useContext } from "react";
import Verse from "../components/Verse";
import { Spinner } from "@/components/ui/spinner";
import { UserContext } from "../context/UserContext";
import { Bookmark, MessageCircleWarning } from "lucide-react";

const BookmarksPage = () => {
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [endCursor, setEndCursor] = useState(null);
  const { user, setUser, tokens, setTokens } = useContext(UserContext);

  const fetchBookmarks = async (cursor = null, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const params = new URLSearchParams();
      params.append("first", 4);
      if (cursor) {
        params.append("after", cursor);
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/content/bookmarks?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        },
      );

      if (response.status === 401) {
        setError("You are not authenticated. Please log in.");
        setUser({ isLoggedIn: false });
        setTokens({ accessToken: null, refreshToken: null, idToken: null });
        return;
      }

      if (!response.ok) {
        setError("Failed to load bookmarks. Please try again.");
        return;
      }

      const data = await response.json();
      const newVerses = data.bookmarks || [];

      if (isLoadMore) {
        setVerses((prev) => [...prev, ...newVerses]);
      } else {
        setVerses(newVerses);
      }

      // Update pagination state
      if (data.pagination) {
        setHasNextPage(data.pagination.hasNextPage || false);
        setEndCursor(data.pagination.endCursor || null);
      }
    } catch (err) {
      console.error("Error fetching bookmarks:", err);
      setError("An error occurred while loading bookmarks. Please try again.");
    } finally {
      if (isLoadMore) {
        setIsLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (user.isLoggedIn) {
      fetchBookmarks();
    } else {
      setError("You need to be logged in to view bookmarks.");
      setLoading(false);
    }
  }, [user.isLoggedIn]);

  return (
    <div>
      <h1 className="mb-0">Bookmarks</h1>
      <div className="text-xl text-foreground-muted mb-3">
        Your saved verses
      </div>
      <hr />

      {loading && (
        <div className="flex items-center justify-center w-full mt-5">
          <Spinner className="w-8 h-8" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-destructive/20 text-destructive h-full rounded mt-5">
          <span>
            <MessageCircleWarning className="w-4 h-4 text-red-400" />
          </span>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && verses.length === 0 && (
        <div className="flex items-center justify-center w-full mt-10">
          <p className="text-foreground-muted text-lg">
            No bookmarked verses yet. Start bookmarking verses to see them here.
          </p>
        </div>
      )}

      {!loading && !error && verses.length > 0 && (
        <div className="mt-5">
          {verses.map((verse) => (
            <>
              <div
                key={verse.id}
                className="bg-card p-5 border border-foreground-bg rounded-lg mb-4 hover:shadow-md transition-shadow"
              >
                <div className="text-foreground text-sm mb-2">
                  {new Date(verse.createdAt).toLocaleString().substring(0, 10)}
                </div>
                <div className="flex flex-column gap-3 justify-between">
                  <div className="basis-0.5/12 flex flex-col items-center gap-4">
                    <div className="text-sm text-foreground-bg-muted/70">
                      {verse.key}:{verse.verseNumber}
                    </div>
                  </div>
                  <div className={`basis-11/12 pr-2 flex flex-col gap-3 mb-6`}>
                    <div className="text-xl text-right">
                      {verse.text_uthmani}
                    </div>
                    <div className="translation">{verse?.translation}</div>
                  </div>
                </div>
              </div>
            </>
          ))}
          {hasNextPage && (
            <div className="flex items-center justify-center w-full mt-6">
              <button
                onClick={() => fetchBookmarks(endCursor, true)}
                disabled={isLoadingMore}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
              >
                {isLoadingMore ? <Spinner className="w-4 h-4" /> : "Load More"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookmarksPage;
