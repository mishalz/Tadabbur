const axios = require("axios");

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

//helper function to create a query string from an object of parameters and their values.
const getURLQueryString = (options) => {
  let string = "";
  for (const key in options) {
    string += `${key}=${options[key]}&`;
  }
  return string;
};
const getSurahInfo = (surah_id) => {};
const getAllVerses = (surah_id) => {};
const filterForSearch = () => {};

module.exports = { fetchDataFromAPI, filterForSearch, getURLQueryString };
