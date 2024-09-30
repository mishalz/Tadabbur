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

  return axios(config)
    .then((response) => {
      return { success: true, ...response.data }; //returning the response received from the API
    })
    .catch((error) => {
      return {
        success: false,
        status: error.status,
        message: error.response.data.error
          ? error.response.data.error
          : error.message,
      };
    });
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

    if (!cacheKey == "" && data.success) Cache.updateCache(cacheKey, data, ttl); //update cache with the retrieved data
    if (data.success || data.success == false) {
      return data;
    } //return the results
    else throw new Error(); // if the data is incorrect
  } catch (error) {
    const response = {
      success: false,
      status: 500,
      message:
        "Could not retrieve the data. Check your internet and try again.", //standard error response
    };
    if (error instanceof axios.AxiosError) {
      response.status = error.response.data.status;
      response.message = error.response.data.error;
    }

    return response;
  }
};

const getVerseData = async (verseKey) => {
  const url = `${verseByKey}${verseKey}`; //url to get verse data
  const cacheKey = `verse${verseKey}`; //cache key to first search in the cache
  let verseData = await getQuranData(url, true, cacheKey); //getting the verse data
  if (verseData.success) {
    verseData = {
      success: true,
      data: {
        key: verseData.verse.verse_key,
        text_indopak: verseData.verse.text_indopak,
        translation: verseData.verse.translations[0].text,
      },
    };
  }
  return verseData; //return the results
};

const filterForSearch = (searchQuery, surahList) => {
  try {
    const fuseOptions = {
      keys: ["name_simple", "name_complex", "translated_name.name"], //the keys to search in
      threshold: 0.6, //a value between 0 and 1, the higher the threshold the less it performs exact matching
    };
    const list = JSON.parse(surahList);
    const fuse = new Fuse(list.chapters, fuseOptions);
    return { success: true, results: fuse.search(searchQuery) };
  } catch (error) {
    const response = {
      success: false,
      status: 500,
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
