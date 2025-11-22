const express = require('express')
const path = require('path')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { testConnection, query, getConnection } = require('./db')

const app = express()
const PORT = process.env.PORT || 3000

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'sakura-sushi-secret-key-2024'

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(express.static(path.join(__dirname, '../front')))

// Functions for working with users
async function findUserByEmail(email) {
  const result = await query(
    'SELECT u.id, u.email, u.password, u.created_at, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?',
    [email]
  )
  return result.length > 0 ? result[0] : null
}

async function createUser(email, password) {
  // Check if the user exists
  const existingUser = await findUserByEmail(email)
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

  // Insert new user
  const result = await query('INSERT INTO users (email, password, role_id) VALUES (?, ?, ?)', [
    email,
    hashedPassword,
    roleId,
  ])

  return { id: result.insertId, email }
}

async function validateUser(email, password) {
  const user = await findUserByEmail(email)
  if (!user) {
    throw new Error('User not found')
  }

  const isValidPassword = await bcrypt.compare(password, user.password)
  if (!isValidPassword) {
    throw new Error('Invalid password')
  }

  return { id: user.id, email: user.email }
}

// Helper function to check if user is admin
async function isAdmin(userEmail) {
  const user = await findUserByEmail(userEmail)
  return user && user.role_name === 'admin'
}

// Functions for working with menu
async function loadMenu() {
  const menuItems = await query(`
    SELECT 
      m.id,
      m.type,
      m.title,
      m.description,
      m.price,
      m.created_at,
      m.updated_at,
      GROUP_CONCAT(DISTINCT CONCAT(mt.color, ':', mt.name) SEPARATOR ',') as tags,
      GROUP_CONCAT(DISTINCT mad.day_of_week ORDER BY mad.day_of_week SEPARATOR ',') as availableDays
    FROM menu m
    LEFT JOIN menu_item_tags mit ON m.id = mit.menu_id
    LEFT JOIN menu_tags mt ON mit.tag_id = mt.id
    LEFT JOIN menu_available_days mad ON m.id = mad.menu_id
    GROUP BY m.id, m.type, m.title, m.description, m.price, m.created_at, m.updated_at
    ORDER BY m.id
  `)

  return menuItems.map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    description: item.description,
    price: parseFloat(item.price),
    tags: item.tags
      ? item.tags.split(',').map((tag) => {
          const [color, name] = tag.split(':')
          return [color, name]
        })
      : [],
    availableDays: item.availableDays
      ? item.availableDays.split(',').map((day) => parseInt(day))
      : [],
  }))
}

// Functions for working with restaurants
async function loadRestaurants() {
  const restaurants = await query(`
    SELECT 
      id,
      name,
      address,
      working_hours as workingHours,
      latitude as lat,
      longitude as lng
    FROM restaurants
    ORDER BY id
  `)

  return restaurants.map((r) => ({
    id: r.id,
    name: r.name,
    address: r.address,
    workingHours: r.workingHours,
    coordinates: {
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lng),
    },
  }))
}

// Functions for working with orders
async function loadOrders(userId = null, isAdmin = false) {
  let ordersQuery
  let params = []

  if (isAdmin) {
    ordersQuery = `
      SELECT 
        o.id,
        o.user_id as userId,
        o.restaurant_id as restaurantId,
        o.total_price as totalPrice,
        o.status,
        o.created_at as createdAt,
        o.updated_at as updatedAt,
        u.email as userEmail
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `
  } else {
    ordersQuery = `
      SELECT 
        id,
        user_id as userId,
        restaurant_id as restaurantId,
        total_price as totalPrice,
        status,
        created_at as createdAt,
        updated_at as updatedAt
      FROM orders
      WHERE user_id = ?
      ORDER BY created_at DESC
    `
    params = [userId]
  }

  const orders = await query(ordersQuery, params)

  // Load order items for each order
  for (const order of orders) {
    const orderItems = await query(
      `
      SELECT 
        oi.id,
        oi.menu_id as menuId,
        m.title,
        oi.quantity,
        oi.price,
        oi.subtotal
      FROM order_items oi
      JOIN menu m ON oi.menu_id = m.id
      WHERE oi.order_id = ?
    `,
      [order.id]
    )

    order.items = orderItems.map((item) => ({
      id: item.menuId,
      title: item.title,
      price: parseFloat(item.price),
      quantity: item.quantity,
      subtotal: parseFloat(item.subtotal),
    }))

    order.subtotal = parseFloat(order.totalPrice)
    order.deliveryDate = order.createdAt
      ? new Date(order.createdAt).toISOString().split('T')[0]
      : null
    order.deliveryTime = null // deliveryTime не хранится в текущей схеме БД
  }

  return orders
}

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
    req.user = user
    next()
  })
}

