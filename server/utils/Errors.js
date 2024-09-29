class ConflictError extends Error {
  constructor(message) {
    super(message), (this.name = "ConflictError"), (this.statusCode = 409);
  }
}

class AuthenticationError extends Error {
  constructor(message) {
    super(message),
      (this.name = "AuthenticationError"),
      (this.statusCode = 401);
  }
}

module.exports = { ConflictError, AuthenticationError };
