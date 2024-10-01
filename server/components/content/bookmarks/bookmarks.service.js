const Bookmark = require("./bookmarks.model");
const Joi = require("joi");
const quranService = require("../../quran-retrieval/quran.service");
const Cache = require("../../../utils/Cache");
const Validation = require("../../../utils/Validation");

const addBookmark = async (userId, verseKey) => {
  try {
    //validate verse key
    const verse = await quranService.getVerseData(verseKey);
    if (!verse.success) return verse; //if the validity function returns an error response object

    //see if the bookmark already exists
    const bookmarkExists = await Bookmark.findOne({ userId, verseKey });

    //if the bookmark does not already exist, create it
    if (!bookmarkExists) {
      const surahNumber = verseKey.split(":")[0];
      //get the surah name of the verse before storage
      const surahInfo = await quranService.getSurahName(surahNumber);
      if (!surahInfo.success)
        return {
          success: false,
          status: 500,
          message: "Could not bookmark verse.",
        };

      //save bookmark
      await Bookmark.create({
        userId,
        verseKey,
        surahName: surahInfo.chapter.name_simple,
      });
    } else {
      //incase the bookmark exists just update it.
      await Bookmark.findByIdAndUpdate(bookmarkExists._id, {});
    }
    //if everything works fine, a success response is sent back.
    const response = { success: true, status: 201, message: "Bookmark Added!" };

    //since a new note has been created, the old cache needs to be deleted.
    Cache.deleteCache(`bookmarks-${userId}`);

    return response;
  } catch (error) {
    return {
      success: false,
      status: 500,
      message: error.message,
    };
  }
};

const getBookmarks = async (userId) => {
  try {
    //first check cache
    const cacheKey = `bookmarks-${userId}`;
    let bookmarks = Cache.checkCache(cacheKey);

    if (bookmarks) return { success: true, status: 200, bookmarks: bookmarks }; //themes found in the cache

    //query the database otherwise
    bookmarks = await Bookmark.find({ userId: userId });

    //if the database returns a themes array of 0 length
    if (bookmarks && bookmarks.length == 0) {
      return {
        success: true,
        status: 404,
        message: "There are no bookmarks.",
      };
    } else {
      //if themes are retrieved successfully and are not empty
      Cache.updateCache(cacheKey, bookmarks);
      return { success: true, status: 200, bookmarks: bookmarks };
    }
  } catch (err) {
    //incase of an error
    return {
      success: false,
      status: 500,
      message: err.message,
    };
  }
};

module.exports = { addBookmark, getBookmarks };
