const quranService = require("./quran.service");
const Cache = require("../../utils/Cache");
const { allSurahs, versesBySurah, randomVerse } = require("./quran.api");

const parametersConfig = {
  translations: 131,
  fields: "text_indopak",
};

const getAllSurahs = async (_, res) => {
  try {
    //first check cache for the surah list
    let surahList = Cache.checkCache("surahList");

    //send request if the list is not found in the cache
    if (!surahList) {
      surahList = await quranService.fetchDataFromAPI(allSurahs);
    }

    //update cache with the retrieved data
    Cache.updateCache("surahList", surahList);

    //return the results
    res.status(200).send(surahList);
  } catch (error) {
    //standard error response for any internal server error
    const response = {
      success: false,
      message:
        "Could not retrieve the list of surahs. Check your internet and try again.",
    };
    res.status(500).send(response);
  }
};

//to get all verses of a surah
const getSurahData = async (req, res) => {
  try {
    //retrieve the surah id from the URL params
    const surahId = req.params.id;
    const page = req.query.page;

    //to get the parameters in the string form to be attached to the URL
    const queryString = quranService.getURLQueryString(parametersConfig);

    const cacheKey = `surah${surahId}-page${page}`;

    //check cache
    let surahData = Cache.checkCache(cacheKey);

    //send request if the list is not found in the cache
    if (!surahData) {
      surahData = await quranService.fetchDataFromAPI(
        `${versesBySurah}${surahId}?${queryString}page=${page}`
      );
    }

    //update cache with the retrieved data
    Cache.updateCache(cacheKey, surahData);

    //return the results
    res.status(200).send(surahData);
  } catch (error) {
    //standard error response for any internal server error
    const response = {
      success: false,
      message:
        "Could not retrieve the list of surahs. Check your internet and try again.",
    };
    res.status(500).send(response);
  }
};

//to retrieve a random verse from the quran
const getRandomVerse = async (_, res) => {
  try {
    //to get the parameters in the string form to be attached to the URL
    const queryString = quranService.getURLQueryString(parametersConfig);

    //fetching the random verse from the API with necessary query parameters
    const verse = await quranService.fetchDataFromAPI(
      `${randomVerse}?${queryString}`
    );

    //return the results
    res.status(200).send(verse);
  } catch (error) {
    //standard error response for any internal server error
    const response = {
      success: false,
      message:
        "Could not retrieve the list of surahs. Check your internet and try again.",
    };
    res.status(500).send(response);
  }
};
const getVerseData = (req, res) => {};

module.exports = { getAllSurahs, getSurahData, getRandomVerse, getVerseData };
