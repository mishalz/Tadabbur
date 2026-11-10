import Joi from "joi";
import Cache from "../../utils/Cache.js";
import { getJsonData, getVerseData } from "./quran.service.js";

const surahQuerySchema = Joi.object({
  id: Joi.number().integer().min(1).max(114).required(),
  page: Joi.number().integer().min(1).max(1000).default(1),
  // field name such as "text_uthmani"
  script: Joi.string()
    .pattern(/^[a-z_]{1,40}$/)
    .default("text_uthmani"),
  translation_id: Joi.number().integer().min(1).max(100000).default(85),
});

const sendError = (res, status, message) => res.status(status).send({ message });

export const getAllSurahs = async (_req, res) => {
  try {
    const cacheKey = "surahList";

    const cached = Cache.checkCache(cacheKey);
    if (cached) return res.status(200).send(cached);

    const { data: surahList } = await getJsonData("/content/api/v4/chapters");
    if (!surahList) throw new Error("Empty chapters response");

    Cache.updateCache(cacheKey, surahList);
    return res.status(200).send(surahList);
  } catch (err) {
    console.error("[Quran] getAllSurahs failed:", err.message);
    return sendError(res, 500, "An error occurred while retrieving the surah list.");
  }
};

//to get all verses of a surah (paginated)
export const getSurahData = async (req, res) => {
  const { error, value } = surahQuerySchema.validate(
    { ...req.query, id: req.params.id },
    { stripUnknown: true },
  );
  if (error) return sendError(res, 422, error.details[0].message);

  const { id, page, script, translation_id } = value;

  try {
    // The cache key must include every parameter that changes the response.
    const cacheKey = `surah-${id}-page-${page}-${script}-${translation_id}`;
    const cached = Cache.checkCache(cacheKey);
    if (cached) return res.status(200).send(cached);

    const { data: surahData } = await getJsonData(
      `/content/api/v4/verses/by_chapter/${id}`,
      { page, fields: script, translations: translation_id },
    );
    if (!surahData?.verses) throw new Error("Empty verses response");

    Cache.updateCache(cacheKey, surahData);
    return res.status(200).send(surahData);
  } catch (err) {
    console.error("[Quran] getSurahData failed:", err.message);
    return sendError(res, 500, "An error occurred while retrieving the verses.");
  }
};

//to get Data for one verse
export const getVerseDataRouteHandler = async (req, res) => {
  try {
    const { verse } = await getVerseData(req.params.verse_key); //validates the key and fetches the verse
    return res.status(200).send({ verse });
  } catch (err) {
    if (err.name === "ResourceNotFoundError") {
      return sendError(res, 404, err.message);
    }
    console.error("[Quran] getVerseDataRouteHandler failed:", err.message);
    return sendError(res, 500, "An error occurred while retrieving the verse data.");
  }
};
