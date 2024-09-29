const axios = require("axios");
const Cache = require("../../utils/Cache");
const Fuse = require("fuse.js");
//API endpoint mappings
const { verseByKey } = require("./quran.api");

const parametersConfig = {
  translations: 131,
  fields: "text_indopak",
};

//helper function to create a query string from an object of parameters and their values.
const getURLQueryString = (options) => {
  let string = "";
  for (const key in options) {
    string += `${key}=${options[key]}&`;
  }
  return string;
};

const fetchDataFromAPI = (url) => {
  let config = {
    method: "get",
    maxBodyLength: Infinity,
    url: url,
    headers: {
      Accept: "application/json",
    },
  }; //configurations to send the request

  return axios(config).then((response) => {
    return JSON.stringify({ success: true, ...response.data });
  }); //returning the response received from the API
};

const getQuranData = async (url, addQueryString, cacheKey = "", ttl = 0) => {
  try {
    let data;
    if (!cacheKey == "") data = Cache.checkCache(cacheKey); //first check cache if cache key is given

    const queryString = getURLQueryString(parametersConfig); //to get the parameters in the string form to be attached to the URL

    if (!data) {
      data = await fetchDataFromAPI(
        `${url}?${addQueryString ? queryString : null}`
      ); //send request if the data is not found in the cache
    }

    if (!cacheKey == "") Cache.updateCache(cacheKey, data, ttl); //update cache with the retrieved data

    return data; //return the results
  } catch (error) {
    const response = {
      success: false,
      message:
        "Could not retrieve the data. Check your internet and try again.", //standard error response
    };
    return response;
  }
};

const getVerseData = async (verseKey) => {
  const url = `${verseByKey}${verseKey}`; //url to get verse data

  const cacheKey = `verse${verseKey}`; //cache key to first search in the cache

  const verseData = await getQuranData(url, true, cacheKey); //getting the verse data

  return verseData; //return the results
};

const filterForSearch = (searchQuery, surahList) => {
  try {
    const fuseOptions = {
      keys: ["name_simple", "name_complex", "translated_name.name"],
      threshold: 0.6,
    };
    const list = JSON.parse(surahList);
    const fuse = new Fuse(list.chapters, fuseOptions);
    return { success: true, results: fuse.search(searchQuery) };
  } catch (error) {
    const response = {
      success: false,
      message: "Could not get the search results.", //error response for search
    };
    return response;
  }
};

module.exports = {
  getQuranData,
  filterForSearch,
  getURLQueryString,
  getVerseData,
  parametersConfig,
};
