const authService = require("./auth.service");
const ConflictError = require("../../utils/ConflictError");
const AuthenticationError = require("../../utils/AuthenticationError");

//To add a new user to the system
const registerUser = async (req, res) => {
  try {
    //validate the input data
    const validData = authService.validateInputData("register", req.body);

    //check if the email is already registered
    const { exists } = await authService.getUserByEmail(validData.email);
    if (exists) {
      throw new ConflictError("A user already registered with this email.");
    }

    //encrypt the password
    const encryptedPassword = await authService.encryptPassword(
      validData.password
    );
    validData.password = encryptedPassword;

    //send the validated data with the encrypted password to the database
    authService.sendToDatabase(validData);

    //if everything works fine, a success response is sent back.
    const response = { success: true, message: "Registration Successful!" };
    res.status(201).send(response);
  } catch (error) {
    //standard error response for any internal server error
    const response = {
      success: false,
      message: "Registration Unsuccessful!",
      error: "Something went wrong, please try again.",
    };
    res.status(500);

    //if the error is validation related or a custom conflict error, then the specific error message is returned
    if (error.isJoi || error instanceof ConflictError) {
      response.error = error.message;
      error.isJoi ? res.status(422) : res.status(409);
    }

    res.send(response);
  }
};

//Authenticate an existing user.
const loginUser = async (req, res) => {
  try {
    //validate the input data
    const validData = authService.validateInputData("login", req.body);

    //get user by email
    const existingUser = await authService.getUserByEmail(validData.email);
    if (!existingUser.exists)
      throw new ConflictError("The email is not registered.");

    //to match the hashed password retrieved from the database and the user entered password
    const match = await authService.matchPassword(
      validData.password,
      existingUser.user.password
    );

    if (match == false) {
      //throw an authentication error since the passwords do not match
      throw new AuthenticationError("The password is incorrect.");
    } else if (match == true) {
      //if passwords match
      const token = authService.generateToken(existingUser.user);
      //the response to be sent back
      const response = {
        success: true,
        message: "Login Successful!",
        token: token,
      };
      res.status(200).send(response);
    }
  } catch (error) {
    //standard error response for any internal server error
    const response = {
      success: false,
      message: "Login Unsuccessful!",
      error: "Something went wrong, please try again.",
    };

    //for all validation or custom built errors, the appropriate error message is returned
    if (error.isJoi) {
      response.error = error.message;
      res.status(422);
    } else if (
      error instanceof ConflictError ||
      error instanceof AuthenticationError
    ) {
      response.error = error.message;
      error instanceof ConflictError ? res.status(409) : res.status(401);
    } else res.status(500);

    res.send(response);
  }
};

//To check if a token sent in the header of the request is still valid.
const validateToken = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    const token = authHeader ? authHeader.split(" ")[1] : null;
    if (!token) {
      throw new AuthenticationError("Token missing.");
    }

    authService.validateToken(token, req, res, next);
  } catch (error) {
    //standard error response for any internal server error
    const response = {
      success: false,
      message: "Validation Unsuccessful!",
      error: "Something went wrong, please try again.",
    };

    //for Authentication errors
    if (error instanceof AuthenticationError) {
      response.message = "You need to log in.";
      response.error = error.message;
      res.status(401);
    } else res.status(500); //if its not an authentication error, then set status code to internal server error

    res.send(response);
  }
};

module.exports = { registerUser, loginUser, validateToken };
