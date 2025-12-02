const express = require('express')
const { authenticateToken } = require('../middleware/auth')
const { loadOrders, createOrder } = require('../services/orderService')

const router = express.Router()

// Create new order
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { restaurantId, deliveryDate, deliveryTime, items } = req.body
    // Ensure userId is a number
    const userId = Number(req.user.id)

    if (
      !userId ||
      isNaN(userId) ||
      userId <= 0 ||
      userId > 2147483647 ||
      !Number.isInteger(userId)
    ) {
      console.error('Invalid user ID:', req.user.id, 'converted to:', userId)
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID. Please login again.',
      })
    }

    const orderId = await createOrder(userId, restaurantId, deliveryDate, deliveryTime, items)

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      orderId: orderId,
    })
  } catch (error) {
    console.error('Error creating order:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating order',
    })
  }
})

// Get user orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = Number(req.user.id)
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

module.exports = router
