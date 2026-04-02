import neo4j from "neo4j-driver";
import "dotenv/config";

const neo4jURL = process.env.NEO_URL ?? "";
const neo4jUsername = process.env.NEO_USERNAME;
const neo4jPassword = process.env.NEO_PASSWORD;

let driver;

const initDriver = async () => {
  try {
    console.log("Attempting to establish driver connectivity...");
    console.log(`Using Neo4j URL: ${neo4jURL}`);
    driver = neo4j.driver(
      neo4jURL,
      neo4j.auth.basic(neo4jUsername, neo4jPassword),
    );
    await driver.getServerInfo();
    console.log("Driver connectivity established successfully");
    return driver;
  } catch (err) {
    console.error("Failed to establish driver connectivity", err);
    return;
  }
};

initDriver().then((res) => (driver = res));

export const getDriver = () => {
  return driver;
};
