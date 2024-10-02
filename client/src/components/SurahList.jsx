import React, { useEffect, useState } from "react";
import axios from "axios";
import SurahItem from "./SurahItem";
import "../styling/SurahList.css";

function SurahList() {
  const [surahlist, setSurahList] = useState([]);
  const [error, setError] = useState(null);

  //retrieving the surah list on page load and every time the surah list changes
  useEffect(() => {
    axios
      .get("/quran/surahs", {
        headers: {
          Accept: "application/json",
        },
      })
      .then((res) => {
        const response = res.data;
        console.log(res.data.chapters);
        if (response.success) {
          setError(null);
          setSurahList(res.data.chapters);
        } else setError(response.message);
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="surah-list-section">
      <h1>Surahs</h1>
      <div className="surah-list">
        {surahlist &&
          surahlist.length != 0 &&
          surahlist.map((surah) => (
            <SurahItem
              key={surah.id}
              id={surah.id}
              arabicName={surah.name_simple}
              englishName={surah.translated_name.name}
            />
          ))}

        {error ||
          (surahlist.length == 0 && (
            <div>
              <p>Could not load the surahs. Please try again.</p>
            </div>
          ))}
      </div>
    </div>
  );
}

export default SurahList;
