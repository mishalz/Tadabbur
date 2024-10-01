const bookmarkService = require("./bookmarks.service");

const bookmarkVerse = async (req, res) => {
  //retrieve the verse key and the user id
  const userId = req.user.id;
  const verseKey = req.body.verse_key;

  //if the verse key is not given in the body
  if (!verseKey)
    return res
      .status(400)
      .send({ success: false, status: 400, message: "Invalid request" });

  //save the bookmark
  const saved = await bookmarkService.addBookmark(userId, verseKey);
  //return the response with the correct status code
  return res.status(saved.status || 500).send(saved);
};
const getAllBookmarks = async (req, res) => {
  //retrieve the verse key and the user id
  const userId = req.user.id;
  //get all bookmark
  const bookmarks = await bookmarkService.getBookmarks(userId);
  //return the response with the correct status code
  return res.status(bookmarks.status || 500).send(bookmarks);
};

module.exports = { bookmarkVerse, getAllBookmarks };
