import React from "react";
import VerseOfTheDay from "../components/VerseOfTheDay";
import Bookmarked from "../components/Bookmarked";
import SurahList from "../components/SurahList";
import "../styling/Home.css";

const Homepage = () => {
  return (
    <div id="homepage">
      {/* <VerseOfTheDay /> */}
      <Bookmarked />
      <SurahList />
    </div>
  );
};

export default Homepage;
