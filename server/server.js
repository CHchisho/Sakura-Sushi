const express = require('express')
const path = require('path')
const { testConnection } = require('./db')

// Import routes
const authRoutes = require('./routes/auth')
const menuRoutes = require('./routes/menu')
const restaurantsRoutes = require('./routes/restaurants')
const ordersRoutes = require('./routes/orders')
const adminRoutes = require('./routes/admin')
const pagesRoutes = require('./routes/pages')

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, '../front')))

// API Routes
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Express works!',
    timestamp: new Date().toISOString(),
    status: 'success',
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/menu', menuRoutes)
app.use('/api/restaurants', restaurantsRoutes)
app.use('/api/orders', ordersRoutes)
app.use('/api/admin', adminRoutes)

// Page Routes
app.use('/', pagesRoutes)

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {},
  })
})

// Start server with database connection check
async function startServer() {
  // Test database connection
  const dbConnected = await testConnection()
  if (!dbConnected) {
    console.error('❌ Failed to connect to database. Server will not start.')
    process.exit(1)
  }

  app.listen(PORT, () => {
    console.log(`📱 Open http://localhost:${PORT} in your browser`)
    console.log(`🔍 API test: http://localhost:${PORT}/api/test`)
  })
}

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error)
  process.exit(1)
})

module.exports = app
