import React, { useEffect, useState } from "react";
import axios from "axios";
import SurahItem from "./SurahItem";
import { MessageCircleWarning } from "lucide-react";
import { Spinner } from "./ui/spinner";
import { apiUrl } from "@/lib/api";

function SurahList() {
  const [surahlist, setSurahList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  //retrieving the surah list on page load and every time the surah list changes
  useEffect(() => {
    setLoading(true);
    axios
      .get(apiUrl("/api/quran/surahs"))
      .then((res) => {
        if (res.status === 200) {
          setError(null);
          setSurahList(res.data.chapters);
        } else setError(res.data.message);
        setLoading(false);
      })
      .catch((err) => {
        setError(
          err.message ||
            "There was an error loading the Surahs. Please try again later.",
        );
        setLoading(false);
      });
  }, []);

  return (
    <div className="w-full">
      <h1>Surahs</h1>
      <hr />
      {error && surahlist.length === 0 && (
        <div className="flex items-center gap-2 bg-destructive/20  text-destructive h-full rounded mt-5">
          <span>
            <MessageCircleWarning className="w-4 h-4 text-red-400" />
          </span>
          <p className="text-red-400 text-sm">
            Could not load the Surahs. Please try again.
          </p>
        </div>
      )}

      <div className=" mt-5 w-full flex flex-column flex-wrap items-center gap-5 justify-around">
        {loading ? (
          <div className="flex items-center justify-center w-full ">
            <Spinner className="w-8 h-8" />
          </div>
        ) : (
          surahlist &&
          surahlist.length !== 0 &&
          surahlist.map((surah) => (
            <SurahItem
              key={surah.id}
              id={surah.id}
              arabicName={surah.name_simple}
              englishName={surah.translated_name.name}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default SurahList;
