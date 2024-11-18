// File backend/routes/user.js

const router = require('express').Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

// Get user name endpoint
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

// Get user profile endpoint
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const nim = req.user.nim;
        const result = await pool.query(
            'SELECT nim, full_name, email, created_at FROM users WHERE nim = $1',
            [nim]
        );

        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});

module.exports = router;