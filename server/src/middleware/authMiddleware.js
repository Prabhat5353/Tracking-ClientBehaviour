const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'causalfunnel_analytics_jwt_secret_2024';

/**
 * Middleware: Verify JWT Bearer token and attach decoded payload to req.user
 * Returns 401 if token is missing or invalid.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, error: 'Invalid token.' });
  }
}

/**
 * Middleware: Optionally verify JWT — attaches req.user if valid token is present,
 * but does NOT block the request if no token is given.
 * Useful for routes where auth is optional (e.g., event tracking).
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (_) {
    // Token invalid/expired — ignore and proceed anonymously
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
