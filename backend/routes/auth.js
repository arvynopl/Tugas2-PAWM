// File backend/routes/auth.js

const env = require('../config/env');
const router = require('express').Router();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Register route
router.post('/register', [
    body('nim').isLength({ min: 8 }),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
], async (req, res) => {
    try {
        const { nim, full_name, email, password } = req.body;
        
        // Validate input
        if (!nim || !full_name || !email || !password) {
            return res.status(400).json({ 
                error: 'All fields are required'
            });
        }
    
        // Generate salt and hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        
        // Insert user into database
        const result = await pool.query(
            'INSERT INTO users (nim, full_name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING nim, full_name, email',
            [nim, full_name, email, password_hash]
        );

        res.status(201).json({
            message: 'Registration successful',
            user: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            if (error.constraint === 'users_nim_key') {
                return res.status(400).json({ 
                    error: 'NIM sudah terdaftar. Silakan gunakan NIM lain atau login ke akun Anda.',
                    field: 'nim'
                });
            } else if (error.constraint === 'users_email_key') {
                return res.status(400).json({ 
                    error: 'Email sudah terdaftar. Silakan gunakan email lain atau login ke akun Anda.',
                    field: 'email'
                });
            }
        }
        console.error('Registration error:', error);
        res.status(500).json({ 
            error: 'Registration failed.' 
        });
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        console.log('Login attempt received:', {
            hasNim: !!req.body.nim,
            hasPassword: !!req.body.password
        });

        const { nim, password } = req.body;
        
        if (!nim || !password) {
            return res.status(400).json({ error: 'NIM and password are required' });
        }

        // Get user
        const result = await pool.query(
            'SELECT * FROM users WHERE nim = $1',
            [nim]
        );

        console.log('User query result:', {
            found: result.rows.length > 0
        });
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid NIM or password' });
        }
        
        // Check password
        const validPassword = await bcrypt.compare(
            password,
            result.rows[0].password_hash
        );
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid NIM or password' });
        }
        
        // Generate token
        const token = jwt.sign(
            { nim: result.rows[0].nim },
            env.jwt.secret,
            { expiresIn: env.jwt.expiresIn }
        );
        
        console.log('Login successful for user:', nim);
        
        res.json({ 
            token,
            user: {
                nim: result.rows[0].nim,
                full_name: result.rows[0].full_name,
                email: result.rows[0].email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

router.get('/name', authMiddleware, async (req, res) => {
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

// Logout route
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Check if the token exists in the database
    const result = await pool.query(
      'SELECT * FROM user_tokens WHERE token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Delete the token from the database
    await pool.query(
      'DELETE FROM user_tokens WHERE token = $1',
      [token]
    );

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

module.exports = router;