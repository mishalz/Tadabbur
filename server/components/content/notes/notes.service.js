const Note = require("./notes.model");
const Joi = require("joi");
const quranService = require("../../quran-retrieval/quran.service");
const Cache = require("../../../utils/Cache");
const Validation = require("../../../utils/Validation");

//schema to validate user input for note creation and update
const noteSchema = Joi.object({
  heading: Joi.string().trim().min(2).max(50).required(),
  content: Joi.string().trim().min(2).required(),
  colour: Joi.string().trim().length(7).required(),
});

//function to validate input data and create a new note
const saveNote = async (userId, verseKey, data) => {
  try {
    //valiating user input
    const validatedInput = Validation.validateInput(data, noteSchema);
    //if input data doesnot pass validation
    if (!validatedInput.success) return validatedInput;

    //first validate the verse key to see the verse exist
    const verse = await quranService.getVerseData(verseKey);
    if (!verse.success) return verse; //if the validity function returns an error response object

    //save to database
    await Note.create({ userId, verseKey, ...data });

    //if everything works fine, a success response is sent back.
    const response = { success: true, status: 201, message: "Note Created!" };

    //since a new note has been created, the old cache needs to be deleted.
    Cache.deleteCache(`notes-${userId}-${verseKey}`);
    Cache.deleteCache(`notes-${userId}`);

    return response;
  } catch (err) {
    //incase of an error
    return {
      success: false,
      status: 500,
      message: err.message,
    };
  }
};

//function to get all notes first by checking the cache and then retrieving from the database
const getAllNotes = async (userId) => {
  try {
    //first check cache
    const cacheKey = `notes-${userId}`;
    let notes = Cache.checkCache(cacheKey);

    if (notes) return { success: true, status: 200, notes: notes }; //notes found in the cache

    //query the database otherwise
    notes = await Note.find({ userId: userId });

    //if the database returns a notes array of 0 length
    if (notes && notes.length == 0) {
      return {
        success: true,
        status: 404,
        message: "There are no notes added.",
      };
    } else {
      //if notes are retrieved successfully and is not empty
      Cache.updateCache(cacheKey, notes);
      return { success: true, status: 200, notes: notes };
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

//function to retrieve all notes of a verse either from the cache or from the database
const getVerseNotes = async (userId, verseKey) => {
  try {
    //first check cache
    const cacheKey = `notes-${userId}-${verseKey}`;
    let notes = Cache.checkCache(cacheKey);

    if (notes) return { success: true, status: 200, notes: notes }; //notes found in the cache

    //query the database otherwise
    notes = await Note.find({ userId: userId, verseKey: verseKey });

    //if the database returns a notes array of 0 length
    if (notes && notes.length == 0) {
      return {
        success: true,
        status: 404,
        message: "There are no notes added on this verse.",
      };
    } else {
      //if notes are retrieved successfully and is not empty
      Cache.updateCache(cacheKey, notes);
      return { success: true, status: 200, notes: notes };
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

//function to validate input and then update a note
const updateNote = async (noteId, data) => {
  try {
    //first validate the data
    const validatedInput = Validation.validateInput(data, noteSchema);
    //if input data doesnot pass validation
    if (!validatedInput.success) return validatedInput;

    const { heading, content, colour } = validatedInput.data;
    //save to database
    const updatedNote = await Note.findByIdAndUpdate(
      noteId,
      { $set: { heading, content, colour } },
      { upsert: false }
    );

    //if everything works fine, a success response is sent back.
    const response = { success: true, status: 200, message: "Note updated!" };
    //since a note has been changed, the old cache needs to be deleted.
    Cache.deleteCache(`notes-${updatedNote.userId}-${updatedNote.verseKey}`);
    Cache.deleteCache(`notes-${updatedNote.userId}`);
    return response;
  } catch (err) {
    //incase of an error
    return {
      success: false,
      status: 500,
      message: err.message,
    };
  }
};

//function to perform batch delete of the note with note ids
const deleteNotes = async (noteIds) => {
  //deleting the notes from the database
  try {
    //delete all notes that have an id which is present in the note ids parameter
    const result = await Note.deleteMany({ _id: { $in: noteIds } });
    return { success: true, status: 200, deletedCount: result.deletedCount };
  } catch (error) {
    return { success: false, status: 500, message: error.message };
  }
};

module.exports = {
  saveNote,
  getAllNotes,
  updateNote,
  getVerseNotes,
  deleteNotes,
};
