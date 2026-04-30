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
      className="bg-foreground-bg border border-foreground-border/10 px-6 py-3 rounded-full flex items-center gap-4 cursor-pointer text-foreground-muted hover:text-foreground hover:bg-primary/20 transition-colors duration-200 ease-in-out w-fit max-w-4/12"
      onClick={openSurah}
    >
      <div className="surah-number">{id}</div>
      <div className="surah-names">
        <div className="arabic-name">{arabicName}</div>
        <div className="english-name">{englishName}</div>
      </div>
    </div>
  );
}

export default SurahItem;
