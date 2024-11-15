// File backend/routes/auth.js

const router = require('express').Router();
const pool = require('../config/db');
const bcrypt = require('bcrypt-promise');
const jwt = require('jsonwebtoken');
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
      
      res.json({
        message: 'Registration successful',
        user: result.rows[0]
      });
    } catch (error) {
      if (error.code === '23505') { // unique violation
        if (error.constraint === 'users_nim_key') {
          return res.status(400).json({ error: 'NIM already registered' });
        } else if (error.constraint === 'users_email_key') {
          return res.status(400).json({ error: 'Email already registered' });
        }
      }
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

// Login route
router.post('/login', async (req, res) => {
    try {
        const { nim, password } = req.body;
        
        // Get user
        const result = await pool.query(
            'SELECT * FROM users WHERE nim = $1',
            [nim]
        );
        
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
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
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

module.exports = router;