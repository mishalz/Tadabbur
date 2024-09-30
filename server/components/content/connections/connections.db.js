const neo4j = require("neo4j-driver");

const neo4jURL = process.env.NEO4J_URL;
const neo4jUser = process.env.NEO4J_USER;
const neo4jPassword = process.env.NEO4J_PASSWORD;

let driver;

const initDriver = async () => {
  driver = neo4j.driver(neo4jURL, neo4j.auth.basic(neo4jUser, neo4jPassword));
  await driver.getServerInfo();
  return driver;
};

initDriver().then((res) => (driver = res));

const getDriver = () => {
  return driver;
};
module.exports = getDriver;
