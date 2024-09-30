const mongoose = require("mongoose");
const dbURL = process.env.USER_DB_URL;

//connecting to the mongoDB using mongoose
const userDBConnection = mongoose.createConnection(dbURL);
userDBConnection.on("connected", () => {
  console.log("Successfully connected to the user database.");
});
userDBConnection.on("error", (err) => {
  console.error("Failed to connect to user database.", err);
});

module.exports = userDBConnection;
