// File backend/config/env.js

const path = require('path');

function loadEnvironment() {
    // Load base environment variables
    require('dotenv').config({
        path: path.join(__dirname, '..', '.env')
    });

    // Load environment-specific variables
    const envFile = process.env.NODE_ENV === 'production' 
        ? '.env.production' 
        : '.env.development';

    require('dotenv').config({
        path: path.join(__dirname, '..', envFile)
    });

    // Validate environment
    const requiredVars = [
        'JWT_SECRET',
        'DATABASE_URL',
        'PORT',
        'NODE_ENV'
    ];

    const missing = requiredVars.filter(v => !process.env[v]);
    if (missing.length > 0) {
        throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }

    return {
        jwt: {
            secret: process.env.JWT_SECRET,
            expiresIn: '24h'
        },
        db: {
            url: process.env.DATABASE_URL
        },
        server: {
            port: process.env.PORT,
            clientUrl: process.env.CLIENT_URL
        },
        nodeEnv: process.env.NODE_ENV
    };
}

module.exports = loadEnvironment();