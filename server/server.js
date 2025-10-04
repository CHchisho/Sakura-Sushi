const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

// JWT secret key 
const JWT_SECRET = process.env.JWT_SECRET || 'sakura-sushi-secret-key-2024';

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(express.static(path.join(__dirname, '../front')));

const USERS_FILE = path.join(__dirname, 'users.json');

// Functions for working with users
async function loadUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If the file does not exist, create an empty array
    return [];
  }
}

async function saveUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

async function findUserByEmail(email) {
  const users = await loadUsers();
  return users.find(user => user.email === email);
}

async function createUser(email, password) {
  const users = await loadUsers();
  
  // Check if the user exists
  if (users.find(user => user.email === email)) {
    throw new Error('Пользователь с таким email уже существует');
  }
  
  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const newUser = {
    id: Date.now(), // Simple ID
    email,
    password: hashedPassword,
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  await saveUsers(users);
  
  return { id: newUser.id, email: newUser.email };
}

async function validateUser(email, password) {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error('User not found');
  }
  
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new Error('Invalid password');
  }
  
  return { id: user.id, email: user.email };
}

// Middleware for checking JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token not provided' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

const menuItems = [
  {
    id: 1,
    type: 'Rolls',
    title: 'Sakura Roll',
    description: 'Salmon, avocado, cucumber with pink tobiko caviar',
    tags: [],
    price: 12,
  },
  {
    id: 2,
    type: 'Sushi',
    title: 'Salmon Sushi',
    description: 'Fresh Norwegian salmon on rice',
    tags: [],
    price: 13,
  },
  {
    id: 3,
    type: 'Rolls',
    title: 'Tofu Roll',
    description: 'Teriyaki tofu, cucumber, iceberg lettuce',
    tags: [['g', 'Vegan']],
    price: 14,
  },
  {
    id: 4,
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

// API endpoints for authentication

// Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 6 characters'
      });
    }
    
    const user = await createUser(email, password);
    
    res.status(201).json({
      success: true,
      message: 'User successfully registered',
      user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    const user = await validateUser(email, password);
    
    // Create JWT token with 1 day expiration
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    res.json({
      success: true,
      message: 'Successful login',
      token,
      user
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
});

// Validate token
app.post('/api/auth/validate', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    user: { email: req.user.email }
  });
});

// Logout (simply return success, token is removed on the client)
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Successful logout'
  });
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

// Profile page
app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, '../front/profile.html'));
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
