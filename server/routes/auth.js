const express = require('express')
const jwt = require('jsonwebtoken')
const { authenticateToken } = require('../middleware/auth')
const { createUser, validateUser } = require('../services/userService')

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'sakura-sushi-secret-key-2024'

// Registration
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 6 characters',
      })
    }

    const user = await createUser(email, password)

    res.status(201).json({
      success: true,
      message: 'User successfully registered',
      user,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      })
    }

    // Normalize email to lowercase and trim
    const normalizedEmail = email.toLowerCase().trim()
    const user = await validateUser(normalizedEmail, password)

    // Ensure user.id is a valid number
    if (!user.id || isNaN(Number(user.id))) {
      return res.status(500).json({
        success: false,
        message: 'Invalid user ID format',
      })
    }

    // Create JWT token with 1 day expiration
    const token = jwt.sign({ id: Number(user.id), email: user.email }, JWT_SECRET, {
      expiresIn: '1d',
    })

    res.json({
      success: true,
      message: 'Successful login',
      token,
      user,
    })
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    })
  }
})

// Validate token
router.post('/validate', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    user: { email: req.user.email },
  })
})

// Logout
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Successful logout',
  })
})

module.exports = router
