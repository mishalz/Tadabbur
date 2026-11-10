import Joi from "joi";
import pool, { query } from "../../../db/pool.js";
import { ensureSchema } from "../../../db/schema.js";
import { getVerseData } from "../../quran-retrieval/quran.service.js";
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
  else if (value.fromVerse === value.toVerse)
    return {
      success: false,
      status: 422,
      message: "A verse cannot be connected to itself.",
    };
  else if (value) return { success: true, status: 200, data: value }; //if there is no error, return the validated data
};

//to validate that the verses exist and get data required for creating a connection
export const validateAndGetVersePair = async (fromVerse, toVerse) => {
  const keys = [fromVerse, toVerse];
  const results = await Promise.allSettled(keys.map((key) => getVerseData(key)));

  // A verse that does not exist is the user's mistake: say which one.
  const missing = keys.filter(
    (_, i) =>
      results[i].status === "rejected" &&
      results[i].reason?.name === "ResourceNotFoundError",
  );
  if (missing.length > 0) {
    const names = missing.join(" and ");
    return {
      success: false,
      status: 404,
      message:
        missing.length === 1
          ? `Verse ${names} does not exist. Please check the surah and verse number.`
          : `Verses ${names} do not exist. Please check the surah and verse numbers.`,
    };
  }

  // Anything else (e.g. the content API being down) is a real failure.
  const failure = results.find((result) => result.status === "rejected");
  if (failure) throw failure.reason;

  const toRecord = ({ value: { verse } }) => ({
    key: verse.verse_key,
    arabicText: verse.text_uthmani,
    translation: verse.translations?.[0]?.text ?? "",
  });

  return {
    success: true,
    fromVerse: toRecord(results[0]),
    toVerse: toRecord(results[1]),
  };
};

//does this user already have a connection between the two verses (either direction)?
export const checkConnectionExists = async (
  fromVerseKey,
  toVerseKey,
  userSub,
) => {
  try {
    await ensureSchema();
    const { rowCount } = await query(
      `SELECT 1 FROM connections
       WHERE user_sub = $1
         AND ((from_verse = $2 AND to_verse = $3) OR (from_verse = $3 AND to_verse = $2))
       LIMIT 1`,
      [userSub, fromVerseKey, toVerseKey],
    );
    return rowCount > 0;
  } catch (error) {
    console.error("[DB] checkConnectionExists failed:", error.message);
    throw new Error("Could not validate if the connection exists.");
  }
};

//save the connection to the database
export const saveConnection = async (
  userSub,
  fromVerse,
  toVerse,
  note = "",
) => {
  await ensureSchema();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    //verse text is kept from the first time a verse is seen
    for (const verse of [fromVerse, toVerse]) {
      await client.query(
        `INSERT INTO verses (key, arabic_text, translation)
         VALUES ($1, $2, $3)
         ON CONFLICT (key) DO NOTHING`,
        [verse.key, verse.arabicText, verse.translation],
      );
    }
    //the unique index makes this safe against two concurrent requests
    const { rowCount } = await client.query(
      `INSERT INTO connections (user_sub, from_verse, to_verse, note)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_sub, LEAST(from_verse, to_verse), GREATEST(from_verse, to_verse))
       DO NOTHING`,
      [userSub, fromVerse.key, toVerse.key, note],
    );
    await client.query("COMMIT");
    return rowCount === 1
      ? { success: true, message: "Connection added." }
      : { success: false, message: "connection exists" };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
};

//get all connections for one specific verse
export const getVerseConnections = async (userSub, verseKey) => {
  //check if the passed verse key is valid
  await getVerseData(verseKey);
  await ensureSchema();

  const { rows } = await query(
    `SELECT c.note,
            f.key AS from_key, f.arabic_text AS from_arabic, f.translation AS from_translation,
            t.key AS to_key,   t.arabic_text AS to_arabic,   t.translation AS to_translation
     FROM connections c
     JOIN verses f ON f.key = c.from_verse
     JOIN verses t ON t.key = c.to_verse
     WHERE c.user_sub = $1 AND ($2 = c.from_verse OR $2 = c.to_verse)
     ORDER BY c.created_at DESC`,
    [userSub, verseKey],
  );

  const result = getFormattedConnections(rows);

  if (result.length === 0) {
    //if there are no connections
    throw new ResourceNotFoundError(
      "There are no connections to display for this verse.",
    );
  }
  return { success: true, connections: result };
};

//helper function to shape database rows into the API response
export const getFormattedConnections = (rows) =>
  rows.map((row) => ({
    fromVerse: {
      key: row.from_key,
      text_arabicText: row.from_arabic,
      translation: row.from_translation,
    },
    note: row.note,
    toVerse: {
      key: row.to_key,
      text_arabicText: row.to_arabic,
      translation: row.to_translation,
    },
  }));

//returns true if a connection was deleted
export const deleteConnectionService = async (
  fromVerseKey,
  toVerseKey,
  userSub,
) => {
  await ensureSchema();
  const { rowCount } = await query(
    `DELETE FROM connections
     WHERE user_sub = $1
       AND ((from_verse = $2 AND to_verse = $3) OR (from_verse = $3 AND to_verse = $2))`,
    [userSub, fromVerseKey, toVerseKey],
  );
  return rowCount > 0;
};
