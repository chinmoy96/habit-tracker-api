// Authentication middleware to validate user session
const authMiddleware = (req, res, next) => {
  // Check for user in request object (set by NextAuth or external session validator)
  // For now, we expect userId to be passed in headers or session
  const userId = req.headers['x-user-id'] || req.session?.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - No valid session',
      statusCode: 401,
    });
  }

  req.userId = userId;
  next();
};

module.exports = authMiddleware;
