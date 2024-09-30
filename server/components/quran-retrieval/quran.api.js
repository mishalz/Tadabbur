//API mappings for the Quran.com 
const quranAPI = {
  allSurahs: "https://api.quran.com/api/v4/chapters",
  surahById: "https://api.quran.com/api/v4/chapters/", //add chapter number
  versesBySurah: "https://api.quran.com/api/v4/verses/by_chapter/", //add chapter number
  verseByKey: "https://api.quran.com/api/v4/verses/by_key/", //add verse key
  randomVerse: "https://api.quran.com/api/v4/verses/random",
};

module.exports = quranAPI;
