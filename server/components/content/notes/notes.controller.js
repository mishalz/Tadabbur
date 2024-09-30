const noteService = require("./notes.service");
const quranService = require("../../quran-retrieval/quran.service");

//to get all notes for a user
const getAllUserNotes = async (req, res) => {
  //extracting the user id from the req
  const userId = req.user.id;

  //retrieve all notes
  const notes = await noteService.getAllNotes(userId);

  return res.status(notes.status).send(notes);
};

//to get all user created notes for one specific verse
const getNotesForAVerse = async (req, res) => {
  //extracting the user id from the req
  const userId = req.user.id;

  //getting the verse key from the url
  const verseKey = req.params.verse_key;

  //retrieve all notes
  const notes = await noteService.getVerseNotes(userId, verseKey);
  return res.status(notes.status).send(notes);
};

//to add a new note on a verse
const addNewNote = async (req, res) => {
  //extracting the verse key from the url
  const verseKey = req.params.verse_key;

  //extracting the user id from the req
  const userId = req.user.id;

  //send the data to be validated and saved
  const savedNote = await noteService.saveNote(userId, verseKey, req.body);

  return res.status(savedNote.status).send(savedNote);
};

//to edit an existing note on a verse
const editNote = async (req, res) => {
  //retrieve the verse key from the params and the user id from the req
  const noteId = req.params.note_id;

  //validate and save the updated note
  const updatedNote = await noteService.updateNote(noteId, req.body);

  return res.status(updatedNote.status).send(updatedNote);
};

//to delete notes in a batch operation
const deleteNotes = async (req, res) => {
  //retrieving the node ids from the req body

  const noteIds = req.body.note_ids;

  //sending them for batch delete
  const response = await noteService.deleteNotes(noteIds);

  return res.status(response.status).send(response);
};

module.exports = {
  getAllUserNotes,
  getNotesForAVerse,
  addNewNote,
  editNote,
  deleteNotes,
};
