const express = require('express')
const path = require('path')

const router = express.Router()

// Main page
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../front/index.html'))
})

// Menu page
router.get('/menu', (req, res) => {
  res.sendFile(path.join(__dirname, '../../front/menu.html'))
})

// Contact page
router.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, '../../front/contact.html'))
})

// About page
router.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '../../front/about.html'))
})

// Profile page
router.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, '../../front/profile.html'))
})

// Checkout page
router.get('/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, '../../front/checkout.html'))
})

// Orders page
router.get('/orders', (req, res) => {
  res.sendFile(path.join(__dirname, '../../front/orders.html'))
})

// Admin page
router.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../../front/admin.html'))
})

module.exports = router
