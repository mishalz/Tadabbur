const quranService = require("./quran.service");
const Cache = require("../../utils/Cache");
const { allSurahs } = require("./quran.api");

const getAllSurahs = async (_, res) => {
  try {
    //first check cache for the surah list
    let surahData = Cache.checkCache("surahList");

    //send request if the list is not found in the cache
    if (!surahData) {
      surahData = await quranService.fetchDataFromAPI(allSurahs);
    }

    //update cache with the retrieved data
    Cache.updateCache("surahList", surahData);

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
const getSurahData = () => {};
const getRandomVerse = () => {};
const getVerseData = () => {};

module.exports = { getAllSurahs, getSurahData, getRandomVerse, getVerseData };
