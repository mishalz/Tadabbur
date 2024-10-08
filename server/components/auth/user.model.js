//define the User model
const mongoose = require("mongoose");
const userDBConnection = require("./auth.database");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = userDBConnection.model("User", userSchema);

module.exports = User;
