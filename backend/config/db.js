// File backend/config/db.js

const { Pool } = require('pg');

const config = process.env.NODE_ENV === 'production'
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      }
    : {
        user: 'postgres',
        host: 'localhost',
        database: 'tugaspawm',
        password: 'qwertyuiop1234567890',
        port: 5432,
        ssl: false
      };

console.log('Database configuration:', {
    ...config,
    password: '[REDACTED]' // Don't log the actual password
});

const pool = new Pool(
    process.env.NODE_ENV === 'production'
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      }
    : {
        user: 'postgres',
        host: 'localhost',
        database: 'tugaspawm', // make sure this matches your database name
        password: 'qwertyuiop1234567890', // make sure this matches your password
        port: 5432,
        ssl: false
      }
);

// Add error handler
pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
});

// Add connection test
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('Database connection test successful');
        
        // Test query
        const result = await client.query('SELECT version()');
        console.log('Database version:', result.rows[0].version);
        
        client.release();
    } catch (err) {
        console.error('Database connection test failed:', err);
    }
};

testConnection();

module.exports = pool;