import React from "react";
import "../styling/SurahItem.css";
import { useNavigate } from "react-router-dom";
import { routes } from "../utils/Routes";

function SurahItem({ id, arabicName, englishName }) {
  const navigate = useNavigate();
  const openSurah = () => {
    navigate(routes.studySpace, {
      state: { surahId: id, arabicName, englishName },
    });
  };
  return (
    <div className="surah-item" onClick={openSurah}>
      <div className="surah-number">{id}</div>
      <div className="surah-names">
        <div className="arabic-name">{arabicName}</div>
        <div className="english-name">{englishName}</div>
      </div>
    </div>
  );
}

export default SurahItem;
