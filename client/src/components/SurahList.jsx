import React, { useEffect, useState } from "react";
import axios from "axios";
import SurahItem from "./SurahItem";
// import "../styling/SurahList.css";
import { LoaderCircle } from "lucide-react";
import { Spinner } from "./ui/spinner";

function SurahList() {
  const [surahlist, setSurahList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  //retrieving the surah list on page load and every time the surah list changes
  useEffect(() => {
    setLoading(true);
    axios
      .get("/api/quran/surahs", {
        headers: {
          Accept: "application/json",
        },
      })
      .then((res) => {
        if (res.status === 200) {
          setError(null);
          setSurahList(res.data.chapters);
        } else setError(res.data.message);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="w-full">
      <h1>Surahs</h1>
      <hr />
      <div className="flex flex-column items-center gap-5 mt-5">
        {loading ? (
          <div className="flex items-center justify-center w-full ">
            <Spinner className="w-8 h-8" />
          </div>
        ) : (
          surahlist &&
          surahlist.length != 0 &&
          surahlist.map((surah) => (
            <SurahItem
              key={surah.id}
              id={surah.id}
              arabicName={surah.name_simple}
              englishName={surah.translated_name.name}
            />
          ))
        )}

        {error && surahlist.length == 0 && (
          <div className="flex flex-column items-center mt-5">
            <p>Could not load the surahs. Please try again.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SurahList;
