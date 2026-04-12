import axios from "axios";
import jwt from "jsonwebtoken";
import {
  validateToken,
  validateInputData,
  encryptPassword,
  sendToDatabase,
  getUserByEmail,
  matchPassword,
  generateToken,
  validateUser,
} from "./auth.service.js";
import {
  ConflictError,
  AuthenticationError,
  InvalidInputError,
} from "../../utils/Errors.js";
import { getQfOAuthConfig } from "../../qfAuthConfig.js";

//from Quran.com API DOCS to exchange the authorization code for access and refresh tokens
export const exchangeQfToken = async (req, res) => {
  const { code, codeVerifier, redirectUri } = req.body;
  const { authBaseUrl, clientId, clientSecret } = getQfOAuthConfig();

  try {
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", redirectUri);
    params.append("code_verifier", codeVerifier);

    const tokenResponse = await axios.post(
      `${authBaseUrl}/oauth2/token`,
      params.toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        auth: {
          username: clientId,
          password: clientSecret,
        },
      },
    );

    const token = tokenResponse.data;
    const user = token.id_token ? jwt.decode(token.id_token) : null;

    res.json({
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      idToken: token.id_token,
      expiresIn: token.expires_in,
      user,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to exchange authorization code" });
  }
};

//To add a new user to the system
export const registerUser = async (req, res) => {
  try {
    //validate the input data
    const responseData = validateInputData("register", req.body);
    const validData = responseData.data;

    if (!responseData.success)
      //if validation returns an error
      throw new InvalidInputError(responseData.message);
    //check if the email is already registered

    const { exists } = await getUserByEmail(validData.email);
    if (exists) {
      throw new ConflictError("A user already registered with this email.");
    }

    //encrypt the password
    const encryptedPassword = await encryptPassword(validData.password);
    validData.password = encryptedPassword;

    //send the validated data with the encrypted password to the database
    const registeredUser = await sendToDatabase(validData);

    //if everything works fine, a success response is sent back.
    const response = {
      message: "Registration Successful!",
      data: registeredUser,
    };
    res.status(201).send(response);
  } catch (error) {
    // error response for any internal server error or custom defined errors
    const response = {
      status: error.statusCode ?? 500,
      message: error.message,
    };

    res.status(response.status).send({ message: response.message });
  }
};

//Authenticate an existing user.
export const loginUser = async (req, res) => {
  try {
    //validate the input data
    const responseData = validateInputData("login", req.body);
    const validData = responseData.data;

    if (!responseData.success)
      //if validation returns an error
      throw new InvalidInputError(responseData.message);

    //get user by email
    const existingCheck = await getUserByEmail(validData.email);

    if (!existingCheck.exists)
      throw new ConflictError("The email is not registered.");

    //to match the hashed password retrieved from the database and the user entered password
    const match = await matchPassword(
      validData.data.password,
      existingCheck.user.password,
    );

    if (!match) {
      //throw an authentication error since the passwords do not match
      throw new AuthenticationError("The password is incorrect.");
    } else if (match) {
      //if passwords match
      const token = generateToken(existingCheck.user);
      //the response to be sent back
      const response = {
        message: "Login Successful!",
        token: token,
        username: existingCheck.user.username,
      };
      res.status(200).send(response);
    }
  } catch (error) {
    // error response for any internal server error or custom defined errors
    const response = {
      status: error.statusCode ?? 500,
      message: error.message,
    };

    res.status(response.status).send({ message: response.message });
  }
};

export const validateUserToken = (req, res) => {
  try {
    //get the token from the header
    const authHeader = req.headers["authorization"];
    const token = authHeader ? authHeader.split(" ")[1] : null;
    if (!token) throw new AuthenticationError("Token is missing.");
    const response = validateUser(token);

    return res
      .status(200)
      .send({ message: "Token is valid.", user: response.user });
  } catch (error) {
    // error response for any internal server error or custom defined errors
    const response = {
      status: error.statusCode ?? 500,
      message: error.message,
    };

    res.status(response.status).send({ message: response.message });
  }
};
