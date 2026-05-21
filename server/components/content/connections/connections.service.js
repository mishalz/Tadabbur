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

export const checkConnectionExists = async (
  fromVerseKey,
  toVerseKey,
  userSub,
) => {
  const driver = getDriver();
  let session = driver.session();

  //first check cache if the connection is stored there
  let cacheKey = `${fromVerseKey}connected${toVerseKey}`;
  let result = Cache.checkCache(cacheKey);
  if (result) return true; //connection found in the cache

  cacheKey = `${toVerseKey}connected${fromVerseKey}`;
  result = Cache.checkCache(cacheKey);
  if (result) return true; //connection found in the cache with the other key since connections are not directional

  //read the connection from the database
  result = await session.executeRead((tx) => {
    return tx.run(
      `MATCH (v1:Verse)-[r:CONNECTED]-(v2:Verse) 
        WHERE v1.key = $fromVerseKey AND r.userSub = $userSub AND v2.key = $toVerseKey
        RETURN r`,
      { fromVerseKey, toVerseKey, userSub },
    );
  });

  //close the session
  await session.close();

  //if data is found
  if (result.records[0]) {
    Cache.updateCache(cacheKey, true);
    return true;
  } else return false;
};

//save the connection to the database
export const saveConnection = async (
  userSub,
  fromVerse,
  toVerse,
  note = "",
) => {
  const driver = getDriver();
  let session = driver.session();

  //writing to the database
  await session.executeWrite((tx) => {
    return tx.run(
      `MERGE (v1:Verse {key: $fromVerse.key,arabicText:$fromVerse.arabicText,translation:$fromVerse.translation})
         MERGE (v2:Verse {key: $toVerse.key, arabicText:$toVerse.arabicText,translation:$toVerse.translation})
         MERGE (v1)-[r:CONNECTED {note: $note, userSub: $userSub}]-(v2)
         RETURN v1.key,r.note,v2.key`,
      { fromVerse, toVerse, note, userSub },
    );
  });

  await session.close();

  //since a new connection has been created, the old cache needs to be deleted.
  Cache.deleteCache(`connections-${userSub}`);
  //add this new connection to the cache
  Cache.updateCache(`${fromVerse}connected${toVerse}`, true);
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
  const driver = getDriver();
  let session = driver.session();

  //otherwise send request to the database
  const verseConnections = await session.executeRead((tx) => {
    return tx.run(
      `MATCH (v1:Verse)-[r:CONNECTED]->(v2:Verse) 
        WHERE r.userSub = $userSub AND v1.key = $verseKey OR v2.key = $verseKey
        RETURN DISTINCT v1,r.note,v2`,
      { userSub, verseKey },
    );
  });

  await session.close();

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

export const deleteConnectionService = async (fromVerseKey, toVerseKey, userSub) => {
  const driver = getDriver();
  let session = driver.session();

  await session.executeWrite((tx) => {
    return tx.run(
      `MATCH (v1:Verse {key: $fromVerseKey})-[r:CONNECTED {userSub: $userSub}]-(v2:Verse {key: $toVerseKey})
         DELETE r
         RETURN v1.key, v2.key`,
      { fromVerseKey, toVerseKey, userSub }
    );
  });

  await session.close();
};
