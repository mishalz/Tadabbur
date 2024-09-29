const quranService = require("./quran.service");
const { allSurahs, versesBySurah, randomVerse } = require("./quran.api");

const getAllSurahs = async (_, res) => {
  //cache key to first search in the cache
  const cacheKey = "surahList";

  //retrieving the surah list
  const surahList = await quranService.getQuranData(allSurahs, false, cacheKey);

  //sending an error response if success is false
  if (surahList.success == false) {
    res.status(500).send(surahList);
  } else res.status(200).send(surahList); //otherwise returning the result with a success
};

//to get all verses of a surah
const getSurahData = async (req, res) => {
  const surahId = req.params.id; //retrieve the surah id from the URL params
  const page = req.query.page; //for pagination

  const queryString = quranService.getURLQueryString(
    quranService.parametersConfig
  ); //to get the parameters in the string form to be attached to the URL

  const url = `${versesBySurah}${surahId}?${queryString}page=${page}`; //the url to get verses for a surah with pagination

  const cacheKey = `surah${surahId}-page${page}`; //cache key to first search in the cache

  const surahData = await quranService.getQuranData(url, false, cacheKey); //retrieving the verses

  if (surahData.success == false) {
    res.status(500).send(surahData); //sending an error response if success is false
  } else res.status(200).send(surahData); //otherwise returning the result with a success
};

//to retrieve a random verse from the quran
const getRandomVerse = async (_, res) => {
  const url = `${randomVerse}`; //the url to get random verse from
  const cacheKey = `randomVerse`; //cache key to first search in the cache

  const verse = await quranService.getQuranData(
    url,
    true,
    cacheKey,
    86400 //so that each random verse is only stored for one day (24 hours).
  ); //fetching the random verse from the cache or API with necessary query parameters

  if (verse.success == false) {
    res.status(500).send(verse); //sending an error response if success is false
  } else res.status(200).send(verse); //otherwise returning the result with a success
};

//to get Data for one verse
const getVerseDataRouteHandler = async (req, res) => {
  const verseKey = req.params.verse_key; //retrieving the verse key from the request params

  const verseData = await quranService.getVerseData(verseKey); //getting the verse data

  if (verseData.success == false) {
    res.status(500).send(verseData); //sending an error response if success is false
  } else res.status(200).send(verseData); //otherwise returning the result with a success
};

module.exports = {
  getAllSurahs,
  getSurahData,
  getRandomVerse,
  getVerseDataRouteHandler,
};
