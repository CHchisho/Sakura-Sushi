const express = require('express')
const { loadMenu, loadMenuByDays } = require('../services/menuService')

const router = express.Router()

// Get all menu items
router.get('/', async (req, res) => {
  try {
    const menuItems = await loadMenu()
    res.json(menuItems)
  } catch (error) {
    console.error('Error loading menu:', error)
    res.status(500).json({ success: false, message: 'Error loading menu' })
  }
})

// Get menu by days of the week
router.get('/days', async (req, res) => {
  try {
    const { days } = req.query

    if (!days) {
      const menuItems = await loadMenu()
      return res.json(menuItems)
    }

    // Parse days of the week from query parameter
    const selectedDays = days.split(',').map((day) => parseInt(day.trim()))

    const formattedMenu = await loadMenuByDays(selectedDays)

    res.json(formattedMenu)
  } catch (error) {
    console.error('Error loading menu:', error)
    res.status(500).json({ success: false, message: 'Error loading menu' })
  }
})

module.exports = router
