const axios = require("axios");
const Cache = require("../../utils/Cache");

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
  //configurations to send the request
  let config = {
    method: "get",
    maxBodyLength: Infinity,
    url: url,
    headers: {
      Accept: "application/json",
    },
  };

  //returning the response received from the API
  return axios(config).then((response) => {
    return JSON.stringify({ success: true, ...response.data });
  });
};

const getDataFromCacheOrAPI = async (
  url,
  addQueryString,
  cacheKey = "",
  ttl = 0
) => {
  try {
    let data;
    //check cache
    if (!cacheKey == "") data = Cache.checkCache(cacheKey);

    //to get the parameters in the string form to be attached to the URL
    const queryString = getURLQueryString(parametersConfig);

    //send request if the data is not found in the cache
    if (!data) {
      data = await fetchDataFromAPI(
        `${url}?${addQueryString ? queryString : null}`
      );
    }

    //update cache with the retrieved data
    if (!cacheKey == "") Cache.updateCache(cacheKey, data, ttl);

    //return the results
    return data;
  } catch (error) {
    //standard error response
    const response = {
      success: false,
      message:
        "Could not retrieve the data. Check your internet and try again.",
    };
    return response;
  }
};

const getVerseData = async (verseKey) => {
  //url to get verse data
  const url = `${verseByKey}${verseKey}`;
  //cache key to first search in the cache
  const cacheKey = `verse${verseKey}`;

  //getting the verse data
  const verseData = await getDataFromCacheOrAPI(url, true, cacheKey);

  //return the results
  return verseData;
};

const filterForSearch = () => {};

module.exports = {
  getDataFromCacheOrAPI,
  filterForSearch,
  getURLQueryString,
  getVerseData,
  parametersConfig,
};
