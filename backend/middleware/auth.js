// File backend/middleware/auth.js

const jwt = require('jsonwebtoken');
const env = require('../config/env');

function authMiddleware(req, res, next) {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        try {
            const decoded = jwt.verify(token, env.jwt.secret);
            req.user = { nim: decoded.nim };
            next();
        } catch (tokenError) {
            console.error('Token verification error:', tokenError);
            return res.status(401).json({ error: 'Invalid token' });
        }
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
}

module.exports = authMiddleware;