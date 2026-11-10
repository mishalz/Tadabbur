// Fallback for unmatched routes.
export const notFoundHandler = (_req, res) => {
  res.status(404).send({
    success: false,
    message: "Sorry, this page does not exist",
  });
};

// Express only treats a function as an error handler when it takes exactly
// four arguments (err, req, res, next).
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  console.error("[Server] Unhandled error:", err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).send({
    success: false,
    message: status === 400 ? "Invalid request body" : "Internal server error",
  });
};
