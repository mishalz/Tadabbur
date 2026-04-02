import axios from "axios";
import Fuse from "fuse.js";

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

// const fetchDataFromAPI = (url) => {
//   let config = {
//     method: "get",
//     maxBodyLength: Infinity,
//     url: url,
//     headers: {
//       Accept: "application/json",
//     },
//   }; //configurations to send the request

//   return axios(config)
//     .then((response) => {
//       return { success: true, status: 200, ...response.data }; //returning the response received from the API
//     })
//     .catch((error) => {
//       return {
//         success: false,
//         status: error.status,
//         message: error.response.data.error
//           ? error.response.data.error
//           : error.message,
//       };
//     });
// };

const getQuranData = async (func, addQueryString, cacheKey = "", ttl = 0) => {
  try {
    let data;
    if (!cacheKey == "") data = Cache.checkCache(cacheKey); //first check cache if cache key is given

    const queryString = getURLQueryString(parametersConfig); //to get the parameters in the string form to be attached to the URL

    if (!data) {
      const chapters = await client.chapters.findAll(); //send request if the data is not found in the cache
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

const filterForSearch = (searchQuery, surahList) => {
  try {
    const fuseOptions = {
      keys: ["name_simple", "name_complex", "translated_name.name"], //the keys to search in
      threshold: 0.6, //a value between 0 and 1, the higher the threshold the less it performs exact matching
    };

    // console.log(surahList);
    // const list = JSON.parse(surahList); //get a JS object

    //perform the search
    const fuse = new Fuse(surahList.chapters, fuseOptions);
    const searchResults = fuse.search(searchQuery);

    return { success: true, status: 200, results: searchResults };
  } catch (error) {
    console.log(error);
    const response = {
      success: false,
      status: 500,
      message: "Could not get the search results.", //error response for search
    };
    return response;
  }
};

export default {
  getQuranData,
  getURLQueryString,
  filterForSearch,
};
