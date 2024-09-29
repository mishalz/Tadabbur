const quranAPI = {
  allSurahs: "https://api.quran.com/api/v4/chapters",
  surahById: "https://api.quran.com/api/v4/chapters/:id",
  versesBySurah:
    "https://api.quran.com/api/v4/verses/by_chapter/:chapter_number",
  verseByKey: "https://api.quran.com/api/v4/verses/by_key/:verse_key",
  randomVerse: "https://api.quran.com/api/v4/verses/random",
};

module.exports = quranAPI;
