import Cache from "../../utils/Cache.js";
import {
  clearToken,
  getAccessToken,
  getJsonData,
} from "../quran-retrieval/quran.service.js";

export const getAllSurahs = async (req, res) => {
  try {
    //cache key to first search in the cache
    const cacheKey = "surahList";

    //check cache for the surah list first
    const data = Cache.checkCache(cacheKey);
    if (data) {
      return res.status(200).send(data); //if the data is found in the cache, return it with a success response
    }
    clearToken();
    const token = await getAccessToken(); //get the access token for the Quran Foundation API

    const surahList = await getJsonData("/content/api/v4/chapters"); //get the surah list from the Quran Foundation API
    Cache.updateCache(cacheKey, surahList); //update the cache with the retrieved surah list

    // //method for fuzzy search
    // const query = req.query ? (req.query.search ? req.query.search : null) : null;

    // if (query) chapters = quranService.filterForSearch(query, surahList);

    //sending an error response if success is false
    if (!surahList) {
      throw new Error();
    } else res.status(200).send(surahList); //otherwise returning the result with a success
  } catch (err) {
    console.log(err);
    res.status(500).send({
      message: "An error occurred while retrieving the surah list.",
    });
  }
};

//to get all verses of a surah
export const getSurahData = async (req, res) => {
  try {
    const surahId = req.params.id; //retrieve the surah id from the URL params
    const page = req.query.page; //for pagination
    const script = req.query.script; //for to include the arabic text
    const translation_id = req.query.translation_id; //to include the translation of the verse in the response

    const url = `/content/api/v4/verses/by_chapter/${surahId}?page=${page}&fields=${script}&translations=${translation_id}`; //the url to get verses for a surah with pagination

    const cacheKey = `surah${surahId}-page${page}`; //cache key to first search in the cache
    //check cache for the surah list first
    const data = Cache.checkCache(cacheKey);
    if (data) {
      return res.status(200).send(data); //if the data is found in the cache, return it with a success response
    }
    let surahData = await getJsonData(url); //retrieving the verses
    Cache.updateCache(cacheKey, surahData); //update the cache with the retrieved surah list

    if ((surahData && !surahData.verses) || !surahData) {
      throw new Error();
    } else res.status(200).send(surahData); //otherwise returning the result with a success
  } catch (err) {
    res.status(500).send({
      message: "An error occurred while retrieving the verses.",
    });
  }
};

//to retrieve a random verse from the quran
export const getRandomVerse = async (_, res) => {
  const url = `${randomVerse}`; //the url to get random verse from
  const cacheKey = `randomVerse`; //cache key to first search in the cache

  const verse = await quranService.getQuranData(
    url,
    true,
    cacheKey,
    86400, //so that each random verse is only stored for one day (24 hours).
  ); //fetching the random verse from the cache or API with necessary query parameters

  if (verse.success == false) {
    res.status(verse.status ? verse.status : 500).send(verse); //sending an error response if success is false
  } else res.status(200).send(verse); //otherwise returning the result with a success
};

//to get Data for one verse
export const getVerseDataRouteHandler = async (req, res) => {
  const verseKey = req.params.verse_key; //retrieving the verse key from the request params

  const verseData = await quranService.getVerseData(verseKey); //getting the verse data

  if (verseData.success == false) {
    res.status(verseData.status ? verseData.status : 500).send(verseData); //sending an error response if success is false
  } else {
    res.status(200).send(verseData);
  } //otherwise returning the result with a success
};
