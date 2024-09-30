const authService = require("./auth.service");
const { ConflictError, AuthenticationError } = require("../../utils/Errors");

//To add a new user to the system
const registerUser = async (req, res) => {
  try {
    //validate the input data
    const responseData = authService.validateInputData("register", req.body);
    const validData = responseData.data;

    if (responseData.success == false)
      //if validation returns an error
      return res.status(responseData.status).send(responseData);
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
      status: 500,
      message: error.message,
    };

    //if the error is validation related or a custom conflict error, then the specific error message is returned
    if (error instanceof ConflictError) {
      response.message = error.message;
      response.status = error.statusCode;
    }

    res.status(response.status).send(response);
  }
};

//Authenticate an existing user.
const loginUser = async (req, res) => {
  try {
    //validate the input data
    const validData = authService.validateInputData("login", req.body);

    if (validData.success == false)
      //if validation returns an error
      return res.status(validData.status).send(validData);

    //get user by email
    const existingUser = await authService.getUserByEmail(validData.data.email);

    if (!existingUser.exists)
      throw new ConflictError("The email is not registered.");

    //to match the hashed password retrieved from the database and the user entered password
    const match = await authService.matchPassword(
      validData.data.password,
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
      status: 500,
      message: error.message,
    };

    //for all validation or custom built errors, the appropriate error message is returned
    if (
      error instanceof ConflictError ||
      error instanceof AuthenticationError
    ) {
      response.message = error.message;
      response.status = error.statusCode;
    }

    res.status(response.status).send(response);
  }
};

module.exports = { registerUser, loginUser };
