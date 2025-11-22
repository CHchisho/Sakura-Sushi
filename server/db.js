const mariadb = require('mariadb')
require('dotenv').config()

// Database configuration from environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sakura_sushi',
  connectionLimit: 5,
}

// Create connection pool
const pool = mariadb.createPool(dbConfig)

// Test database connection
async function testConnection() {
  let conn
  try {
    conn = await pool.getConnection()
    await conn.query('SELECT 1')
    console.log('✅ Database connection successful')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    return false
  } finally {
    if (conn) conn.release()
  }
}

// Get connection from pool
async function getConnection() {
  return await pool.getConnection()
}

// Execute query helper
async function query(sql, params = []) {
  let conn
  try {
    conn = await pool.getConnection()
    const result = await conn.query(sql, params)
    return result
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  } finally {
    if (conn) conn.release()
  }
}

module.exports = {
  pool,
  testConnection,
  getConnection,
  query,
}
