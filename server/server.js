const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(express.static(path.join(__dirname, '../front')));

const menuItems = [
  {
    type: 'Rolls',
    title: 'Sakura Roll',
    description: 'Salmon, avocado, cucumber with pink tobiko caviar',
    tags: [],
    price: 12,
  },
  {
    type: 'Sushi',
    title: 'Salmon Sushi',
    description: 'Fresh Norwegian salmon on rice',
    tags: [],
    price: 13,
  },
  {
    type: 'Rolls',
    title: 'Tofu Roll',
    description: 'Teriyaki tofu, cucumber, iceberg lettuce',
    tags: [['g', 'Vegan']],
    price: 14,
  },
  {
    type: 'Hot Dishes',
    title: 'Miso Soup',
    description: 'Traditional Japanese soup with tofu and seaweed',
    tags: [
      ['g', 'Vegan'],
      ['b', 'Gluten-free'],
    ],
    price: 15,
  },
];

app.get('/api/test', (req, res) => {
  res.json({
    message: 'Express works!',
    timestamp: new Date().toISOString(),
    status: 'success',
  });
});

app.get('/api/menu', (req, res) => {
  res.json(menuItems);
});

// Main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../front/index.html'));
});

// Menu page

app.get('/menu', (req, res) => {
  res.sendFile(path.join(__dirname, '../front/menu.html'));
});

// Contact page
app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, '../front/contact.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {},
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`📱 Open http://localhost:${PORT} in your browser`);
  console.log(`🔍 API test: http://localhost:${PORT}/api/test`);
});

module.exports = app;
