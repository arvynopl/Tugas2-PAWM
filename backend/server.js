// File backend/server.js

const path = require('path');
const envFile = process.env.NODE_ENV === 'production' 
    ? '.env.production' 
    : '.env.development';

require('dotenv').config({
    path: path.join(__dirname, envFile)
});

const env = require('./config/env');
const express = require('express');
const cors = require('cors');
const authMiddleware = require('./middleware/auth');
const app = express();

// Update the CORS configuration section
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 600 // Increase preflight cache to 10 minutes
}));

// Add a preflight handler for all routes
app.options('*', cors());

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

// User name endpoint
app.get('/api/user/name', authMiddleware, async (req, res) => {
    try {
        const nim = req.user.nim;
        const result = await pool.query(
            'SELECT full_name FROM users WHERE nim = $1', 
            [nim]
        );
        
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
app.use('/api/user', require('./routes/user'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', {
        message: err.message,
        stack: err.stack,
        body: req.body
    });
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

const PORT = env.server.port || 5000;
app.listen(PORT, () => {
    console.log(`Server running in ${env.nodeEnv} mode on port ${PORT}`);
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