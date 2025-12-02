const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'sakura-sushi-secret-key-2024'

// Middleware for checking JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token not provided' })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid token' })
    }
    // Ensure user.id is a Number (not BigInt) to avoid serialization issues
    req.user = {
      ...user,
      id: Number(user.id),
    }
    next()
  })
}

// Middleware to check if user is admin
function requireAdmin(req, res, next) {
  if (req.user.email !== 'admin@gmail.com') {
    return res.status(403).json({ success: false, message: 'Access denied' })
  }
  next()
}

module.exports = {
  authenticateToken,
  requireAdmin,
}
