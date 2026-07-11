import { get } from "mongoose";
import Cache from "../../../utils/Cache.js";
import {
  validateInput,
  validateAndGetVersePair,
  checkConnectionExists,
  saveConnection,
  getVerseConnections,
  deleteConnectionService,
} from "./connections.service.js";

//function to add a new function
const createConnection = async (req, res) => {
  try {
    //retrieve the authenticated user
    const userSub = req.user.sub;

    //validate the user input
    const validatedInput = validateInput(req.body);
    if (!validatedInput.success)
      return res.status(validatedInput.status).send(validatedInput);

    //extracting the required data from the validated output
    const {
      data: { fromVerse, toVerse, note },
    } = validatedInput;

    //first validate the verse keys to see the verses exist
    const verses = await validateAndGetVersePair(fromVerse, toVerse);
    if (!verses.success)
      return res
        .status(verses.status)
        .send({ success: false, message: verses.message }); //if the validity function returns an error response object

    //check if a connection already exists between the two verses
    const exists = await checkConnectionExists(fromVerse, toVerse, userSub);
    if (exists) {
      //if connection exists, send back an error response object
      return res.status(400).send({
        success: false,
        message: "connection exists",
      });
    }

    //if keys are valid and the connection does not exist
    const data = await saveConnection(
      //save the connection
      userSub,
      verses.fromVerse,
      verses.toVerse,
      note,
    );

    //update the cache for the verse connections of the from and to verses, so that the new connection will be reflected when the user tries to retrieve the connections for either verse
    Cache.deleteCache(`connections-${userSub}-${fromVerse}`);
    Cache.deleteCache(`connections-${userSub}-${toVerse}`);

    if (data.success)
      //if the connection creation process has success
      return res
        .status(201)
        .send({ success: true, message: "Connection added successfully" });
  } catch (err) {
    //incase of an error
    return res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

//function to retrieve all connections of a verse
const getAllVerseConnections = async (req, res) => {
  try {
    //getting the user details and verse key from the URL parameters
    const verseKey = req.params.verse_key;
    const userSub = req.user.sub;

    //retrieving all connections through the user id
    const result = await getVerseConnections(userSub, verseKey);

    if (result.connections) res.status(200).send(result);
  } catch (error) {
    if (error.name === "ResourceNotFoundError") {
      return res.status(404).send({
        success: false,
        message: error.message,
      });
    }
    //incase of an error
    return res.status(error.statusCode || 500).send({
      success: false,
      message: "Could not retrieve all connections.",
    });
  }
};
const getVerseConnectionCount = async (req, res) => {
  try {
    const verseKey = req.params.verse_key;
    const userSub = req.user.sub;

    const result = await getVerseConnections(userSub, verseKey);

    if (result.connections) {
      return res.status(200).send({
        success: true,
        count: result.connections.length,
      });
    }
  } catch (error) {
    if (error.name === "ResourceNotFoundError") {
      return res.status(404).send({
        success: false,
        message: error.message,
      });
    }
    return res.status(error.statusCode || 500).send({
      success: false,
      message: "Could not retrieve connection count.",
    });
  }
};

//delete a connection
const deleteConnection = async (req, res) => {
  try {
    const fromVerseKey = req.params.from_verse_key;
    const toVerseKey = req.params.to_verse_key;
    const userSub = req.user.sub;

    const result = await checkConnectionExists(
      fromVerseKey,
      toVerseKey,
      userSub,
    );
    if (!result) {
      return res.status(404).send({
        success: false,
        message: "Connection does not exist.",
      });
    }

    await deleteConnectionService(fromVerseKey, toVerseKey, userSub);

    //update the cache for the verse connections of the from and to verses, so that the deleted connection will be removed when the user tries to retrieve the connections for either verse
    Cache.deleteCache(`connections-${userSub}-${fromVerseKey}`);
    Cache.deleteCache(`connections-${userSub}-${toVerseKey}`);
    Cache.deleteCache(`${fromVerseKey}connected${toVerseKey}`);
    Cache.deleteCache(`${toVerseKey}connected${fromVerseKey}`);

    return res.status(200).send({
      success: true,
      message: "Connection deleted successfully.",
    });
  } catch (error) {
    if (error.name === "ResourceNotFoundError") {
      return res.status(404).send({
        success: false,
        message: error.message,
      });
    }
    return res.status(error.statusCode || 500).send({
      success: false,
      message: "Could not delete connection.",
    });
  }
};
export default {
  createConnection,
  getAllVerseConnections,
  getVerseConnectionCount,
  deleteConnection,
};
