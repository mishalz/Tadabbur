import bcrypt from "bcrypt";
import Joi from "joi";
import jwt from "jsonwebtoken";
import User from "./user.model.js";
import { AuthenticationError } from "../../utils/Errors.js";

//the secret key is used to sign and validate the jwt tokens
const secretKey = process.env.JWT_SECRET_KEY;

//Joi schemas for validating the registration and login inputs
export const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(2).max(15).required(),
  password: Joi.string().min(2).max(15).required(),
  email: Joi.string().email().required(),
});
export const loginSchema = Joi.object({
  password: Joi.string().min(2).max(15).required(),
  email: Joi.string().email().required(),
});

export const validateUser = (token) => {
  //verify the token validity using jwt
  return jwt.verify(token, secretKey, (err, decoded) => {
    if (err) throw new AuthenticationError("Token is invalid."); //throw error if token is invalid
    return { success: true, user: decoded };
  });
};

//To check if a token sent in the header of the request is still valid.
export const validateToken = (req, res, next) => {
  try {
    //get the token from the header
    const authHeader = req.headers["authorization"];
    const token = authHeader ? authHeader.split(" ")[1] : null;
    //throw an error if the token doesnot exist
    if (!token) {
      throw new AuthenticationError("Token is missing.");
    }

    //verify the token validity using jwt
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) throw new AuthenticationError("Invalid token."); //throw error if token is invalid
      req.user = decoded;
      console.log("decoded:");
      console.log(decoded);
      next();
    });
  } catch (error) {
    console.log(error);
    //standard error response for any internal server error
    const response = {
      success: false,
      status: 500,
      message: "Validation Unsuccessful!",
    };

    //for Authentication errors
    if (error instanceof AuthenticationError) {
      response.message = error.message;
      response.status = 401;
    }

    res.status(response.status).send(response);
  }
};

//function to apply specific validation to the user entered data
export const validateInputData = (type, data) => {
  let schema = loginSchema; //by default login schema is chosen

  if (type == "register") schema = registerSchema; //if however the type is register, then the schema is switched

  const { error, value } = schema.validate(data); //if the schema is valid, the error will be undefined, otherwise the error will have the Joi ValidationError object.

  if (error) return { success: false, message: error.details[0].message };
  //send back an appropriate error object so it could be dealt in the parent function
  else if (value) return { success: true, data: value }; //if there is no error, return the validated data
};

//To encrypt the user entered password before storing it in the user database to ensure security of user data.
export const encryptPassword = async (plainPassword) => {
  const salt = 10; //the salt determines the security of the hash.

  //encrypt the password and send it back
  const encryptedPassword = await bcrypt.hash(plainPassword, salt);
  return encryptedPassword;
};

//Send the registered data to the user database.
export const sendToDatabase = async (data) => {
  const registeredUser = await User.create(data); //save the data to the database using the User model
  return registeredUser;
};

//To check if a user with the email exists.
export const getUserByEmail = async (email) => {
  const existingUser = await User.findOne({ email: email }); //query the database to retrieve a user by the email if it exists
  if (!existingUser) return { exists: false }; //if there is no user found
  return { exists: true, user: existingUser };
};

//To check if the user entered password matches the encrypted password stored in the database.
export const matchPassword = async (plainPassword, encryptedPassword) => {
  const result = await bcrypt.compare(plainPassword, encryptedPassword);
  return result;
};

//To generate a token if the user entered data in login process clears all checks.
export const generateToken = (user) => {
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
