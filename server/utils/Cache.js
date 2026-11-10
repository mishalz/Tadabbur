import NodeCache from "node-cache";

// Small in-process cache for Quran content, which never changes per user.
// Entries expire after a day and the cache holds copies, not references.
const cache = new NodeCache({ stdTTL: 60 * 60 * 24, checkperiod: 600 });

const checkCache = (key) => cache.get(key) ?? false;
const updateCache = (key, data) => {
  cache.set(key, data);
};
const deleteCache = (key) => {
  cache.del(key);
};

export default { checkCache, updateCache, deleteCache };
