// File backend/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const authMiddleware = require('./middleware/auth');

// Updated CORS configuration
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body);
    next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/quiz', require('./routes/quiz'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Test database connection
const pool = require('./config/db');
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Database connected successfully');
    }
});

app.get('/api/user/name', authMiddleware, async (req, res) => {
    try {
      const nim = req.user.nim;
      const result = await pool.query('SELECT full_name FROM users WHERE nim = $1', [nim]);
      if (result.rows.length > 0) {
        res.json({ name: result.rows[0].full_name });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (error) {
      console.error('Error fetching user name:', error);
      res.status(500).json({ error: 'Failed to fetch user name' });
    }
  });