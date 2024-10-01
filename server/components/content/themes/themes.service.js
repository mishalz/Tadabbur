const { Theme, AddedToTheme } = require("./themes.model");
const Joi = require("joi");
const quranService = require("../../quran-retrieval/quran.service");
const Cache = require("../../../utils/Cache");
const Validation = require("../../../utils/Validation");

//Joi schema to validate the theme data
const themeSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
  description: Joi.string().trim().min(2),
  colour: Joi.string().trim().length(7).required(),
  icon: Joi.string().trim().required(),
});

//function to create a theme after validation
const saveTheme = async (userId, data) => {
  try {
    //valiating user input
    const validatedInput = Validation.validateInput(data, themeSchema);

    //if input data doesnot pass validation
    if (!validatedInput.success) return validatedInput;

    const validatedData = validatedInput.data; //extract the data to create a theme

    //save to database
    await Theme.create({ userId, ...validatedData });

    //if everything works fine, a success response is sent back.
    const response = { success: true, status: 201, message: "Theme Created!" };

    //since a new theme has been created, the old cache needs to be deleted.
    Cache.deleteCache(`themes-${userId}`);
    return response;
  } catch (err) {
    //incase of a duplicate key error. the key for the themes model is (userid, theme name)
    if (err.code == 11000)
      return {
        success: false,
        status: 400,
        message: "A theme with this name already exists",
      };
    //general error response
    return {
      success: false,
      status: 500,
      message: err.message,
    };
  }
};

const getThemes = async (userId) => {
  try {
    //first check cache
    const cacheKey = `themes-${userId}`;
    let themes = Cache.checkCache(cacheKey);

    if (themes) return { success: true, status: 200, themes: themes }; //themes found in the cache

    //query the database otherwise
    themes = await Theme.find({ userId: userId });

    //if the database returns a themes array of 0 length
    if (themes && themes.length == 0) {
      return {
        success: true,
        status: 404,
        message: "There are no created themes.",
      };
    } else {
      //if themes are retrieved successfully and are not empty
      Cache.updateCache(cacheKey, themes);
      return { success: true, status: 200, themes: themes };
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

const deleteThemes = async (userId, themeIds) => {
  try {
    //first delete all theme verse relationships
    await AddedToTheme.deleteMany({
      themeId: { $in: themeIds },
    });

    //then delete all selected themes
    const deleted = await Theme.deleteMany({
      _id: { $in: themeIds },
    });

    //if everything works fine, a success response is sent back.
    const response = {
      success: true,
      status: 200,
      message: `${deleted.deletedCount} themes deleted.`,
    };

    //since the theme has been deleted, deleting the cache
    themeIds.forEach((themeId) => Cache.deleteCache(`themes-${themeId}`));
    //delete the current user created themes list
    Cache.deleteCache(`themes-${userId}`);

    return response;
  } catch (err) {
    console.log(err);
    if (err.name == "CastError")
      //in case the theme id is invalid or short of the usual
      return {
        success: false,
        status: 400,
        message: "The theme does not exist.",
      };
    //incase of a general error
    return {
      success: false,
      status: 500,
      message: err.message,
    };
  }
};
const removeVersesFromTheme = async (themeId, verseKeys) => {
  try {
    //remove all theme verse relationships where the verse key is in the array of verse keys
    await AddedToTheme.deleteMany({
      themeId: themeId,
      verseKey: { $in: verseKeys },
    });
    //if everything works fine, a success response is sent back.
    const response = {
      success: true,
      status: 200,
      message: "Verse removed from the theme!",
    };

    //since some verses have been removed, the old cache needs to be deleted.
    Cache.deleteCache(`themes-${themeId}`);

    return response;
  } catch (err) {
    console.log(err);
    if (err.name == "CastError")
      //in case the theme id is invalid or short of the usual
      return {
        success: false,
        status: 400,
        message: "The theme does not exist.",
      };
    //incase of a general error
    return {
      success: false,
      status: 500,
      message: err.message,
    };
  }
};

//function to first validate the verse key and the theme id and then add the verse to the theme
const addVerseToTheme = async (userId, themeId, verseKey) => {
  try {
    //validate verse key
    const verse = await quranService.getVerseData(verseKey);
    if (!verse.success) return verse; //if the validity function returns an error response object

    //validate themeId
    const existingTheme = await Theme.findById(themeId);

    if (!existingTheme)
      //if the theme doesnot exist
      return {
        success: false,
        status: 400,
        message: "The theme does not exist",
      };

    //save the theme verse relationship
    await AddedToTheme.create({
      userId,
      themeId,
      themeName: existingTheme.name,
      verseKey: verse.data.key,
      arabicText: verse.data.text_indopak,
      translation: verse.data.translation,
    });
    //if everything works fine, a success response is sent back.
    const response = {
      success: true,
      status: 201,
      message: "Verse added to theme!",
    };

    //since a new verse has been added to the theme, the old cache needs to be deleted.
    Cache.deleteCache(`themes-${themeId}`);

    return response;
  } catch (err) {
    if (err.code == 11000)
      //incase of duplicate key which for the theme verse relationship if (theme id, verse key)
      return {
        success: false,
        status: 400,
        message: "The verse is already added to the theme",
      };
    if (err.name == "CastError")
      //in case the theme id is invalid or short of the usual
      return {
        success: false,
        status: 400,
        message: "The theme does not exist.",
      };
    //incase of a general error
    return {
      success: false,
      status: 500,
      message: err.message,
    };
  }
};

//to retrieve all verses for a theme
const getAllVerses = async (themeId) => {
  try {
    //first check cache
    const cacheKey = `themes-${themeId}`;
    let themeVerses = Cache.checkCache(cacheKey);

    if (themeVerses) return { success: true, status: 200, verses: themeVerses }; //themes found in the cache

    //query the database otherwise
    themeVerses = await AddedToTheme.find({ themeId: themeId });

    //if the database returns a themes array of 0 length
    if (themeVerses && themeVerses.length == 0) {
      return {
        success: true,
        status: 404,
        message: "There are no verses added to this theme.",
      };
    } else {
      //if themes are retrieved successfully and are not empty
      Cache.updateCache(cacheKey, themeVerses);
      return { success: true, status: 200, verses: themeVerses };
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

const getVerseThemes = async (userId, verseKey) => {
  try {
    //first check cache
    const cacheKey = `themes-${userId}-${verseKey}`;
    let themes = Cache.checkCache(cacheKey);

    if (themes) return { success: true, status: 200, themes: themes }; //verse themes found in the cache

    //query the database otherwise
    themes = await AddedToTheme.find({ userId: userId, verseKey: verseKey });

    //if the database returns a themes array of 0 length
    if (themes && themes.length == 0) {
      return {
        success: true,
        status: 404,
        message: "There are no themes for this verse.",
      };
    } else {
      //if themes are retrieved successfully and is not empty
      Cache.updateCache(cacheKey, themes);
      return { success: true, status: 200, themes: themes };
    }
  } catch (error) {
    //incase of an error

    return {
      success: false,
      status: 500,
      message: error.message,
    };
  }
};

module.exports = {
  saveTheme,
  getThemes,
  addVerseToTheme,
  removeVersesFromTheme,
  getAllVerses,
  deleteThemes,
  getVerseThemes,
};
