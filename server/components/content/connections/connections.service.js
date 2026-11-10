import Joi from "joi";
import { getDriver } from "./connections.db.js";
import { getVerseData } from "../../quran-retrieval/quran.service.js";
import Cache from "../../../utils/Cache.js";
import { ResourceNotFoundError } from "../../../utils/Errors.js";

//schema for a connections object
const connectionSchema = Joi.object({
  fromVerse: Joi.string()
    .pattern(/^\d+:\d+$/)
    .required(),
  toVerse: Joi.string()
    .pattern(/^\d+:\d+$/)
    .required(),
  note: Joi.string(),
});

export const validateInput = (data) => {
  const { error, value } = connectionSchema.validate(data); //if the schema is valid, the error will be undefined, otherwise the error will have the Joi ValidationError object.
  if (error)
    return { success: false, status: 422, message: error.details[0].message };
  //send back an appropriate error object so it could be dealt in the parent function
  else if (value) return { success: true, status: 200, data: value }; //if there is no error, return the validated data
};

//to validate that the verses exist and get data required for creating a connection
export const validateAndGetVersePair = async (fromVerse, toVerse) => {
  const fromVerseData = await getVerseData(fromVerse);
  const toVerseData = await getVerseData(toVerse);

  //if both the verses exist
  if (fromVerseData.success && toVerseData.success) {
    return {
      success: true,
      fromVerse: {
        key: fromVerseData.verse.verse_key,
        arabicText: fromVerseData.verse.text_uthmani,
        translation: fromVerseData.verse.translations[0].text,
      },
      toVerse: {
        key: toVerseData.verse.verse_key,
        arabicText: toVerseData.verse.text_uthmani,
        translation: toVerseData.verse.translations[0].text,
      },
    };
  } else {
    //if one or both verses do not exist
    return {
      success: false,
      status: 404,
      message: "One or both ayah could not be found.",
    };
  }
};

//cache key for "does a connection exist between these two verses for this user".
//Connections are not directional, so the pair is sorted, and the key includes
//the user so one user's connections can never be reported for another.
export const connectionExistsCacheKey = (userSub, verseKeyA, verseKeyB) => {
  const [first, second] = [verseKeyA, verseKeyB].sort();
  return `exists-${userSub}-${first}-${second}`;
};

export const checkConnectionExists = async (
  fromVerseKey,
  toVerseKey,
  userSub,
) => {
  //first check cache if the connection is stored there
  const cacheKey = connectionExistsCacheKey(userSub, fromVerseKey, toVerseKey);
  if (Cache.checkCache(cacheKey)) return true;

  let session;
  try {
    session = getDriver().session();

    //read the connection from the database
    const result = await session.executeRead((tx) => {
      return tx.run(
        `MATCH (v1:Verse)-[r:CONNECTED]-(v2:Verse)
        WHERE v1.key = $fromVerseKey AND r.userSub = $userSub AND v2.key = $toVerseKey
        RETURN r`,
        { fromVerseKey, toVerseKey, userSub },
      );
    });

    //if data is found
    if (result.records[0]) {
      Cache.updateCache(cacheKey, true);
      return true;
    }
    return false;
  } catch (error) {
    throw new Error("Could not validate if the connection exists.");
  } finally {
    //always release the session, including on cache misses that throw
    if (session) await session.close();
  }
};

//save the connection to the database
export const saveConnection = async (
  userSub,
  fromVerse,
  toVerse,
  note = "",
) => {
  const session = getDriver().session();

  try {
    //Verse nodes are identified by key only; text/translation are properties.
    //(Previously they were part of the MERGE pattern, so any change to a
    //translation created duplicate Verse nodes.)
    await session.executeWrite((tx) => {
      return tx.run(
        `MERGE (v1:Verse {key: $fromVerse.key})
           ON CREATE SET v1.arabicText = $fromVerse.arabicText, v1.translation = $fromVerse.translation
         MERGE (v2:Verse {key: $toVerse.key})
           ON CREATE SET v2.arabicText = $toVerse.arabicText, v2.translation = $toVerse.translation
         MERGE (v1)-[r:CONNECTED {userSub: $userSub}]-(v2)
           ON CREATE SET r.note = $note
         RETURN v1.key, r.note, v2.key`,
        { fromVerse, toVerse, note, userSub },
      );
    });
  } finally {
    await session.close();
  }

  //invalidate the cached connection lists for both verses and record that this pair now exists
  Cache.deleteCache(`connections-${userSub}-${fromVerse.key}`);
  Cache.deleteCache(`connections-${userSub}-${toVerse.key}`);
  Cache.updateCache(
    connectionExistsCacheKey(userSub, fromVerse.key, toVerse.key),
    true,
  );
  return { success: true, message: "Connection added." }; //send back a success response
};

//get all connections for one specific verse
export const getVerseConnections = async (userSub, verseKey) => {
  //check if the passed verse key is valid
  await getVerseData(verseKey);

  //first check cache if the connections are stored there
  let cacheKey = `connections-${userSub}-${verseKey}`;
  let result = Cache.checkCache(cacheKey);

  if (result) return { success: true, connections: result }; //connections found in the cache

  //get the driver instance to connect to the database and retrieve the connections for the verse key passed in the parameters
  const session = getDriver().session();

  //otherwise send request to the database.
  //The parentheses matter: without them AND binds tighter than OR, so the
  //"v2.key = $verseKey" branch ignored userSub and returned other users' connections.
  let verseConnections;
  try {
    verseConnections = await session.executeRead((tx) => {
      return tx.run(
        `MATCH (v1:Verse)-[r:CONNECTED]->(v2:Verse)
          WHERE r.userSub = $userSub AND (v1.key = $verseKey OR v2.key = $verseKey)
          RETURN DISTINCT v1,r.note,v2`,
        { userSub, verseKey },
      );
    });
  } finally {
    await session.close();
  }

  //format the connections recieved from the database
  result = getFormattedConnections(verseConnections);

  if (result.length == 0) {
    //if there are no connections
    throw new ResourceNotFoundError(
      "There are no connections to display for this verse.",
    );
  } else {
    Cache.updateCache(cacheKey, result); //update the cache with the newly retrieved data
    return { success: true, connections: result };
  }
};

//helper function to format the connections array recieved from the database to only contain required fields
export const getFormattedConnections = (connections) => {
  const formattedConnections = connections.records.map(({ _fields }) => {
    return {
      fromVerse: {
        key: _fields[0].properties.key,
        text_arabicText: _fields[0].properties.arabicText,
        translation: _fields[0].properties.translation,
      },
      note: _fields[1],
      toVerse: {
        key: _fields[2].properties.key,
        text_arabicText: _fields[2].properties.arabicText,
        translation: _fields[2].properties.translation,
      },
    };
  });
  return formattedConnections;
};

export const deleteConnectionService = async (
  fromVerseKey,
  toVerseKey,
  userSub,
) => {
  const session = getDriver().session();

  try {
    await session.executeWrite((tx) => {
      return tx.run(
        `MATCH (v1:Verse {key: $fromVerseKey})-[r:CONNECTED {userSub: $userSub}]-(v2:Verse {key: $toVerseKey})
         DELETE r
         RETURN v1.key, v2.key`,
        { fromVerseKey, toVerseKey, userSub },
      );
    });
  } finally {
    await session.close();
  }

  Cache.deleteCache(connectionExistsCacheKey(userSub, fromVerseKey, toVerseKey));
};