app.get('/api/test', (req, res) => {
  res.json({
    message: 'Express works!',
    timestamp: new Date().toISOString(),
    status: 'success',
  })
})

app.get('/api/menu', async (req, res) => {
  try {
    const menuItems = await loadMenu()
    res.json(menuItems)
  } catch (error) {
    console.error('Error loading menu:', error)
    res.status(500).json({ success: false, message: 'Error loading menu' })
  }
})

// API endpoint for getting restaurants
app.get('/api/restaurants', async (req, res) => {
  try {
    const restaurants = await loadRestaurants()
    res.json(restaurants)
  } catch (error) {
    console.error('Error loading restaurants:', error)
    res.status(500).json({ success: false, message: 'Error loading restaurants' })
  }
})

// API endpoint for getting menu by days of the week
app.get('/api/menu/days', async (req, res) => {
  try {
    const { days } = req.query

    if (!days) {
      const menuItems = await loadMenu()
      return res.json(menuItems)
    }

    // Parse days of the week from query parameter
    const selectedDays = days.split(',').map((day) => parseInt(day.trim()))

    // Query menu items available on selected days
    const placeholders = selectedDays.map(() => '?').join(',')
    const menuItems = await query(
      `
      SELECT DISTINCT
        m.id,
        m.type,
        m.title,
        m.description,
        m.price,
        m.created_at,
        m.updated_at,
        GROUP_CONCAT(DISTINCT CONCAT(mt.color, ':', mt.name) SEPARATOR ',') as tags,
        GROUP_CONCAT(DISTINCT mad.day_of_week ORDER BY mad.day_of_week SEPARATOR ',') as availableDays
      FROM menu m
      INNER JOIN menu_available_days mad ON m.id = mad.menu_id
      LEFT JOIN menu_item_tags mit ON m.id = mit.menu_id
      LEFT JOIN menu_tags mt ON mit.tag_id = mt.id
      WHERE mad.day_of_week IN (${placeholders})
      GROUP BY m.id, m.type, m.title, m.description, m.price, m.created_at, m.updated_at
      ORDER BY m.id
    `,
      selectedDays
    )

    const formattedMenu = menuItems.map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      description: item.description,
      price: parseFloat(item.price),
      tags: item.tags
        ? item.tags.split(',').map((tag) => {
            const [color, name] = tag.split(':')
            return [color, name]
          })
        : [],
      availableDays: item.availableDays
        ? item.availableDays.split(',').map((day) => parseInt(day))
        : [],
    }))

    res.json(formattedMenu)
  } catch (error) {
    console.error('Error loading menu:', error)
    res.status(500).json({ success: false, message: 'Error loading menu' })
  }
})

// Admin API endpoints for menu management
app.get('/api/admin/menu', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.email !== 'admin@gmail.com') {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }

    const menuItems = await loadMenu()
    res.json(menuItems)
  } catch (error) {
    console.error('Error loading menu:', error)
    res.status(500).json({ success: false, message: 'Error loading menu' })
  }
})

