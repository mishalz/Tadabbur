//define the User model
import mongoose from "mongoose";
import userDBConnection from "./auth.database.js";
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = userDBConnection.model("User", userSchema);

export default User;
