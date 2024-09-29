const quranService = require("./quran.service");
const Cache = require("../../utils/Cache");
const { allSurahs, versesBySurah, randomVerse } = require("./quran.api");

const getAllSurahs = async (_, res) => {
  const cacheKey = "surahList";

  const surahList = await quranService.getDataFromCacheOrAPI(
    allSurahs,
    false,
    cacheKey
  );

  //sending an error response if success is false
  if (surahList.success == false) {
    res.status(500).send(surahList);
  } else res.status(200).send(surahList); //otherwise returning the result with a success
};

//to get all verses of a surah
const getSurahData = async (req, res) => {
  //retrieve the surah id from the URL params
  const surahId = req.params.id;
  const page = req.query.page;

  //to get the parameters in the string form to be attached to the URL
  const queryString = quranService.getURLQueryString(
    quranService.parametersConfig
  );

  //the url to get verses for a surah with pagination
  const url = `${versesBySurah}${surahId}?${queryString}page=${page}`;

  //cache key to first search in the cache
  const cacheKey = `surah${surahId}-page${page}`;

  //fetching the verses from the cache or API
  const surahData = await quranService.getDataFromCacheOrAPI(
    url,
    false,
    cacheKey
  );

  //sending an error response if success is false
  if (surahData.success == false) {
    res.status(500).send(surahData);
  } else res.status(200).send(surahData); //otherwise returning the result with a success
};

//to retrieve a random verse from the quran
const getRandomVerse = async (_, res) => {
  //the url to get random verse from
  const url = `${randomVerse}`;
  //cache key to first search in the cache
  const cacheKey = `randomVerse`;

  //fetching the random verse from the cache or API with necessary query parameters
  const verse = await quranService.getDataFromCacheOrAPI(
    url,
    true,
    cacheKey,
    86400 //so that each random verse is only stored for one day (24 hours).
  );

  //sending an error response if success is false
  if (verse.success == false) {
    res.status(500).send(verse);
  } else res.status(200).send(verse); //otherwise returning the result with a success
};

//to get Data for one verse
const getVerseDataRouteHandler = async (req, res) => {
  //retrieving the verse key from the request params
  const verseKey = req.params.verse_key;

  //getting the verse data
  const verseData = await quranService.getVerseData(verseKey);

  //sending an error response if success is false
  if (verseData.success == false) {
    res.status(500).send(verseData);
  } else res.status(200).send(verseData); //otherwise returning the result with a success
};

module.exports = {
  getAllSurahs,
  getSurahData,
  getRandomVerse,
  getVerseDataRouteHandler,
};
