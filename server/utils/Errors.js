export class ConflictError extends Error {
  constructor(message) {
    super(message), (this.name = "ConflictError"), (this.statusCode = 409);
  }
}

export class AuthenticationError extends Error {
  constructor(message) {
    super(message),
      (this.name = "AuthenticationError"),
      (this.statusCode = 401);
  }
}
export class InvalidInputError extends Error {
  constructor(message) {
    super(message),
      (this.name = "InvalidInputError"),
      (this.statusCode = 400);
  }
}

