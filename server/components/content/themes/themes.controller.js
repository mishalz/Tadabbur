const themeService = require("./themes.service");

//function to send back all themes in response to a get request
const getAllThemes = async (req, res) => {
  //extracting the user id from the req
  const userId = req.user.id;

  //call service function to get all themes
  const themes = await themeService.getThemes(userId);

  //return the response with the correct status code
  return res.status(themes.status).send(themes);
};

const deleteThemes = async (req, res) => {
  //extracting the theme ids
  const themeIds = req.body.theme_ids;
  //extracting the user id from the req
  const userId = req.user.id;

  //if any of the req parameter or expected body value is missing
  if (!themeIds)
    return res
      .status(400)
      .send({ success: false, status: 400, message: "Invalid request" });

  //send a request to delete the selected themes
  const deletedThemes = await themeService.deleteThemes(userId, themeIds);
  //return the response with the correct status code
  return res.status(deletedThemes.status).send(deletedThemes);
};

//function to create a theme in response to a post request
const createTheme = async (req, res) => {
  //extracting the user id from the req
  const userId = req.user.id;

  //send the data to be validated and saved
  const savedTheme = await themeService.saveTheme(userId, req.body);

  //return the response with the correct status code
  return res.status(savedTheme.status).send(savedTheme);
};

//to perform batch removal in response to a delete request where the ids of the verses to be removed are attached to the request body
const removeVersesFromTheme = async (req, res) => {
  //extracting the theme id, the verse id  from the request
  const themeId = req.params.theme_id;
  const verseKeys = req.body.verse_keys;

  //if any of the req parameter or expected body value is missing
  if (!themeId || !verseKeys)
    return res
      .status(400)
      .send({ success: false, status: 400, message: "Invalid request" });

  //send a request to remove the specific verses
  const removedVerses = await themeService.removeVersesFromTheme(
    themeId,
    verseKeys
  );
  //return the response with the correct status code
  return res.status(removedVerses.status).send(removedVerses);
};

//function to add a verse to a theme in response to a post request
const addVerseToTheme = async (req, res) => {
  //extracting the theme id, the verse id from the request
  const themeId = req.params.theme_id;
  const verseKey = req.body.verse_key;
  const userId = req.user.id;

  //if any of the req parameter or expected body value is missing
  if (!themeId || !verseKey)
    return res
      .status(400)
      .send({ success: false, status: 400, message: "Invalid request" });

  //send the data to be saved with teh theme
  const savedVerse = await themeService.addVerseToTheme(
    userId,
    themeId,
    verseKey
  );
  //return the response with the correct status code
  return res.status(savedVerse.status).send(savedVerse);
};

const getAllVersesForTheme = async (req, res) => {
  //extracting the theme id from the request
  const themeId = req.params.theme_id;

  //retrieving the verses based on the theme Id
  const verses = await themeService.getAllVerses(themeId);

  //return the response with the correct status code
  return res.status(verses.status).send(verses);
};

const getAllThemesOfVerse = async (req, res) => {
  //retrieve the verse key
  const verseKey = req.params.verse_key;
  //retrieving the user id
  const userId = req.user.id;
  //if any of the req parameter or expected body value is missing
  if (!verseKey)
    return res
      .status(400)
      .send({ success: false, status: 400, message: "Invalid request" });

  //send the verse key to fetch all themes that the verse is added to
  const themes = await themeService.getVerseThemes(userId, verseKey);
  //return the response with the correct status code
  return res.status(themes.status).send(themes);
};

module.exports = {
  getAllThemes,
  deleteThemes,
  createTheme,
  removeVersesFromTheme,
  addVerseToTheme,
  getAllVersesForTheme,
  getAllThemesOfVerse,
};
