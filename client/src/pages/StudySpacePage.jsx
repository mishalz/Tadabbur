import React, { useEffect, useState, useContext } from "react";
import { useLocation } from "react-router-dom";
import Verse from "../components/Verse";
import { Spinner } from "@/components/ui/spinner";
import { ResourcesContext } from "../context/ResourcesContext";
import { MessageCircleWarning } from "lucide-react";

const StudySpacePage = () => {
  const [verses, setVerses] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextPageExist, setNextPageExist] = useState(false);
  const { params } = useContext(ResourcesContext);
  const location = useLocation();
  // Retrieve the state data from the location object
  const storedSurah = JSON.parse(localStorage.getItem("last-surah")); //to retrieve the last surah that was opened in case the user refreshes the page or comes back to it after leaving
  if (location.state) {
    localStorage.setItem("last-surah", JSON.stringify(location.state));
  }
  const { surahId, arabicName, englishName } =
    location.state || storedSurah || {};

  const script = params.script; //to include the arabic text in the response
  const translation_id = params.translationId; //to include the translation of the verse in the response

  useEffect(() => {
    setLoading(true);
    if (surahId >= 1 && surahId <= 114) {
      fetch(
        `/api/quran/surahs/${surahId}?page=${page}&script=${script}&translation_id=${translation_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
        .then((res) => {
          if (res.status !== 200)
            setError("Failed to load the verses. Please try again.");
          return res.json();
        })
        .then((json_result) => {
          const data = json_result;
          if (data.verses && data.verses.length > 0) {
            setVerses((verses) => [...verses, ...data.verses]);
          }
          if (data.pagination && data.pagination.next_page) {
            setNextPageExist(true);
          } else {
            setNextPageExist(false);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [surahId, page]);
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
