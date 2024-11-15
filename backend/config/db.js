// File backend/config/db.js

const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'tugaspawm',
    password: 'qwertyuiop1234567890',
    port: 5432,
    ssl: false  // Explicitly disable SSL
});

// Add error handling
pool.on('connect', () => {
    console.log('Database connected successfully');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Database connected successfully at:', res.rows[0].now);
    }
});

module.exports = pool;