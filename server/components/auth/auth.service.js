const bcrypt = require("bcrypt");
const Joi = require("joi");
const jwt = require("jsonwebtoken");

//import the database file to trigger the connection to the database
require("./auth.database.js");
const User = require("./user.model.js");
const AuthenticationError = require("../../utils/AuthenticationError.js");

//the secret key is used to sign and validate the jwt tokens
const secretKey = process.env.JWT_SECRET_KEY;

//Joi schemas for validating the registration and login inputs
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(2).max(15).required(),
  password: Joi.string().min(2).max(15).required(),
  email: Joi.string().email().required(),
});
const loginSchema = Joi.object({
  password: Joi.string().min(2).max(15).required(),
  email: Joi.string().email().required(),
});

//function to check if a token sent in the header of the request is still valid.
const validateToken = (token, req, res, next) => {
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) throw new AuthenticationError("Invalid token.");

    res.send({ success: true, user: decoded });
    // req.user = decoded;
    // next();
  });
};

//function to apply specific validation to the user entered data
const validateInputData = (type, data) => {
  let schema = loginSchema; //by default login schema is chosen

  if (type == "register") schema = registerSchema; //if however the type is register, then the schema is switched

  const { error, value } = schema.validate(data); //if the schema is valid, the error will be undefined, otherwise the error will have the Joi ValidationError object.

  if (error) throw new Joi.ValidationError(error.details[0].message);
  //throw an error so that it could be caught and dealt in the parent function
  else if (value) return value; //if there is no error, return the validated data
};

//To encrypt the user entered password before storing it in the user database to ensure security of user data.
const encryptPassword = async (plainPassword) => {
  const salt = 10; //the salt determines the security of the hash.

  //encrypt the password and send it back
  const encryptedPassword = await bcrypt.hash(plainPassword, salt);
  return encryptedPassword;
};

//Send the registered data to the user database.
const sendToDatabase = async (data) => {
  const registeredUser = await User.create(data); //save the data to the database using the User model
  return registeredUser;
};

//To check if a user with the email exists.
const getUserByEmail = async (email) => {
  const existingUser = await User.findOne({ email: email }); //query the database to retrieve a user by the email if it exists

  if (!existingUser) return { exists: false }; //if there is no user found
  return { exists: true, user: existingUser };
};

//To check if the user entered password matches the encrypted password stored in the database.
const matchPassword = async (plainPassword, encryptedPassword) => {
  const result = await bcrypt.compare(plainPassword, encryptedPassword);
  return result;
};

//To generate a token if the user entered data in login process clears all checks.
const generateToken = (user) => {
  //defining the information that will be stored in the token
  const payload = {
    id: user._id,
    username: user.username,
  };

  //to define the time that the token will expire in.
  const options = { expiresIn: "7d" };

  //generate and return the token
  const token = jwt.sign(payload, secretKey, options);
  return token;
};

module.exports = {
  validateToken,
  validateInputData,
  encryptPassword,
  sendToDatabase,
  getUserByEmail,
  matchPassword,
  generateToken,
};
