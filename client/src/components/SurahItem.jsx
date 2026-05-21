import React from "react";
// import "../styling/SurahItem.css";
import { useNavigate } from "react-router-dom";

function SurahItem({ id, arabicName, englishName }) {
  const navigate = useNavigate();
  const openSurah = () => {
    navigate("/studyspace", {
      state: { surahId: id, arabicName, englishName },
    });
  };
  return (
    <div
      className="group bg-foreground-bg border border-foreground-border/10 px-6 py-3 rounded-full flex items-center gap-4 cursor-pointer text-foreground-muted hover:text-foreground hover:bg-primary/20 transition-colors duration-200 ease-in-out w-3/4 lg:w-1/5 max-w-1/3 lg:max-w-1/4"
      onClick={openSurah}
    >
      <div className="surah-number">{id}</div>
      <div className="">
        <div className="text-foreground-bg-muted group-hover:text-foreground  transition-colors duration-200">
          {arabicName}
        </div>
        <div className="text-xs">{englishName}</div>
      </div>
    </div>
  );
}

export default SurahItem;
