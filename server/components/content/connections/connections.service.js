const Joi = require("joi");
const getDriver = require("./connections.db");
const quranService = require("../../quran-retrieval/quran.service");
const Cache = require("../../../utils/Cache");

const driver = getDriver();

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

const validateInput = (data) => {
  const { error, value } = connectionSchema.validate(data); //if the schema is valid, the error will be undefined, otherwise the error will have the Joi ValidationError object.
  if (error)
    return { success: false, status: 422, message: error.details[0].message };
  //send back an appropriate error object so it could be dealt in the parent function
  else if (value) return { success: true, data: value }; //if there is no error, return the validated data
};

//to validate that the verses exist and get data required for creating a connection
const validateAndGetVersePair = async (fromVerse, toVerse) => {
  const fromVerseData = await quranService.getVerseData(fromVerse);
  const toVerseData = await quranService.getVerseData(toVerse);

  //if both the verses exist
  if (fromVerseData.success && toVerseData.success) {
    return {
      success: true,
      fromVerse: fromVerseData.data,
      toVerse: toVerseData.data,
    };
  } else {
    //if one or both verses do not exist
    return {
      success: false,
      status: 404,
      message: "One or both verses could not be found.",
    };
  }
};

const checkConnectionExists = async (fromVerseKey, toVerseKey, userId) => {
  let session = driver.session({ database: "tadabbur" });
  try {
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
        WHERE v1.key = $fromVerseKey AND r.userId = $userId AND v2.key = $toVerseKey
        RETURN r`,
        { fromVerseKey, toVerseKey, userId }
      );
    });

    //if data is found
    if (result.records[0]) {
      Cache.updateCache(cacheKey, true);
      return true;
    } else return false;
  } catch (err) {
    throw err;
  } finally {
    await session.close();
  }
};

//save the connection to the database
const saveConnection = async (userId, fromVerse, toVerse, note = "") => {
  let session = driver.session({ database: "tadabbur" });
  try {
    //writing to the database
    const result = await session.executeWrite((tx) => {
      return tx.run(
        `MERGE (v1:Verse {key: $fromVerse.key,arabicText:$fromVerse.text_indopak,translation:$fromVerse.translation})
         MERGE (v2:Verse {key: $toVerse.key, arabicText:$toVerse.text_indopak,translation:$toVerse.translation})
         MERGE (v1)-[r:CONNECTED {note: $note, userId: $userId}]-(v2)
         RETURN v1.key,r.note,v2.key`,
        { fromVerse, toVerse, note, userId }
      );
    });

    //since a new connection has been created, the old cache needs to be deleted.
    Cache.deleteCache(`connections-${userId}`);
    //add this new connection to the cache
    Cache.updateCache(`${fromVerse}connected${toVerse}`, true);
    return { success: true, message: "Connection added." }; //send back a success response
  } catch (err) {
    throw err;
  } finally {
    await session.close();
  }
};

//function to retrieve all connections either from the cache or from the database
const getAllConnections = async (userId) => {
  let session = driver.session({ database: "tadabbur" });
  try {
    //first check cache if the connection is stored there
    let cacheKey = `connections-${userId}`;
    let result = Cache.checkCache(cacheKey);

    if (result) return result; //connections found in the cache

    //otherwise send request to the database
    const allConnections = await session.executeRead((tx) => {
      return tx.run(
        `MATCH (v1:Verse)-[r:CONNECTED]->(v2:Verse) 
        WHERE r.userId = $userId
        RETURN DISTINCT v1,r.note,v2`,
        { userId }
      );
    });

    //to get a formatted and cleaner form of the connections
    result = getFormattedConnections(allConnections);

    //if the database returns a connections array of 0 length
    if (result.length == 0) {
      return { success: true, message: "There are no connections to display." };
    } else {
      //if connections are retrieved successfully and is not empty
      Cache.updateCache(cacheKey, result);
      return { success: true, connections: result };
    }
  } catch (err) {
    throw err;
  } finally {
    await session.close();
  }
};

//get all connections for one specific verse
const getVerseConnections = async (userId, verseKey) => {
  let session = driver.session({ database: "tadabbur" });
  try {
    //check if the passed verse key is valid
    const verse = await await quranService.getVerseData(verseKey);
    if (!verse.success)
      return {
        success: false,
        status: 400,
        message: "The verse does not exist.",
      };

    //first check cache if the connections are stored there
    let cacheKey = `connections-${userId}-${verseKey}`;
    let result = Cache.checkCache(cacheKey);

    if (result) return result; //connections found in the cache

    //otherwise send request to the database
    const verseConnections = await session.executeRead((tx) => {
      return tx.run(
        `MATCH (v1:Verse)-[r:CONNECTED]->(v2:Verse) 
        WHERE r.userId = $userId AND v1.key = $verseKey OR v2.key = $verseKey
        RETURN DISTINCT v1,r.note,v2`,
        { userId, verseKey }
      );
    });

    //format the connections recieved from the database
    result = {
      success: true,
      connections: getFormattedConnections(verseConnections),
    };

    if (result.length == 0) {
      //if there are no connections
      return {
        success: true,
        message: "There are no connections for this verse",
      };
    } else {
      Cache.updateCache(cacheKey, result); //update the cache with the newly retrieved data
      return result;
    }
  } catch (err) {
    console.log(err);
    throw err;
  } finally {
    await session.close();
  }
};

//helper function to format the connections array recieved from the database to only contain required fields
const getFormattedConnections = (connections) => {
  const formattedConnections = connections.records.map(({ _fields }) => {
    return {
      fromVerse: {
        key: _fields[0].properties.key,
        text_indopak: _fields[0].properties.arabicText,
        translation: _fields[0].properties.translation,
      },
      note: _fields[1],
      toVerse: {
        key: _fields[2].properties.key,
        text_indopak: _fields[2].properties.arabicText,
        translation: _fields[2].properties.translation,
      },
    };
  });
  return formattedConnections;
};
module.exports = {
  validateInput,
  validateAndGetVersePair,
  checkConnectionExists,
  saveConnection,
  getAllConnections,
  getVerseConnections,
};
