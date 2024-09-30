const NodeCache = require("node-cache");
const cache = new NodeCache({});

const checkCache = (key) => {
  const data = cache.get(key);
  if (data) {
    return data;
  } else return false;
};
const updateCache = (key, data) => {
  cache.set(key, data);
};

const deleteCache = (key) => {
  cache.del(key);
};

const seeCachedData = () => {
  const keys = cache.keys();
  keys.forEach((key) =>
    console.log(`key: ${key}, data: ${JSON.stringify(cache.get(key))}`)
  );
};

module.exports = { checkCache, updateCache, deleteCache, seeCachedData };
