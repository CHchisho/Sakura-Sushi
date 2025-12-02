const express = require('express')
const { loadRestaurants } = require('../services/restaurantService')

const router = express.Router()

// Get all restaurants
router.get('/', async (req, res) => {
  try {
    const restaurants = await loadRestaurants()
    res.json(restaurants)
  } catch (error) {
    console.error('Error loading restaurants:', error)
    res.status(500).json({ success: false, message: 'Error loading restaurants' })
  }
})

module.exports = router