app.post('/api/admin/menu', authenticateToken, async (req, res) => {
  const conn = await getConnection()
  try {
    await conn.beginTransaction()

    // Check if user is admin
    if (req.user.email !== 'admin@gmail.com') {
      await conn.rollback()
      return res.status(403).json({ success: false, message: 'Access denied' })
    }

    const { type, title, description, price, tags = [], availableDays = [] } = req.body

    // Insert menu item
    const menuResult = await conn.query(
      'INSERT INTO menu (type, title, description, price) VALUES (?, ?, ?, ?)',
      [type, title, description, price]
    )
    const menuId = menuResult.insertId

    // Insert tags if provided
    if (tags.length > 0) {
      for (const [color, name] of tags) {
        // Get or create tag
        let tagResult = await conn.query(
          'SELECT id FROM menu_tags WHERE color = ? AND name = ?',
          [color, name]
        )

        let tagId
        if (tagResult.length === 0) {
          const insertTagResult = await conn.query(
            'INSERT INTO menu_tags (color, name) VALUES (?, ?)',
            [color, name]
          )
          tagId = insertTagResult.insertId
        } else {
          tagId = tagResult[0].id
        }

        // Link menu item to tag
        await conn.query('INSERT INTO menu_item_tags (menu_id, tag_id) VALUES (?, ?)', [
          menuId,
          tagId,
        ])
      }
    }

    // Insert available days
    if (availableDays.length > 0) {
      for (const day of availableDays) {
        await conn.query(
          'INSERT INTO menu_available_days (menu_id, day_of_week) VALUES (?, ?)',
          [menuId, day]
        )
      }
    }

    await conn.commit()

    // Load the created item with all relations
    const newItem = (await loadMenu()).find((item) => item.id === menuId)

    res.json({ success: true, item: newItem })
  } catch (error) {
    await conn.rollback()
    console.error('Error adding menu item:', error)
    res.status(500).json({ success: false, message: 'Error adding menu item' })
  } finally {
    conn.release()
  }
})

app.put('/api/admin/menu/:id', authenticateToken, async (req, res) => {
  const conn = await getConnection()
  try {
    await conn.beginTransaction()

    // Check if user is admin
    if (req.user.email !== 'admin@gmail.com') {
      await conn.rollback()
      return res.status(403).json({ success: false, message: 'Access denied' })
    }

    const itemId = parseInt(req.params.id)
    const { type, title, description, price, tags, availableDays } = req.body

    // Check if menu item exists
    const existingItem = await conn.query('SELECT id FROM menu WHERE id = ?', [itemId])
    if (existingItem.length === 0) {
      await conn.rollback()
      return res.status(404).json({ success: false, message: 'Menu item not found' })
    }

    // Update menu item
    await conn.query(
      'UPDATE menu SET type = ?, title = ?, description = ?, price = ? WHERE id = ?',
      [type, title, description, price, itemId]
    )

    // Update tags if provided
    if (tags !== undefined) {
      // Delete existing tags
      await conn.query('DELETE FROM menu_item_tags WHERE menu_id = ?', [itemId])

      // Insert new tags
      if (tags.length > 0) {
        for (const [color, name] of tags) {
          let tagResult = await conn.query(
            'SELECT id FROM menu_tags WHERE color = ? AND name = ?',
            [color, name]
          )

          let tagId
          if (tagResult.length === 0) {
            const insertTagResult = await conn.query(
              'INSERT INTO menu_tags (color, name) VALUES (?, ?)',
              [color, name]
            )
            tagId = insertTagResult.insertId
          } else {
            tagId = tagResult[0].id
          }

          await conn.query('INSERT INTO menu_item_tags (menu_id, tag_id) VALUES (?, ?)', [
            itemId,
            tagId,
          ])
        }
      }
    }

    // Update available days if provided
    if (availableDays !== undefined) {
      // Delete existing days
      await conn.query('DELETE FROM menu_available_days WHERE menu_id = ?', [itemId])

      // Insert new days
      if (availableDays.length > 0) {
        for (const day of availableDays) {
          await conn.query(
            'INSERT INTO menu_available_days (menu_id, day_of_week) VALUES (?, ?)',
            [itemId, day]
          )
        }
      }
    }

    await conn.commit()

    // Load the updated item
    const updatedItem = (await loadMenu()).find((item) => item.id === itemId)

    res.json({ success: true, item: updatedItem })
  } catch (error) {
    await conn.rollback()
    console.error('Error updating menu item:', error)
    res.status(500).json({ success: false, message: 'Error updating menu item' })
  } finally {
    conn.release()
  }
})

app.delete('/api/admin/menu/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.email !== 'admin@gmail.com') {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }

    const itemId = parseInt(req.params.id)

    // Check if menu item exists
    const existingItem = await query('SELECT id FROM menu WHERE id = ?', [itemId])
    if (existingItem.length === 0) {
      return res.status(404).json({ success: false, message: 'Menu item not found' })
    }

    // Delete menu item (cascade will handle related records)
    await query('DELETE FROM menu WHERE id = ?', [itemId])

    res.json({ success: true, message: 'Menu item deleted successfully' })
  } catch (error) {
    console.error('Error deleting menu item:', error)
    res.status(500).json({ success: false, message: 'Error deleting menu item' })
  }
})

