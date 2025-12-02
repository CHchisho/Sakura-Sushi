const { query, getConnection } = require('../db')

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
        o.delivery_date as deliveryDate,
        o.delivery_time as deliveryTime,
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
        updated_at as updatedAt,
        delivery_date as deliveryDate,
        delivery_time as deliveryTime
      FROM orders
      WHERE user_id = ?
      ORDER BY created_at DESC
    `
    params = [userId]
  }

  const orders = await query(ordersQuery, params)

  // Load order items for each order
  for (const order of orders) {
    // Convert BigInt IDs to Number to avoid serialization issues
    order.id = Number(order.id)
    order.userId = Number(order.userId)
    order.restaurantId = Number(order.restaurantId)

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
      id: Number(item.menuId),
      title: item.title,
      price: parseFloat(item.price),
      quantity: item.quantity,
      subtotal: parseFloat(item.subtotal),
    }))

    order.subtotal = parseFloat(order.totalPrice)
    order.deliveryDate = order.deliveryDate
      ? new Date(order.deliveryDate).toISOString().split('T')[0]
      : order.createdAt
      ? new Date(order.createdAt).toISOString().split('T')[0]
      : null
    order.deliveryTime = order.deliveryTime || null
  }

  return orders
}

async function createOrder(userId, restaurantId, deliveryDate, deliveryTime, items) {
  const conn = await getConnection()
  try {
    await conn.beginTransaction()

    // Validate required fields
    if (!restaurantId || !deliveryDate || !deliveryTime || !items || items.length === 0) {
      await conn.rollback()
      throw new Error('Missing required fields')
    }

    // Verify that user exists in database
    const userCheck = await conn.query('SELECT id FROM users WHERE id = ?', [userId])
    if (userCheck.length === 0) {
      await conn.rollback()
      throw new Error('User not found. Please login again.')
    }

    // Calculate total price
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const totalPrice = subtotal

    // Create order
    const orderResult = await conn.query(
      'INSERT INTO orders (user_id, restaurant_id, total_price, status, delivery_date, delivery_time) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, restaurantId, totalPrice, 'pending', deliveryDate || null, deliveryTime || null]
    )
    // Convert BigInt to Number to avoid serialization issues
    const orderId = Number(orderResult.insertId)

    // Insert order items
    for (const item of items) {
      await conn.query(
        'INSERT INTO order_items (order_id, menu_id, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.id, item.quantity, item.price, item.price * item.quantity]
      )
    }

    await conn.commit()

    return orderId
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}

async function updateOrderStatus(orderId, status) {
  const validStatuses = [
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'delivered',
    'cancelled',
  ]
  if (!validStatuses.includes(status)) {
    throw new Error('Invalid status')
  }

  // Check if order exists
  const existingOrder = await query('SELECT id FROM orders WHERE id = ?', [orderId])
  if (existingOrder.length === 0) {
    throw new Error('Order not found')
  }

  // Update order status
  await query('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
    status,
    orderId,
  ])
}

async function deleteOrder(orderId) {
  // Check if order exists
  const existingOrder = await query('SELECT id FROM orders WHERE id = ?', [orderId])
  if (existingOrder.length === 0) {
    throw new Error('Order not found')
  }

  // Delete order (cascade will handle order_items)
  await query('DELETE FROM orders WHERE id = ?', [orderId])
}

module.exports = {
  loadOrders,
  createOrder,
  updateOrderStatus,
  deleteOrder,
}
