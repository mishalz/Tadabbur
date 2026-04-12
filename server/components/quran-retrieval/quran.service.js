import axios from "axios";
import Fuse from "fuse.js";
import "dotenv/config";

import { getQfConfig } from "../../qfConfig.js";

let cachedToken = null;
let expiresAt = 0;
let inflightTokenPromise = null;

async function fetchToken() {
  const { env, authBaseUrl, clientId, clientSecret } = getQfConfig();
  console.log(`Fetching new token for ${env} environment`);
  console.log("Client ID:", clientId ? "****" : "Not set");
  console.log("Client Secret:", clientSecret ? "****" : "Not set");

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );

  const response = await fetch(`${authBaseUrl}/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "content",
    }),
  });
  console.log("Token response status:", response);
  if (!response.ok) {
    throw new Error(`Token request failed: ${response.status}`);
  }

  const token = await response.json();
  cachedToken = token.access_token;
  expiresAt = Date.now() + token.expires_in * 1000;
  return cachedToken;
}

export async function getAccessToken() {
  if (cachedToken && Date.now() < expiresAt - 30_000) {
    return cachedToken;
  }

  if (!inflightTokenPromise) {
    inflightTokenPromise = fetchToken().finally(() => {
      inflightTokenPromise = null;
    });
  }

  return inflightTokenPromise;
}

function clearToken() {
  cachedToken = null;
  expiresAt = 0;
}

export async function getJsonData(path, params = {}) {
  const { apiBaseUrl, clientId } = getQfConfig();
  let token = await getAccessToken();
  console.log(clientId);
  let response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      "x-auth-token": token,
      "x-client-id": clientId,
    },
    params,
  });

  if (response.status === 401) {
    clearToken();
    token = await getAccessToken();
    response = await fetch(`${apiBaseUrl}${path}`, {
      headers: {
        "x-auth-token": token,
        "x-client-id": process.env.QF_CLIENT_ID,
      },
    });
  }

  if (!response.ok) {
    throw new Error(`Content API request failed: ${response.status}`);
  }

  return response.json();
}
export const getVerseData = async (verseKey) => {};

// const filterForSearch = (searchQuery, surahList) => {
//   try {
//     const fuseOptions = {
//       keys: ["name_simple", "name_complex", "translated_name.name"], //the keys to search in
//       threshold: 0.6, //a value between 0 and 1, the higher the threshold the less it performs exact matching
//     };

//     // console.log(surahList);
//     // const list = JSON.parse(surahList); //get a JS object

//     //perform the search
//     const fuse = new Fuse(surahList.chapters, fuseOptions);
//     const searchResults = fuse.search(searchQuery);

//     return { success: true, status: 200, results: searchResults };
//   } catch (error) {
//     console.log(error);
//     const response = {
//       success: false,
//       status: 500,
//       message: "Could not get the search results.", //error response for search
//     };
//     return response;
//   }
// };
