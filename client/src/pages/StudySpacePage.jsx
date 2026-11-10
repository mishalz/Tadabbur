import React, { useEffect, useState, useContext } from "react";
import { useLocation } from "react-router-dom";
import Verse from "../components/Verse";
import { Spinner } from "@/components/ui/spinner";
import { ResourcesContext } from "../context/ResourcesContext";
import { MessageCircleWarning } from "lucide-react";
import { apiUrl } from "@/lib/api";

const StudySpacePage = () => {
  const [verses, setVerses] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextPageExist, setNextPageExist] = useState(false);
  const { params } = useContext(ResourcesContext);
  const location = useLocation();
  // Retrieve the state data from the location object. The last opened surah is
  // remembered so a refresh (or coming back later) shows the same surah.
  let storedSurah = null;
  try {
    storedSurah = JSON.parse(localStorage.getItem("last-surah"));
    if (location.state) {
      localStorage.setItem("last-surah", JSON.stringify(location.state));
    }
  } catch {
    // storage unavailable or corrupted - fall back to the router state only
  }
  const { surahId, arabicName, englishName } =
    location.state || storedSurah || {};

  const script = params.script; //to include the arabic text in the response
  const translation_id = params.translationId; //to include the translation of the verse in the response

  // A different surah or translation starts again from page 1 with no verses.
  useEffect(() => {
    setVerses([]);
    setPage(1);
    setError(null);
  }, [surahId, script, translation_id]);

  useEffect(() => {
    if (!(surahId >= 1 && surahId <= 114)) return;

    // Abort the request if the inputs change before it finishes, so a slow
    // response for an old surah/page can never be appended to the new one.
    const controller = new AbortController();
    setLoading(true);

    fetch(
      apiUrl(
        `/api/quran/surahs/${surahId}?page=${page}&script=${script}&translation_id=${translation_id}`,
      ),
      { signal: controller.signal },
    )
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load the verses.");
        const data = await res.json();
        if (data.verses?.length > 0) {
          setVerses((verses) => [...verses, ...data.verses]);
        }
        setNextPageExist(Boolean(data.pagination?.next_page));
        setError(null);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError("Failed to load the verses. Please try again.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [surahId, page, script, translation_id]);

  return (
    <div>
      <h1 className="mb-0">Surah {arabicName}</h1>
      <div className="text-xl text-foreground-muted mb-3">{englishName}</div>
      <hr />
      {loading && (
        <div className="flex items-center justify-center w-full mt-5">
          <Spinner className="w-8 h-8" />
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-destructive/20  text-destructive h-full rounded mt-5">
          <span>
            <MessageCircleWarning className="w-4 h-4 text-red-400" />
          </span>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      <div>
        {verses.map((verse) => (
          <Verse key={verse.id} verse={verse} />
        ))}
        {nextPageExist && (
          <div className="w-full flex items-center justify-center">
            <button
              className="rounded-full bg-primary/20 text-primary border border-primary/10 px-5 py-2 mt-5 mb-10 hover:bg-primary/30 transition-colors duration-200 ease-in-out"
              onClick={() => {
                setPage((x) => x + 1);
              }}
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudySpacePage;
