const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Get token from Authorization header (format: Bearer <token>)
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // Check if token is provided
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token using JWT_SECRET from environment variables
    const decoded = jwt.verify(token, 'quiz_app_secret_key_2024');
    
    // Set req.user with decoded payload (includes id for quiz.js)
    req.user = decoded;
    
    // Proceed to next middleware/route
    next();
  } catch (err) {
    // Handle invalid or expired token
    res.status(401).json({ message: 'Token is not valid' });
  }
};
