const express = require('express')
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const {
  loadMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require('../services/menuService')
const { loadOrders, updateOrderStatus, deleteOrder } = require('../services/orderService')

const router = express.Router()

// Apply authentication and admin check to all admin routes
router.use(authenticateToken)
router.use(requireAdmin)

// Menu management routes
router.get('/menu', async (req, res) => {
  try {
    const menuItems = await loadMenu()
    res.json(menuItems)
  } catch (error) {
    console.error('Error loading menu:', error)
    res.status(500).json({ success: false, message: 'Error loading menu' })
  }
})

router.post('/menu', async (req, res) => {
  try {
    const { type, title, description, price, tags = [], availableDays = [] } = req.body

    const newItem = await createMenuItem(type, title, description, price, tags, availableDays)

    res.json({ success: true, item: newItem })
  } catch (error) {
    console.error('Error adding menu item:', error)
    res
      .status(500)
      .json({ success: false, message: error.message || 'Error adding menu item' })
  }
})

router.put('/menu/:id', async (req, res) => {
  try {
    const itemId = parseInt(req.params.id)
    const { type, title, description, price, tags, availableDays } = req.body

    const updatedItem = await updateMenuItem(
      itemId,
      type,
      title,
      description,
      price,
      tags,
      availableDays
    )

    res.json({ success: true, item: updatedItem })
  } catch (error) {
    console.error('Error updating menu item:', error)
    if (error.message === 'Menu item not found') {
      return res.status(404).json({ success: false, message: error.message })
    }
    res
      .status(500)
      .json({ success: false, message: error.message || 'Error updating menu item' })
  }
})

router.delete('/menu/:id', async (req, res) => {
  try {
    const itemId = parseInt(req.params.id)

    await deleteMenuItem(itemId)

    res.json({ success: true, message: 'Menu item deleted successfully' })
  } catch (error) {
    console.error('Error deleting menu item:', error)
    if (error.message === 'Menu item not found') {
      return res.status(404).json({ success: false, message: error.message })
    }
    res
      .status(500)
      .json({ success: false, message: error.message || 'Error deleting menu item' })
  }
})

// Order management routes
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    const orderId = parseInt(req.params.id)

    await updateOrderStatus(orderId, status)

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
    if (error.message === 'Order not found' || error.message === 'Invalid status') {
      const statusCode = error.message === 'Order not found' ? 404 : 400
      return res.status(statusCode).json({
        success: false,
        message: error.message,
      })
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating order status',
    })
  }
})

router.delete('/orders/:id', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id)

    await deleteOrder(orderId)

    res.json({
      success: true,
      message: 'Order deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting order:', error)
    if (error.message === 'Order not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      })
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting order',
    })
  }
})

module.exports = router
