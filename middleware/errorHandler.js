// Global error handling middleware
const errorHandler = (error, req, res, next) => {
  console.error('Error:', error);

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: message,
    statusCode,
  });
};

module.exports = errorHandler;