// API endpoints for authentication

// Registration
app.post('/api/auth/register', async (req, res) => {
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
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      })
    }

    const user = await validateUser(email, password)

    // Create JWT token with 1 day expiration
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
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
app.post('/api/auth/validate', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    user: { email: req.user.email },
  })
})

// Logout (simply return success, token is removed on the client)
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Successful logout',
  })
})

// API endpoints for orders

// Create new order
app.post('/api/orders', authenticateToken, async (req, res) => {
  const conn = await getConnection()
  try {
    await conn.beginTransaction()

    const { restaurantId, deliveryDate, deliveryTime, items } = req.body
    const userId = req.user.id

    // Validate required fields
    if (!restaurantId || !deliveryDate || !deliveryTime || !items || items.length === 0) {
      await conn.rollback()
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      })
    }

    // Calculate total price
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const totalPrice = subtotal

    // Create order (note: deliveryDate and deliveryTime are not in current schema,
    // using created_at as deliveryDate. You may need to add these fields to orders table)
    const orderResult = await conn.query(
      'INSERT INTO orders (user_id, restaurant_id, total_price, status) VALUES (?, ?, ?, ?)',
      [userId, restaurantId, totalPrice, 'pending']
    )
    const orderId = orderResult.insertId

    // Insert order items
    for (const item of items) {
      await conn.query(
        'INSERT INTO order_items (order_id, menu_id, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.id, item.quantity, item.price, item.price * item.quantity]
      )
    }

    await conn.commit()

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      orderId: orderId,
    })
  } catch (error) {
    await conn.rollback()
    console.error('Error creating order:', error)
    res.status(500).json({
      success: false,
      message: 'Error creating order',
    })
  } finally {
    conn.release()
  }
})

// Get user orders
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const isAdmin = req.user.email === 'admin@gmail.com'

    const orders = await loadOrders(isAdmin ? null : userId, isAdmin)

    res.json({
      success: true,
      orders: orders,
    })
  } catch (error) {
    console.error('Error loading orders:', error)
    res.status(500).json({
      success: false,
      message: 'Error loading orders',
    })
  }
})

// Update order status (admin only)
app.put('/api/admin/orders/:id/status', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.email !== 'admin@gmail.com') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      })
    }

    const { status } = req.body
    const orderId = parseInt(req.params.id)

    const validStatuses = [
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'delivered',
      'cancelled',
    ]
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      })
    }

    // Check if order exists
    const existingOrder = await query('SELECT id FROM orders WHERE id = ?', [orderId])
    if (existingOrder.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      })
    }

    // Update order status
    await query('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
      status,
      orderId,
    ])

    // Load updated order
    const orders = await loadOrders(null, true)
    const updatedOrder = orders.find((order) => order.id === orderId)

    res.json({
      success: true,
      message: 'Order status updated',
      order: updatedOrder,
    })
  } catch (error) {
    console.error('Error updating order status:', error)
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
    })
  }
})

// Delete order (admin only)
app.delete('/api/admin/orders/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.email !== 'admin@gmail.com') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      })
    }

    const orderId = parseInt(req.params.id)

    // Check if order exists
    const existingOrder = await query('SELECT id FROM orders WHERE id = ?', [orderId])
    if (existingOrder.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      })
    }

    // Delete order (cascade will handle order_items)
    await query('DELETE FROM orders WHERE id = ?', [orderId])

    res.json({
      success: true,
      message: 'Order deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting order:', error)
    res.status(500).json({
      success: false,
      message: 'Error deleting order',
    })
  }
})

// Main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../front/index.html'))
})

// Menu page
app.get('/menu', (req, res) => {
  res.sendFile(path.join(__dirname, '../front/menu.html'))
})

// Contact page
app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, '../front/contact.html'))
})

// About page
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '../front/about.html'))
})

// Profile page
app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, '../front/profile.html'))
})

// Checkout page
app.get('/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, '../front/checkout.html'))
})

// Orders page
app.get('/orders', (req, res) => {
  res.sendFile(path.join(__dirname, '../front/orders.html'))
})

// For access: login='admin@gmail.com', password='password'
// Admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../front/admin.html'))
})

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
