const mongoose = require("mongoose");
const dbURL = process.env.USER_DB_URL;

//connecting to the mongoDB using mongoose
mongoose
  .connect(dbURL)
  .then(() => console.log("Succesful: Auth component connected to mongo db."))
  .catch((err) =>
    console.error("Unsuccessful: Could not connect to MongoDB", err)
  );

module.exports = mongoose;
