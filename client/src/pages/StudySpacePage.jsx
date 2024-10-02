import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Verse from "../components/Verse";
const StudySpacePage = () => {
  const [verses, setVerses] = useState([]);
  const [page, setPage] = useState(1);
  const [nextPageExist, setNextPageExist] = useState(false);

  const location = useLocation();
  // Retrieve the state data from the location object
  const { surahId, arabicName, englishName } = location.state || {}; // Handle undefined state

  useEffect(() => {
    if (surahId >= 1 && surahId <= 114) {
      fetch(`/quran/surahs/${surahId}?page=${page}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            if (data.verses && data.verses.length != 0) {
              setVerses((verse) => [...verse, ...data.verses]);
            }
            if (data.pagination && data.pagination.next_page) {
              setNextPageExist(true);
            } else if (data.pagination.next_page == null)
              setNextPageExist(false);
          }
        });
    }
  }, [page]);
  return (
    <div>
      <h1>Surah {arabicName}</h1>
      <div>{englishName}</div>
      <div>
        {verses.map((verse) => (
          <Verse key={verse.id} verse={verse} />
        ))}
        {nextPageExist && (
          <button
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
