// } catch (error) {
//     //standard error response for any internal server error
//     console.log(error);
//     const response = {
//       success: false,
//       message: "Validation Unsuccessful!",
//       error: "Something went wrong, please try again.",
//     };

//     //for Authentication errors
//     if (error instanceof AuthenticationError) {
//       response.message = "You need to log in.";
//       response.error = error.message;
//     } else res.status(500); //if its not an authentication error, then set status code to internal server error

//     res.send(response);
//   }
