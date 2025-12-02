const { query } = require('../db')

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

module.exports = {
  loadRestaurants,
}
