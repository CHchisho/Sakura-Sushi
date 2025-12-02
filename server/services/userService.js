const bcrypt = require('bcrypt')
const { query } = require('../db')

// Functions for working with users
async function findUserByEmail(email) {
  // Normalize email to lowercase for case-insensitive comparison
  const normalizedEmail = email.toLowerCase().trim()
  const result = await query(
    'SELECT u.id, u.email, u.password, u.created_at, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE LOWER(TRIM(u.email)) = ?',
    [normalizedEmail]
  )
  if (result.length > 0) {
    const user = result[0]
    user.id = Number(user.id)
    return user
  }
  return null
}

async function createUser(email, password) {
  // Normalize email to lowercase and trim
  const normalizedEmail = email.toLowerCase().trim()

  // Check if the user exists
  const existingUser = await findUserByEmail(normalizedEmail)
  if (existingUser) {
    throw new Error('User with this email already exists')
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Get role_id for 'user' role (assuming role_id = 2 for regular users)
  const roleResult = await query('SELECT id FROM roles WHERE name = ?', ['user'])
  if (roleResult.length === 0) {
    throw new Error('User role not found in database')
  }
  const roleId = roleResult[0].id

  // Insert new user with normalized email
  const result = await query('INSERT INTO users (email, password, role_id) VALUES (?, ?, ?)', [
    normalizedEmail,
    hashedPassword,
    roleId,
  ])

  // Convert BigInt to Number to avoid serialization issues
  const userId = Number(result.insertId)

  return { id: userId, email: normalizedEmail }
}

async function validateUser(email, password) {
  // Normalize email to lowercase and trim
  const normalizedEmail = email.toLowerCase().trim()
  const user = await findUserByEmail(normalizedEmail)
  if (!user) {
    throw new Error('User not found')
  }

  const isValidPassword = await bcrypt.compare(password, user.password)
  if (!isValidPassword) {
    throw new Error('Invalid password')
  }

  // Ensure id is a Number (not BigInt)
  return { id: Number(user.id), email: user.email }
}

// Helper function to check if user is admin
async function isAdmin(userEmail) {
  const user = await findUserByEmail(userEmail)
  return user && user.role_name === 'admin'
}

module.exports = {
  findUserByEmail,
  createUser,
  validateUser,
  isAdmin,
}
