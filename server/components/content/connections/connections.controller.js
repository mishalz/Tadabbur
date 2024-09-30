const connectionsService = require("./connections.service");

//function to add a new function
const createConnection = async (req, res) => {
  try {
    //retrieve the authenticated user
    const user = req.user;
    const userId = user.id;

    //validate the user input
    const validatedInput = connectionsService.validateInput(req.body);
    if (!validatedInput.success)
      return res.status(validatedInput.status).send(validatedInput);

    //extracting the required data from the validated output
    const {
      data: { fromVerse, toVerse, note },
    } = validatedInput;

    //first validate the verse keys to see the verses exist
    const verses = await connectionsService.validateAndGetVersePair(
      fromVerse,
      toVerse
    );
    if (!verses.success) return res.status(verses.status).send(verses); //if the validity function returns an error response object

    //check if a connection already exists between the two verses
    const exists = await connectionsService.checkConnectionExists(
      fromVerse,
      toVerse,
      userId
    );
    if (exists) {
      //if connection exists, send back an error response object
      return res.status(400).send({
        success: false,
        status: 400,
        message: "Connection between the two verses already exist.",
      });
    }

    //if keys are valid and the connection does not exist
    const data = await connectionsService.saveConnection(
      //save the connection
      userId,
      verses.fromVerse,
      verses.toVerse,
      note
    );

    if (data.success)
      //if the connection creation process has success
      return res
        .status(201)
        .send({ success: true, message: "Connection added successfully" });
  } catch (err) {
    //incase of an error
    return res.status(500).send({
      success: false,
      status: 500,
      message: "Could not add connection.",
    });
  }
};

//function to retrieve all user connections
const getAllUserConnections = async (req, res) => {
  //getting the user details,
  const user = req.user;
  const userId = user.id;
  try {
    //retrieving all connections through the user id
    const result = await connectionsService.getAllConnections(userId);

    res.send(result);
  } catch (error) {
    //incase of an error
    return res.status(500).send({
      success: false,
      status: 500,
      message: "Could not retrieve all connections.",
    });
  }
};

//function to retrieve all connections of a verse
const getVerseConnections = async (req, res) => {
  //getting the user details and verse key from the URL parameters
  const verseKey = req.params.verse_key;
  const user = req.user;
  const userId = user.id;

  try {
    //retrieving all connections through the user id
    const result = await connectionsService.getVerseConnections(
      userId,
      verseKey
    );

    res.send(result);
  } catch (error) {
    //incase of an error
    return res.status(500).send({
      success: false,
      status: 500,
      message: "Could not retrieve all connections.",
    });
  }
};

module.exports = {
  createConnection,
  getAllUserConnections,
  getVerseConnections,
};
