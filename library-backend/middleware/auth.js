const jwt = require('jsonwebtoken');

function auth(requiredRole) {
  return (req, res, next) => {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Missing token' });

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (requiredRole && payload.role !== requiredRole) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      req.user = payload;
      next();
    } catch {
      res.status(401).json({ message: 'Invalid or expired token' });
    }
  };
}
module.exports = { auth };