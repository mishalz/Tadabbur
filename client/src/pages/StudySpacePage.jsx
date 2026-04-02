import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Verse from "../components/Verse";
import "../styling/StudySpace.css";
const StudySpacePage = () => {
  const [verses, setVerses] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextPageExist, setNextPageExist] = useState(false);

  const location = useLocation();
  // Retrieve the state data from the location object
  const { surahId, arabicName, englishName } = location.state || {}; // Handle undefined state

  useEffect(() => {
    setLoading(true);
    if (surahId >= 1 && surahId <= 114) {
      fetch(`/quran/surahs/${surahId}?page=${page}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => {
          if (res.status !== 200)
            setError("Failed to load the verses. Please try again.");
          return res.json();
        })
        .then((json_result) => {
          const data = json_result.data;
          if (data.verses && data.verses.length > 0) {
            console.log("Verses retrieved successfully");
            console.log(data.verses);
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
      <h1>Surah {arabicName}</h1>
      {!arabicName && <hr />}
      <div>{englishName}</div>
      {!verses && loading && <p>Loading...</p>}
      <div>
        {verses.map((verse) => (
          <Verse key={verse.id} verse={verse} />
        ))}
        {nextPageExist && (
          <button
            id="load-button"
            onClick={() => {
              setPage((x) => x + 1);
            }}
          >
            Load More
          </button>
        )}
      </div>
    </div>
  );
};

export default StudySpacePage;
