/**
 * ============================================================
 *  errorHandler.js  —  Global Error Handling Middleware
 * ============================================================
 *  Catches errors from async route handlers and returns clean
 *  JSON responses with appropriate HTTP status codes.
 * ============================================================
 */

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Handle specific Mongoose errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  } else if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found. Invalid: ${err.path}`;
  } else if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
  }

  // Include stack trace only in development environment
  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

export default errorHandler;
